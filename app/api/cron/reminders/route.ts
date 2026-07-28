// POST /api/cron/reminders
// Sends push notifications for habits whose reminder_time falls within the
// current 5-minute window AND have not been completed today.
//
// Schedule: every 5 minutes via Vercel Cron (vercel.json) or any external cron.
// Auth: pass Authorization: Bearer <CRON_SECRET> header.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/webpush';

function ok<T>(data: T) {
  return NextResponse.json({ data });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Use the service-role key so we can read all users' habits & subscriptions
function getAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role not configured');
  return createClient(url, key);
}

// Build a "HH:MM" string for the current time in a given timezone
function currentTimeInTZ(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  }
}

// Calendar date (YYYY-MM-DD) for the current instant in a given timezone.
// Cron runs in UTC, so a user in IST near midnight already lives in tomorrow's
// row. Using a UTC date for completion checks would either silently mark
// already-done habits as due, or skip habits whose entry was logged "today" in
// the user's local calendar.
function currentDateInTZ(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return parts; // en-CA gives YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// Produce all "HH:MM" strings within a ±2-minute window of `nowHHMM`
function timeWindow(nowHHMM: string): string[] {
  const [h, m] = nowHHMM.split(':').map(Number);
  const slots: string[] = [];
  for (let delta = -2; delta <= 2; delta++) {
    let mm = m + delta;
    let hh = h;
    if (mm < 0)  { mm += 60; hh -= 1; }
    if (mm >= 60){ mm -= 60; hh += 1; }
    hh = ((hh % 24) + 24) % 24;
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return slots;
}

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return err('Unauthorized', 401);
    }
  }

  let supabase: ReturnType<typeof getAdminClient>;
  try {
    supabase = getAdminClient();
  } catch {
    return err('Supabase service role not configured — skipping cron run.', 503);
  }

  // ── Fetch all active habits that have a reminder_time ────────────────
  const { data: habits, error: habitsErr } = await supabase
    .from('habits')
    .select('id, user_id, name, icon, reminder_time')
    .eq('is_archived', false)
    .not('reminder_time', 'is', null);

  if (habitsErr) {
    console.error('[cron/reminders] habits fetch error:', habitsErr);
    return err('DB error fetching habits', 500);
  }
  if (!habits || habits.length === 0) return ok({ sent: 0 });

  // ── Group habits by user_id ───────────────────────────────────────────
  const byUser: Record<string, typeof habits> = {};
  for (const h of habits) {
    if (!byUser[h.user_id]) byUser[h.user_id] = [];
    byUser[h.user_id].push(h);
  }

  const userIds = Object.keys(byUser);

  // ── Fetch user timezones from profiles ───────────────────────────────
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, timezone')
    .in('id', userIds);

  const tzMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    tzMap[p.id] = p.timezone ?? 'UTC';
  }

  // ── Fetch completions per user, scoped to that user's local calendar
  // date(s). The previous implementation used a single UTC date for all users,
  // which silently re-fired reminders for users whose local calendar had
  // already rolled to "tomorrow" relative to UTC.
  const localDates = Array.from(new Set(userIds.map((u) => currentDateInTZ(tzMap[u] ?? 'UTC'))));
  const { data: entries } = await supabase
    .from('habit_entries')
    .select('habit_id, entry_date, user_id')
    .eq('is_completed', true)
    .in('entry_date', localDates)
    .in('user_id', userIds);

  const doneByUserDate = new Map<string, Set<string>>();
  for (const e of entries ?? []) {
    const key = `${e.user_id}|${e.entry_date}`;
    const set = doneByUserDate.get(key) ?? new Set<string>();
    set.add(e.habit_id);
    doneByUserDate.set(key, set);
  }

  // ── Fetch all push subscriptions for these users ──────────────────────
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth_key')
    .in('user_id', userIds);

  const subsByUser: Record<string, typeof subs> = {};
  for (const s of subs ?? []) {
    if (!subsByUser[s.user_id]) subsByUser[s.user_id] = [];
    subsByUser[s.user_id]!.push(s);
  }

  // ── Send notifications ────────────────────────────────────────────────
  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const userId of userIds) {
    const userSubs = subsByUser[userId] ?? [];
    if (userSubs.length === 0) continue;

    const tz = tzMap[userId] ?? 'UTC';
    const nowLocal = currentTimeInTZ(tz);
    const todayLocal = currentDateInTZ(tz);
    const window = timeWindow(nowLocal);
    const userDone = doneByUserDate.get(`${userId}|${todayLocal}`) ?? new Set<string>();

    const dueHabits = (byUser[userId] ?? []).filter(
      (h) => !userDone.has(h.id) && h.reminder_time && window.includes(h.reminder_time.slice(0, 5))
    );
    if (dueHabits.length === 0) continue;

    // Build notification payload — group multiple habits into one notification
    const names = dueHabits.map((h) => h.name);
    const body =
      names.length === 1
        ? `Time to do: ${names[0]}!`
        : `Time for ${names.length} habits: ${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}`;

    for (const sub of userSubs) {
      try {
        await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          { title: 'Productivity Master Reminder', body, url: '/dashboard', tag: 'productivity-master-reminder' }
        );
        sent++;
      } catch (e: unknown) {
        // 410 Gone = subscription expired; mark for cleanup
        if ((e as { statusCode?: number }).statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error('[cron/reminders] push send error:', e);
        }
      }
    }
  }

  // ── Cleanup stale subscriptions ───────────────────────────────────────
  if (staleEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints);
  }

  return ok({ sent, staleRemoved: staleEndpoints.length });
}

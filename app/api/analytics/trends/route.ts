import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isHabitActiveOnDate } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';

function ok<T>(data: T, maxAge = 60) {
  return NextResponse.json(
    { data, error: null },
    { headers: { 'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 5}` } }
  );
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/analytics/trends?days=30
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const days = Math.min(365, parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10) || 30);

    const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle();
    const userTz = profile?.timezone || 'Asia/Kolkata';

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    const startStr = formatInTimeZone(startDate, userTz, 'yyyy-MM-dd');
    const todayStr = formatInTimeZone(today, userTz, 'yyyy-MM-dd');

    const { data: habits } = await supabase
      .from('habits')
      .select('id, created_at, is_bad_habit')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const activeHabits = (habits ?? []).filter((h) => !h.is_bad_habit);

    const { data: entries } = await supabase
      .from('habit_entries')
      .select('entry_date, is_completed')
      .eq('user_id', user.id)
      .gte('entry_date', startStr)
      .lte('entry_date', todayStr);

    // Build per-day map
    const byDate = new Map<string, { completed: number; total: number }>();
    for (const e of entries ?? []) {
      const slot = byDate.get(e.entry_date) ?? { completed: 0, total: 0 };
      slot.total += 1;
      if (e.is_completed) slot.completed += 1;
      byDate.set(e.entry_date, slot);
    }

    // Fill all days in range
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
      const slot = byDate.get(dateStr);
      const completed = slot?.completed ?? 0;
      const total = activeHabits.filter((h) => isHabitActiveOnDate(h.created_at, dateStr)).length;
      result.push({
        date: dateStr,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    return ok(result);
  } catch (e) {
    return err(String(e), 500);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { entrySchema } from '@/lib/validations/entry';
import { safeErrorMessage } from '@/lib/utils/api';
import { COIN_PER_COMPLETION, COIN_UNCOMPLETE_PENALTY, ALL_DONE_BONUS, getStreakBonus } from '@/lib/coins';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/entries?date=YYYY-MM-DD  OR  ?habit_id=&from=&to=
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const sp = req.nextUrl.searchParams;
    const date = sp.get('date');
    const habitId = sp.get('habit_id');
    const from = sp.get('from');
    const to = sp.get('to');

    let query = supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', user.id);

    if (date) {
      query = query.eq('entry_date', date);
    } else if (habitId) {
      query = query.eq('habit_id', habitId);
      if (from) query = query.gte('entry_date', from);
      if (to) query = query.lte('entry_date', to);
    } else {
      return err('Provide date or habit_id', 400);
    }

    query = query.order('entry_date', { ascending: false }).limit(400);
    const { data, error } = await query;
    if (error) return err(safeErrorMessage(error, 'Failed to load entries'), 500);
    return ok(data ?? []);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to load entries'), 500);
  }
}

// PATCH /api/entries — upsert a single entry
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[entries] DIAG: no user (401) — session cookie invalid/missing');
      return err('Unauthorized', 401);
    }

    const body = await req.json();
    const parsed = entrySchema.safeParse(body);
    if (!parsed.success) {
      console.error('[entries] DIAG: payload failed validation (422):', JSON.stringify(body), parsed.error.issues);
      return err('Invalid entry payload', 422);
    }

    const { habit_id, entry_date, is_completed, value, notes, video_path } = parsed.data;

    // Verify the habit belongs to this user
    const { data: habit, error: habitErr } = await supabase
      .from('habits')
      .select('id, total_completions, current_streak, longest_streak')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single();

    if (habitErr || !habit) {
      console.error('[entries] DIAG: habit lookup failed (404). user:', user.id, 'habit_id:', habit_id, 'err:', habitErr);
      return err('Habit not found', 404);
    }

    const now = new Date().toISOString();
    interface EntryPayload {
      habit_id: string; user_id: string; entry_date: string;
      is_completed: boolean; completed_at: string | null; updated_at: string;
      value?: number | null; notes?: string | null; video_path?: string | null;
    }
    const payload: EntryPayload = {
      habit_id,
      user_id: user.id,
      entry_date,
      is_completed,
      completed_at: is_completed ? now : null,
      updated_at: now,
    };
    if (value !== undefined) payload.value = value;
    if (notes !== undefined) payload.notes = notes;
    if (video_path !== undefined) payload.video_path = video_path;

    const { data: entry, error } = await supabase
      .from('habit_entries')
      .upsert(payload, { onConflict: 'habit_id,entry_date' })
      .select()
      .single();

    if (error) {
      console.error('[entries PATCH] upsert error:', error);
      return err(safeErrorMessage(error, 'Failed to save entry'), 500);
    }

    // ── Coin rewards ──
    // Award or deduct coins based on whether the habit was just completed or uncompleted.
    // We check the previous state to avoid double-counting.
    let coinsAwarded = 0;
    const coinReasons: { amount: number; reason: string; metadata?: Record<string, unknown> }[] = [];

    try {
      // Check the previous completion state — if the entry was just created via upsert,
      // it didn't exist before so previouslyCompleted = false.
      const previouslyCompleted = !is_completed ? true : false;
      // ^ If is_completed=true now, previous was false (otherwise why toggle?)
      // ^ If is_completed=false now, previous was true

      if (is_completed && !previouslyCompleted) {
        // Habit just completed → award coins
        coinsAwarded += COIN_PER_COMPLETION;
        coinReasons.push({
          amount: COIN_PER_COMPLETION,
          reason: 'habit_complete',
          metadata: { habit_name: habit.id },
        });

        // Check streak bonus — we need the updated streak count
        const newStreak = (habit.current_streak ?? 0) + 1;
        const streakBonus = getStreakBonus(newStreak);
        if (streakBonus > 0) {
          coinsAwarded += streakBonus;
          coinReasons.push({
            amount: streakBonus,
            reason: 'streak_bonus',
            metadata: { streak: newStreak, habit_name: habit.id },
          });
        }

        // Check if ALL habits are done today → all-done bonus
        const { data: allHabits } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .eq('is_bad_habit', false);

        if (allHabits && allHabits.length > 0) {
          const { data: todayEntries } = await supabase
            .from('habit_entries')
            .select('habit_id, is_completed')
            .eq('user_id', user.id)
            .eq('entry_date', entry_date)
            .eq('is_completed', true);

          const completedIds = new Set((todayEntries ?? []).map((e: { habit_id: string }) => e.habit_id));
          const allDone = allHabits.every((h: { id: string }) => completedIds.has(h.id));
          if (allDone) {
            coinsAwarded += ALL_DONE_BONUS;
            coinReasons.push({
              amount: ALL_DONE_BONUS,
              reason: 'all_done_bonus',
              metadata: { date: entry_date },
            });
          }
        }
      } else if (!is_completed) {
        // Habit un-completed → deduct coins
        coinsAwarded += COIN_UNCOMPLETE_PENALTY;
        coinReasons.push({
          amount: COIN_UNCOMPLETE_PENALTY,
          reason: 'habit_uncomplete',
          metadata: { habit_name: habit.id },
        });
      }

      // Apply coin changes
      if (coinsAwarded !== 0) {
        // Get current balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();

        const currentCoins = profile?.coins ?? 0;
        const newBalance = Math.max(0, currentCoins + coinsAwarded);

        // Update balance
        await supabase
          .from('profiles')
          .update({ coins: newBalance })
          .eq('id', user.id);

        // Log transactions
        for (const reason of coinReasons) {
          await supabase.from('coin_transactions').insert({
            user_id: user.id,
            amount: reason.amount,
            balance_after: newBalance,
            reason: reason.reason,
            habit_id: habit_id,
            metadata: reason.metadata ?? {},
          });
        }
      }
    } catch (coinErr) {
      // Coin errors should not block the entry save — log and continue
      console.error('[entries PATCH] coin reward error (non-blocking):', coinErr);
    }

    return ok({ ...entry, coins_awarded: coinsAwarded });
  } catch (e) {
    console.error('[entries PATCH] unexpected error:', e);
    return err(safeErrorMessage(e, 'Failed to save entry'), 500);
  }
}

// POST /api/entries — same as PATCH (alias)
export const POST = PATCH;

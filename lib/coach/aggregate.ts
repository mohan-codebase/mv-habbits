import type { SupabaseClient } from '@supabase/supabase-js';
import { computeBestStreak, computeLifetimeCompletions } from '@/lib/stats/habitStats';

/**
 * Compact, privacy-light summary of a user's habit history.
 *
 * RAM notes: we fetch only the four columns we need, bound the query by date,
 * and fold every row into fixed-size counters in a single pass — no row arrays
 * are retained, and this small object (not the raw entries) is what gets sent
 * to the model. For 1 year of ~10 habits that's a few thousand rows folded into
 * ~1 KB of JSON.
 */
export interface HabitStat {
  name: string;
  isBad: boolean;
  completions: number;
  trackedDays: number;
  completionRate: number; // 0–100
  currentStreak: number;
  longestStreak: number;
}

export interface CoachSummary {
  windowDays: number;
  from: string;
  to: string;
  totalHabits: number;
  totalCompletions: number;
  /** Lifetime completions across non-archived, non-bad habits — matches the
   *  dashboard Overview's "Best Streak"/total definition exactly (see
   *  lib/stats/habitStats.ts), unlike `totalCompletions` above which is
   *  recounted from raw entries within `windowDays`. */
  lifetimeCompletions: number;
  bestStreak: number;
  bestStreakHabitName: string;
  activeDays: number; // distinct days with ≥1 completion
  overallCompletionRate: number; // 0–100
  /** Completions by weekday, Sun..Sat. */
  weekday: number[];
  /** Completions by part of day (from completed_at, UTC — approximate). */
  partOfDay: { morning: number; afternoon: number; evening: number; night: number };
  habits: HabitStat[];
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function buildCoachSummary(
  supabase: SupabaseClient,
  userId: string,
  windowDays: number,
): Promise<CoachSummary | null> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - windowDays);
  const fromStr = ymd(from);
  const toStr = ymd(to);

  // Small: one row per habit.
  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, is_bad_habit, is_archived, current_streak, longest_streak, total_completions')
    .eq('user_id', userId);

  if (!habits || habits.length === 0) return null;

  // Bounded, minimal-column entry pull. Cap defends against pathological rows.
  const { data: entries } = await supabase
    .from('habit_entries')
    .select('habit_id, entry_date, is_completed, completed_at')
    .eq('user_id', userId)
    .gte('entry_date', fromStr)
    .order('entry_date', { ascending: false })
    .limit(20000);

  // Fixed-size accumulators — folded in a single pass.
  const perHabit = new Map<string, { completions: number; tracked: number }>();
  const weekday = new Array(7).fill(0);
  const partOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const activeDaySet = new Set<string>();
  let totalCompletions = 0;

  for (const h of habits) perHabit.set(h.id as string, { completions: 0, tracked: 0 });

  for (const e of entries ?? []) {
    const slot = perHabit.get(e.habit_id as string);
    if (!slot) continue;
    slot.tracked += 1;
    if (!e.is_completed) continue;
    slot.completions += 1;
    totalCompletions += 1;
    activeDaySet.add(e.entry_date as string);

    // entry_date is 'YYYY-MM-DD' — parse the weekday without a Date timezone trap.
    const [y, m, d] = (e.entry_date as string).split('-').map(Number);
    weekday[new Date(y, m - 1, d).getDay()] += 1;

    if (e.completed_at) {
      const hr = new Date(e.completed_at as string).getUTCHours();
      if (hr < 6) partOfDay.night += 1;
      else if (hr < 12) partOfDay.morning += 1;
      else if (hr < 18) partOfDay.afternoon += 1;
      else partOfDay.evening += 1;
    }
  }

  const habitStats: HabitStat[] = habits.map((h) => {
    const s = perHabit.get(h.id as string)!;
    return {
      name: h.name as string,
      isBad: Boolean(h.is_bad_habit),
      completions: s.completions,
      trackedDays: s.tracked,
      completionRate: s.tracked ? Math.round((s.completions / s.tracked) * 100) : 0,
      currentStreak: (h.current_streak as number) ?? 0,
      longestStreak: (h.longest_streak as number) ?? 0,
    };
  });

  const totalTracked = habitStats.reduce((sum, h) => sum + h.trackedDays, 0);

  const { bestStreak, bestStreakHabitName } = computeBestStreak(habits);
  const lifetimeCompletions = computeLifetimeCompletions(habits);

  return {
    windowDays,
    from: fromStr,
    to: toStr,
    totalHabits: habits.length,
    totalCompletions,
    lifetimeCompletions,
    bestStreak,
    bestStreakHabitName,
    activeDays: activeDaySet.size,
    overallCompletionRate: totalTracked ? Math.round((totalCompletions / totalTracked) * 100) : 0,
    weekday,
    partOfDay,
    habits: habitStats,
  };
}

/** Human-readable label for the strongest weekday — handy for the UI. */
export function bestWeekday(weekday: number[]): string | null {
  const max = Math.max(...weekday);
  if (max <= 0) return null;
  return DOW[weekday.indexOf(max)];
}

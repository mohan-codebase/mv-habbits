/**
 * Shared habit-stat definitions used by both the dashboard Overview and the
 * Year-in-Review page, so the two surfaces always report identical numbers
 * for the same underlying data.
 *
 * Definitions:
 *  - "Best streak" = the highest `current_streak` (live, today's state — not
 *    `longest_streak`, which is a historical high that can be stale).
 *  - "Lifetime completions" = the sum of each habit's `total_completions`
 *    running counter (not a recount from raw entries over some window).
 *  - Both are computed over the same habit set: non-archived, non-"bad"
 *    (avoid) habits only.
 */

export interface HabitStatsInput {
  id?: string;
  name?: string;
  is_archived?: boolean | null;
  is_bad_habit?: boolean | null;
  current_streak?: number | null;
  total_completions?: number | null;
}

/** Habits that count toward "best streak" / "lifetime completions": not archived, not a bad/avoid habit. */
export function filterStatHabits<T extends HabitStatsInput>(habits: T[]): T[] {
  return habits.filter((h) => !h.is_archived && !h.is_bad_habit);
}

export interface BestStreakResult {
  bestStreak: number;
  bestStreakHabitName: string;
}

/** Current best streak across eligible habits (uses live current_streak, not longest_streak). */
export function computeBestStreak(habits: HabitStatsInput[]): BestStreakResult {
  const eligible = filterStatHabits(habits);
  const best = eligible.reduce<HabitStatsInput | null>(
    (acc, h) => (!acc || (h.current_streak ?? 0) > (acc.current_streak ?? 0) ? h : acc),
    null
  );
  return {
    bestStreak: best?.current_streak ?? 0,
    bestStreakHabitName: best?.name ?? '',
  };
}

/** Lifetime completions across eligible habits, from each habit's running total_completions. */
export function computeLifetimeCompletions(habits: HabitStatsInput[]): number {
  return filterStatHabits(habits).reduce((sum, h) => sum + (h.total_completions ?? 0), 0);
}

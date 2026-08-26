/**
 * Coin reward rules — centralised so the API route and any future
 * server-side logic use the same values.
 */

/** Base coins for completing a habit */
export const COIN_PER_COMPLETION = 10;

/** Penalty for un-completing a habit (negative) */
export const COIN_UNCOMPLETE_PENALTY = -10;

/** Bonus coins when the user's streak on a habit reaches a milestone */
export const STREAK_BONUSES: Record<number, number> = {
  3: 5,
  7: 15,
  14: 30,
  21: 50,
  30: 75,
  60: 150,
  90: 250,
  100: 500,
  365: 1000,
};

/** Bonus for completing ALL habits on a single day */
export const ALL_DONE_BONUS = 25;

/** Get the streak bonus for a given streak count (0 if no milestone hit) */
export function getStreakBonus(streak: number): number {
  return STREAK_BONUSES[streak] ?? 0;
}

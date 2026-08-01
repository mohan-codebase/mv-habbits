/** Account tier. Set server-side only — see supabase/migrations/028_user_tier.sql. */
export type Tier = 'free' | 'premium';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  week_start_day: number | null;
  tier: Tier;
}

/**
 * The key mark is the product's identity in gold, and the *user's* tier in
 * silver-or-gold. Both finishes come from the same source render.
 */
export const TIER_KEY_SRC: Record<Tier, string> = {
  free: '/logo/key-silver-128.png',
  premium: '/logo/key-gold-128.png',
};

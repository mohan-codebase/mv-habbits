-- 028_user_tier.sql
-- Account tier. Drives the silver (free) / gold (premium) key mark in the UI.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
  CHECK (tier IN ('free', 'premium'));

-- Existing rows predate the column and take the 'free' default.

-- Tier is readable by the owner via the existing profiles_select policy.
-- It is deliberately NOT writable from the client: profiles_update lets a user
-- update their own row, which would let anyone grant themselves premium. Revoke
-- the column so tier can only be set by the service role (billing webhook, or
-- a manual grant from the Supabase dashboard).
REVOKE UPDATE (tier) ON public.profiles FROM authenticated;
REVOKE UPDATE (tier) ON public.profiles FROM anon;

CREATE INDEX IF NOT EXISTS profiles_tier_idx ON public.profiles (tier);

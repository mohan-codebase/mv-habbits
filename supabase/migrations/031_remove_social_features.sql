-- ============================================================
-- 031: Remove the social feature (friends, families, feed)
-- ============================================================
--
-- The social feature shipped as a non-functional shell and is being removed
-- rather than finished:
--
--   * Nothing in the app ever wrote to friends / families / family_members.
--     The Network page was a server component whose buttons had no handlers,
--     so a connection could never be created.
--   * habits.visibility defaulted to 'private' and NO UI ever set it, so the
--     visibility-aware policies below could never match a row.
--   * profiles_select was never widened past `auth.uid() = id` (001), so the
--     feed's join to other users' profiles returned null regardless.
--
-- ⚠️ DESTRUCTIVE AND IRREVERSIBLE. Take and verify a full backup first.
--
-- ⚠️ ORDER MATTERS — DO NOT REORDER THE SECTIONS BELOW.
-- The SELECT policies on habits and goals created in 026 reference the friends
-- and family_members tables. Dropping those tables with CASCADE first would
-- take the policies with them and leave habits and goals with NO SELECT policy
-- at all. Under RLS that denies every read, and the entire app goes dark.
-- So: rewrite the policies to owner-only FIRST, then drop the tables.

-- ─────────────────────────────────────────────────────────────
-- 1. Revert habits SELECT to owner-only (undoes 026)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view habits based on visibility" ON public.habits;
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;

CREATE POLICY "Users can view their own habits"
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Revert goals SELECT to owner-only (undoes 026)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;

CREATE POLICY "Users can view their own goals"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Revert habit_entries SELECT to owner-only (undoes 027)
--    Restores the original policy from 001_initial_schema.sql.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "entries_select" ON public.habit_entries;

CREATE POLICY "entries_select"
    ON public.habit_entries FOR SELECT
    USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Drop the social tables
--    Safe now that nothing references them. CASCADE clears their own
--    policies, indexes, and foreign keys.
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.feed_comments   CASCADE;  -- 027
DROP TABLE IF EXISTS public.feed_reactions  CASCADE;  -- 027
DROP TABLE IF EXISTS public.family_members  CASCADE;  -- 025
DROP TABLE IF EXISTS public.families        CASCADE;  -- 025
DROP TABLE IF EXISTS public.friends         CASCADE;  -- 025

-- ─────────────────────────────────────────────────────────────
-- 5. Drop the now-meaningless visibility columns (undoes 026)
--    Only safe after steps 1 and 2 removed the policies that read them.
--    Every value is 'private' — no UI could ever change it — so no user
--    intent is lost here.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.habits DROP COLUMN IF EXISTS visibility;
ALTER TABLE public.goals  DROP COLUMN IF EXISTS visibility;

-- ============================================================
-- Verify after applying — each should return exactly the owner-only policy:
--   SELECT tablename, policyname, qual FROM pg_policies
--   WHERE tablename IN ('habits','goals','habit_entries') AND cmd = 'SELECT';
--
-- Then confirm the app still reads data: open the dashboard and check that
-- habits and today's entries load. A missing SELECT policy shows up as an
-- empty dashboard, not as an error.
-- ============================================================

-- ============================================================
-- 032: De-duplicate the RLS policies on habits and goals
-- ============================================================
--
-- NOT destructive to data. This migration only removes redundant duplicate
-- POLICIES; no table, column, or row is touched. It is safe to apply without
-- a backup, and trivially reversible (re-run 026 to restore the duplicates).
--
-- ── Why these duplicates exist ──────────────────────────────
--
-- 026_data_visibility.sql tried to replace the owner-only SELECT policies:
--
--     DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
--     CREATE POLICY "Users can view habits based on visibility" ...
--
-- But 001_initial_schema.sql had named that policy `habits_select`, and
-- 011_goals.sql had named the goals one "goals: owner select". Neither DROP
-- matched anything, so 026's policies were ADDED ALONGSIDE the originals
-- rather than replacing them. 026 then created three more write policies
-- ("Users can insert/update/delete their own habits") that duplicate 001's
-- habits_insert / habits_update / habits_delete outright.
--
-- Net effect in the live database: habits and goals each carry EIGHT policies
-- where four are needed.
--
-- ── Why this is worth cleaning, and why it is not urgent ────
--
-- Access control is currently CORRECT. Every duplicate resolves to
-- `auth.uid() = user_id`, and Postgres OR-combines permissive policies for the
-- same command, so the effective grant is unchanged. The costs are:
--
--   * Every SELECT on habits and goals evaluates the same predicate twice.
--   * The RLS audit in doc 08 has to reason about 16 policies instead of 8.
--   * Most dangerous: nobody can tell which policy is authoritative. A future
--     edit that drops "the" SELECT policy on habits changes nothing, because
--     a second identical one is still there. That is how a policy change ships
--     believing it took effect when it did not.
--
-- ── Ordering ────────────────────────────────────────────────
--
-- Apply AFTER 031. Each block RECREATES the canonical policy before dropping
-- any duplicate, so there is never an instant where a table has no SELECT
-- policy — the same discipline 031 §1 uses. Because of that, this migration is
-- also safe if applied out of order or run twice.

-- ─────────────────────────────────────────────────────────────
-- 1. habits — restore 001's four canonical policies
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "habits_select" ON public.habits;
CREATE POLICY "habits_select" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_insert" ON public.habits;
CREATE POLICY "habits_insert" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_update" ON public.habits;
CREATE POLICY "habits_update" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_delete" ON public.habits;
CREATE POLICY "habits_delete" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. habits — drop the duplicates left by 026 and 031
--    The "based on visibility" name is already gone if 031 ran; the
--    IF EXISTS makes this a no-op in that case.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view habits based on visibility" ON public.habits;
DROP POLICY IF EXISTS "Users can view their own habits"           ON public.habits;
DROP POLICY IF EXISTS "Users can insert their own habits"         ON public.habits;
DROP POLICY IF EXISTS "Users can update their own habits"         ON public.habits;
DROP POLICY IF EXISTS "Users can delete their own habits"         ON public.habits;

-- ─────────────────────────────────────────────────────────────
-- 3. goals — restore 011's four canonical policies
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "goals: owner select" ON public.goals;
CREATE POLICY "goals: owner select" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals: owner insert" ON public.goals;
CREATE POLICY "goals: owner insert" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals: owner update" ON public.goals;
CREATE POLICY "goals: owner update" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals: owner delete" ON public.goals;
CREATE POLICY "goals: owner delete" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. goals — drop the duplicates left by 026 and 031
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;
DROP POLICY IF EXISTS "Users can view their own goals"           ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals"         ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals"         ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals"         ON public.goals;

-- ============================================================
-- Verify with supabase/checks/02_postcheck.sql — habits and goals should each
-- report exactly four policies, one per command, all `auth.uid() = user_id`.
--
-- Then open the dashboard and confirm habits still load. A missing SELECT
-- policy presents as an empty dashboard, not as an error.
-- ============================================================

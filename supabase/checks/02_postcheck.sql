-- ============================================================
-- POST-FLIGHT CHECK — run AFTER migrations 029 / 030 / 031 / 032
-- ============================================================
--
-- Read-only. Every query states the expected result; anything else means the
-- cleanup did not land the way it was written.
--
-- Run this BEFORE you open the app. An RLS mistake presents as an empty
-- dashboard, not as an error, so the SQL is a faster and clearer signal than
-- clicking around.

-- ─────────────────────────────────────────────────────────────
-- 1. The dropped tables are gone
--
-- EXPECTED: zero rows.
-- FAILURE: any table listed here survived — the migration did not run
-- completely, or ran in a different schema.
-- ─────────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
        'trip_settlements', 'trip_documents', 'trip_packing_items',
        'trip_itinerary', 'trip_bookings', 'trip_expenses', 'trip_trips',
        'expenses', 'expense_categories',
        'feed_comments', 'feed_reactions', 'family_members', 'families', 'friends'
      )
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 2. The tables that had to survive are still here
--
-- EXPECTED: 11 rows, every one with rls_enabled = true.
-- FAILURE: a missing row means a CASCADE reached further than intended —
-- restore from backup rather than trying to patch forward.
-- ─────────────────────────────────────────────────────────────
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('profiles', 'categories', 'habits', 'habit_entries',
                    'achievements', 'daily_moods', 'todos', 'goals',
                    'ai_insights', 'push_subscriptions',
                    'habit_lock_credentials')
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 3. ⚠️ THE CRITICAL ONE — every table still has a SELECT policy
--
-- This is the failure 031's section ordering exists to prevent: a table with
-- RLS on and no SELECT policy denies every read, and the app goes dark
-- silently.
--
-- EXPECTED: zero rows.
-- FAILURE: any row here means that table is currently unreadable by every
-- user. Fix it immediately — recreate the owner-only policy:
--     CREATE POLICY "<name>_select" ON public.<table>
--         FOR SELECT USING (auth.uid() = user_id);
-- ─────────────────────────────────────────────────────────────
SELECT c.relname AS table_with_no_select_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = c.relname
          AND p.cmd IN ('SELECT', 'ALL')
      )
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 4. Policy de-duplication worked (032)
--
-- EXPECTED: exactly 8 rows —
--     goals   DELETE  goals: owner delete
--     goals   INSERT  goals: owner insert
--     goals   SELECT  goals: owner select
--     goals   UPDATE  goals: owner update
--     habits  DELETE  habits_delete
--     habits  INSERT  habits_insert
--     habits  SELECT  habits_select
--     habits  UPDATE  habits_update
--
-- Every using_expression should read `(auth.uid() = user_id)`.
-- FAILURE: more than 8 rows means duplicates remain; any policy name
-- containing "visibility" means 031 did not finish.
-- ─────────────────────────────────────────────────────────────
SELECT tablename, cmd, policyname, qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('habits', 'goals')
ORDER BY tablename, cmd, policyname;


-- ─────────────────────────────────────────────────────────────
-- 5. The visibility columns are gone (031 §5)
--
-- EXPECTED: zero rows.
-- ─────────────────────────────────────────────────────────────
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'visibility'
  AND table_name IN ('habits', 'goals')
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 6. No policy anywhere still references a dropped table
--
-- EXPECTED: zero rows.
-- FAILURE: a surviving policy references a table that no longer exists. It
-- will error at query time, not at migration time, so this is worth catching
-- here rather than from a user report.
-- ─────────────────────────────────────────────────────────────
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE (qual::text ~ '(friends|family_members|families|trip_|expense)'
    OR with_check::text ~ '(friends|family_members|families|trip_|expense)')
  AND schemaname IN ('public', 'storage')
ORDER BY 1, 2, 3;


-- ─────────────────────────────────────────────────────────────
-- 7. Migration 029 landed — streaks are timezone-aware
--
-- EXPECTED: two rows (calculate_streak, refresh_habit_stats), both with
-- has_search_path = true. 029 sets search_path on these SECURITY DEFINER
-- functions; if it reads false, you are running the pre-029 definitions and
-- still have both the streak bug and the privilege-escalation warning.
-- ─────────────────────────────────────────────────────────────
SELECT p.proname AS function_name,
       p.prosecdef AS security_definer,
       (p.proconfig IS NOT NULL
        AND EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%')
       ) AS has_search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('calculate_streak', 'refresh_habit_stats')
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 8. The DELETE trigger from 029 exists
--
-- EXPECTED: one row, and its definition should mention DELETE. Before 029 the
-- trigger fired only on INSERT/UPDATE, so streaks stayed inflated after an
-- entry was deleted.
-- ─────────────────────────────────────────────────────────────
SELECT tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal
  AND c.relname = 'habit_entries'
ORDER BY 1;

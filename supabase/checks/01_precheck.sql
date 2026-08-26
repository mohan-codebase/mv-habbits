-- ============================================================
-- PRE-FLIGHT CHECK — run BEFORE migrations 030 / 031 / 032
-- ============================================================
--
-- Read-only. Nothing here modifies the database.
-- Run the whole file in the Supabase SQL editor and read every result before
-- applying anything. Query 2 is the one that can stop the cleanup.

-- ─────────────────────────────────────────────────────────────
-- 1. What is about to be destroyed
--
-- Exact row counts for the nine tables 030 and 031 drop. Tables that do not
-- exist simply do not appear — this query cannot error on a missing table.
--
-- EXPECTED: all counts 0, or small counts of your own test data.
-- STOP IF: any table holds rows you did not put there yourself. Nothing in
-- the app writes to these, so a non-trivial count means an assumption is
-- wrong and the drop needs re-examining.
-- ─────────────────────────────────────────────────────────────
SELECT t.relname AS table_name,
       (xpath('/row/cnt/text()',
              query_to_xml(format('SELECT count(*) AS cnt FROM public.%I', t.relname),
                           false, true, '')))[1]::text::bigint AS exact_rows
FROM pg_class t
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relkind = 'r'
  AND t.relname IN (
        -- dropped by 030
        'trip_settlements', 'trip_documents', 'trip_packing_items',
        'trip_itinerary', 'trip_bookings', 'trip_expenses', 'trip_trips',
        'expenses', 'expense_categories',
        -- dropped by 031
        'feed_comments', 'feed_reactions', 'family_members', 'families', 'friends'
      )
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 2. ⚠️ THE ONE THAT CAN STOP THE CLEANUP
--
-- 031 §5 drops habits.visibility and goals.visibility, justified by the claim
-- that "every value is 'private' — no UI could ever change it". Nothing in the
-- migration verifies that claim. This does.
--
-- EXPECTED: exactly two rows, both visibility = 'private'.
-- STOP IF: any row shows a value other than 'private', or a NULL. That would
-- mean something DID set visibility, real user intent exists in that column,
-- and dropping it silently destroys it.
--
-- If this errors with "column visibility does not exist", 031 has already been
-- applied and this check no longer applies.
-- ─────────────────────────────────────────────────────────────
SELECT 'habits' AS table_name, visibility, count(*) AS rows
FROM public.habits GROUP BY 1, 2
UNION ALL
SELECT 'goals', visibility, count(*)
FROM public.goals GROUP BY 1, 2
ORDER BY 1, 2;


-- ─────────────────────────────────────────────────────────────
-- 3. Current RLS policy inventory
--
-- Snapshot this output before you change anything — it is your reference for
-- what "before" looked like, and the input to the post-check diff.
--
-- EXPECTED TODAY (pre-cleanup): habits = 8 policies, goals = 8 policies.
-- That duplication is what 032 fixes; see its header comment for the cause.
-- ─────────────────────────────────────────────────────────────
SELECT tablename,
       cmd,
       policyname,
       qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('habits', 'goals', 'habit_entries', 'profiles')
ORDER BY tablename, cmd, policyname;


-- ─────────────────────────────────────────────────────────────
-- 4. Every table that must SURVIVE can still be read
--
-- Counts SELECT *and* ALL policies — `todos` (002) and `habit_lock_credentials`
-- (021) grant read access via `FOR ALL`, so counting only cmd = 'SELECT' would
-- report 0 for two perfectly healthy tables.
--
-- EXPECTED: one row per table, read_policies >= 1.
-- STOP IF: any row shows 0. Under RLS that table is already unreadable, and
-- you need to fix that before adding more policy churn.
-- ─────────────────────────────────────────────────────────────
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       count(p.policyname) FILTER (WHERE p.cmd IN ('SELECT', 'ALL')) AS read_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
       ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('profiles', 'categories', 'habits', 'habit_entries',
                    'achievements', 'daily_moods', 'todos', 'goals',
                    'ai_insights', 'push_subscriptions',
                    'habit_lock_credentials')
GROUP BY 1, 2
ORDER BY 1;


-- ─────────────────────────────────────────────────────────────
-- 5. Storage — what CASCADE will NOT clean up
--
-- 030's DROP TABLE does not touch storage. The trip-documents bucket and its
-- objects survive the migration and must be deleted by hand in the dashboard.
--
-- EXPECTED: the bucket row, plus however many objects it holds.
-- If this returns no rows, the bucket is already gone and 030's manual
-- follow-up step is moot.
-- ─────────────────────────────────────────────────────────────
SELECT b.id AS bucket,
       b.public,
       count(o.id) AS objects,
       pg_size_pretty(COALESCE(sum((o.metadata->>'size')::bigint), 0)) AS total_size
FROM storage.buckets b
LEFT JOIN storage.objects o ON o.bucket_id = b.id
WHERE b.id = 'trip-documents'
GROUP BY 1, 2;


-- ─────────────────────────────────────────────────────────────
-- 6. Storage policies left behind by 014
--
-- These reference the trip-documents bucket and become dead rules once the
-- bucket is deleted. Delete them alongside it.
-- ─────────────────────────────────────────────────────────────
SELECT policyname, cmd, qual AS using_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual::text LIKE '%trip-documents%' OR with_check::text LIKE '%trip-documents%')
ORDER BY policyname;

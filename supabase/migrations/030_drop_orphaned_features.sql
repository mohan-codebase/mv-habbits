-- ============================================================
-- 030: Remove tables for features that were never shipped / were removed
-- ============================================================
--
-- Nothing in the application reads or writes any of these. They were left
-- behind when the trip planner was pulled from the UI and when the personal
-- expense tracker was never finished.
--
-- Reasons to drop rather than leave them:
--   * 015_multiple_trips_and_travelers.sql hardcodes personal seed data as a
--     column default — ARRAY['Mohan', 'Charles'] — which must not exist in a
--     multi-tenant production database.
--   * They widen the RLS surface that has to be audited (doc 08).
--   * They would appear in any user data export owed under GDPR / DPDP (doc 06).
--
-- Deliberately KEPT:
--   * goals       — migration 026 attaches visibility policies to it
--   * daily_moods — tiny, and a plausible near-term feature
--
-- ⚠️ DESTRUCTIVE AND IRREVERSIBLE.
-- Do not run this until a full database backup has been taken AND verified as
-- downloadable (doc 10 §5). CASCADE also drops the dependent policies,
-- indexes, triggers, and foreign keys.

-- Trip planner (migrations 014–019, 022)
DROP TABLE IF EXISTS public.trip_settlements   CASCADE;
DROP TABLE IF EXISTS public.trip_documents     CASCADE;
DROP TABLE IF EXISTS public.trip_packing_items CASCADE;
DROP TABLE IF EXISTS public.trip_itinerary     CASCADE;
DROP TABLE IF EXISTS public.trip_bookings      CASCADE;
DROP TABLE IF EXISTS public.trip_expenses      CASCADE;
DROP TABLE IF EXISTS public.trip_trips         CASCADE;

-- Personal expense tracker (migration 010, never shipped)
DROP TABLE IF EXISTS public.expenses           CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;

-- ============================================================
-- Still to do BY HAND in the Supabase dashboard after this runs:
--   1. Delete the `trip-documents` storage bucket and all its objects.
--   2. Delete that bucket's storage.objects policies created in migration 014.
-- CASCADE above does not touch storage.
-- ============================================================

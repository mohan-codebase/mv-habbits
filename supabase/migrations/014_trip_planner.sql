-- ============================================================
-- Trip Planner (merged into MV Habits)
-- User-scoped tables, prefixed `trip_` to avoid colliding with the existing
-- expense tracker (public.expenses). Each row belongs to auth.uid().
-- "Mohan" / "Charles" are the two payers *within* a user's trip, not auth users.
-- ============================================================

-- ── Trip (one per user) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_trips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name         TEXT NOT NULL DEFAULT 'Ladakh Trip',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Expenses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category     TEXT NOT NULL,
  item         TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  paid_by      TEXT NOT NULL CHECK (paid_by IN ('Mohan', 'Charles')),
  source_url   TEXT,
  notes        TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Bookings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('Flight', 'Train', 'Hotel', 'Bike Rental')),
  booking_name TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  paid_by      TEXT NOT NULL CHECK (paid_by IN ('Mohan', 'Charles')),
  status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed')),
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Itinerary ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_itinerary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day         INT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Packing checklist ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_packing_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item       TEXT NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Documents (files live in Storage bucket "trip-documents") ─
CREATE TABLE IF NOT EXISTS public.trip_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Other',
  file_path  TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trip_expenses_user_date ON public.trip_expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_category  ON public.trip_expenses (user_id, category);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_user      ON public.trip_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_itinerary_user_day ON public.trip_itinerary (user_id, day);
CREATE INDEX IF NOT EXISTS idx_trip_packing_user       ON public.trip_packing_items (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_documents_user     ON public.trip_documents (user_id);

-- ── Row Level Security: owner-only, like the rest of MV Habits ──
ALTER TABLE public.trip_trips         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_itinerary     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents     ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'trip_trips','trip_expenses','trip_bookings',
    'trip_itinerary','trip_packing_items','trip_documents'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "owner_%s" ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t, t
    );
  END LOOP;
END $$;

-- ── Realtime ────────────────────────────────────────────────
ALTER TABLE public.trip_expenses      REPLICA IDENTITY FULL;
ALTER TABLE public.trip_bookings      REPLICA IDENTITY FULL;
ALTER TABLE public.trip_itinerary     REPLICA IDENTITY FULL;
ALTER TABLE public.trip_packing_items REPLICA IDENTITY FULL;
ALTER TABLE public.trip_documents     REPLICA IDENTITY FULL;
ALTER TABLE public.trip_trips         REPLICA IDENTITY FULL;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'trip_trips','trip_expenses','trip_bookings',
    'trip_itinerary','trip_packing_items','trip_documents'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ── Storage bucket for documents (private, per-user folder) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-documents', 'trip-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Files are stored under "<user_id>/<filename>"; policies restrict each user to
-- their own folder.
DO $$ BEGIN
  CREATE POLICY "trip_docs_select" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'trip-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "trip_docs_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'trip-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "trip_docs_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'trip-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

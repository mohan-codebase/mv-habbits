-- ============================================================
-- MV Habits — Initial Schema
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  week_start_day INTEGER DEFAULT 1,
  notification_time TIME DEFAULT '08:00:00',
  streak_freeze_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habit Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#F43F5E',
  icon TEXT NOT NULL DEFAULT 'target',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habits
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'circle-check',
  color TEXT DEFAULT '#F43F5E',
  frequency JSONB NOT NULL DEFAULT '{"type": "daily"}',
  target_type TEXT NOT NULL DEFAULT 'boolean',
  target_value NUMERIC DEFAULT 1,
  target_unit TEXT,
  reminder_time TIME,
  is_archived BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT habits_target_type_check CHECK (target_type IN ('boolean', 'numeric', 'duration'))
);

-- Habit Entries (daily logs)
CREATE TABLE IF NOT EXISTS public.habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  value NUMERIC,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, entry_date)
);

-- Achievements / Badges
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Daily Moods
CREATE TABLE IF NOT EXISTS public.daily_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;

-- Profiles: special case (id = auth.uid())
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Habits
DROP POLICY IF EXISTS "habits_select" ON public.habits;
CREATE POLICY "habits_select" ON public.habits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_insert" ON public.habits;
CREATE POLICY "habits_insert" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_update" ON public.habits;
CREATE POLICY "habits_update" ON public.habits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_delete" ON public.habits;
CREATE POLICY "habits_delete" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Habit Entries
DROP POLICY IF EXISTS "entries_select" ON public.habit_entries;
CREATE POLICY "entries_select" ON public.habit_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_insert" ON public.habit_entries;
CREATE POLICY "entries_insert" ON public.habit_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_update" ON public.habit_entries;
CREATE POLICY "entries_update" ON public.habit_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entries_delete" ON public.habit_entries;
CREATE POLICY "entries_delete" ON public.habit_entries FOR DELETE USING (auth.uid() = user_id);

-- Achievements
DROP POLICY IF EXISTS "achievements_select" ON public.achievements;
CREATE POLICY "achievements_select" ON public.achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "achievements_insert" ON public.achievements;
CREATE POLICY "achievements_insert" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "achievements_update" ON public.achievements;
CREATE POLICY "achievements_update" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "achievements_delete" ON public.achievements;
CREATE POLICY "achievements_delete" ON public.achievements FOR DELETE USING (auth.uid() = user_id);

-- Daily Moods
DROP POLICY IF EXISTS "moods_select" ON public.daily_moods;
CREATE POLICY "moods_select" ON public.daily_moods FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "moods_insert" ON public.daily_moods;
CREATE POLICY "moods_insert" ON public.daily_moods FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "moods_update" ON public.daily_moods;
CREATE POLICY "moods_update" ON public.daily_moods FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "moods_delete" ON public.daily_moods;
CREATE POLICY "moods_delete" ON public.daily_moods FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON public.habit_entries(habit_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user ON public.habit_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id, type);
CREATE INDEX IF NOT EXISTS idx_daily_moods_user ON public.daily_moods(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- ============================================================
-- Auto-create profile on user signup (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Streak calculation function
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_streak(p_habit_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  entry_exists BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.habit_entries
      WHERE habit_id = p_habit_id
        AND user_id = p_user_id
        AND entry_date = check_date
        AND is_completed = true
    ) INTO entry_exists;

    IF entry_exists THEN
      streak := streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  UPDATE public.habits
  SET current_streak = streak,
      longest_streak = GREATEST(longest_streak, streak),
      updated_at = now()
  WHERE id = p_habit_id AND user_id = p_user_id;

  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

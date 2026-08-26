-- ============================================================
-- 029: Timezone-aware streaks + refresh on DELETE
-- ============================================================
--
-- Two defects in 007_optimized_streaks.sql:
--
-- 1. `v_today DATE := CURRENT_DATE` reads the Postgres server clock, which is
--    UTC. Every other part of the app derives "today" from profiles.timezone
--    (default Asia/Kolkata). For a user at UTC+5:30, between 00:00 and 05:30
--    local the database still thinks it is yesterday, so a habit completed at
--    00:30 fails the `entry_date = v_today OR entry_date = v_today - 1` anchor
--    and the streak reads low by one or visibly resets.
--
-- 2. The trigger fires AFTER INSERT OR UPDATE OF is_completed only, so deleting
--    an entry never refreshes the cached counters on habits. Streaks stay
--    inflated after a delete.
--
-- Both functions also gain `SET search_path` — a SECURITY DEFINER function with
-- a mutable search_path is a privilege-escalation vector, and Supabase's linter
-- flags it.
--
-- ⚠️ Apply by hand, then run the one-time backfill at the bottom.

CREATE OR REPLACE FUNCTION public.calculate_streak(p_habit_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_tz     TEXT;
  v_today  DATE;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_tz
  FROM public.profiles WHERE id = p_user_id;

  -- "Today" in the user's own calendar, not the server's. An invalid or
  -- unrecognised tz string would raise, so fall back rather than fail the
  -- caller's INSERT.
  BEGIN
    v_today := (now() AT TIME ZONE COALESCE(v_tz, 'UTC'))::date;
  EXCEPTION WHEN OTHERS THEN
    v_today := (now() AT TIME ZONE 'UTC')::date;
  END;

  -- CTE finds the continuous group of completed days containing today or
  -- yesterday (gaps and islands).
  WITH completed_dates AS (
    SELECT entry_date
    FROM public.habit_entries
    WHERE habit_id = p_habit_id
      AND user_id  = p_user_id
      AND is_completed = true
    ORDER BY entry_date DESC
  ),
  date_groups AS (
    SELECT entry_date,
           entry_date + (ROW_NUMBER() OVER (ORDER BY entry_date DESC))::INT AS grp
    FROM completed_dates
  ),
  target_group AS (
    SELECT grp FROM date_groups
    WHERE entry_date = v_today OR entry_date = (v_today - 1)
    LIMIT 1
  )
  SELECT COUNT(*) INTO v_streak
  FROM date_groups
  WHERE grp = (SELECT grp FROM target_group);

  UPDATE public.habits
  SET current_streak    = COALESCE(v_streak, 0),
      longest_streak    = GREATEST(longest_streak, COALESCE(v_streak, 0)),
      total_completions = (
        SELECT COUNT(*) FROM public.habit_entries
        WHERE habit_id = p_habit_id AND is_completed = true
      ),
      updated_at = now()
  WHERE id = p_habit_id AND user_id = p_user_id;

  RETURN COALESCE(v_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Refresh on DELETE too. NEW is null on DELETE, so branch on TG_OP.
CREATE OR REPLACE FUNCTION public.refresh_habit_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.calculate_streak(OLD.habit_id, OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_streak(NEW.habit_id, NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_refresh_habit_stats ON public.habit_entries;
CREATE TRIGGER tr_refresh_habit_stats
  AFTER INSERT OR DELETE OR UPDATE OF is_completed ON public.habit_entries
  FOR EACH ROW
  EXECUTE PROCEDURE public.refresh_habit_stats();

-- ============================================================
-- One-time backfill — run AFTER the above is applied.
-- Recomputes every active habit so existing rows reflect the tz-aware logic.
-- Safe to re-run.
-- ============================================================
-- SELECT public.calculate_streak(id, user_id)
-- FROM public.habits
-- WHERE is_archived = false;

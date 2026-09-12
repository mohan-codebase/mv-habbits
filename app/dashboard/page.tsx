import { createServerClient } from '@/lib/supabase/server';
import { todayString, isHabitActiveOnDate } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';
import type { HabitEntry } from '@/types/entry';
import DashboardApp from '@/components/dashboard/DashboardApp';
import { computeBestStreak, computeLifetimeCompletions } from '@/lib/stats/habitStats';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  const userId = user?.id ?? '';

  let userTz = 'Asia/Kolkata';
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .maybeSingle();
    userTz = profile?.timezone ?? 'Asia/Kolkata';
  }

  const today = userId ? formatInTimeZone(new Date(), userTz, 'yyyy-MM-dd') : todayString();

  // Build 7-day window (oldest → today)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = formatInTimeZone(d, userTz, 'yyyy-MM-dd');
    return { date, isToday: date === today };
  });
  const weekStart = weekDays[0].date;

  // Queries in parallel — habits, today's entries, week entries
  type WeekEntry = { entry_date: string; habit_id: string; is_completed: boolean };
  let habitsRaw: HabitWithEntry[] = [];
  let todayEntriesRaw: HabitEntry[] = [];
  let weekEntriesRaw: WeekEntry[] = [];

  if (userId) {
    const [habitsRes, todayRes, weekRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true }),
      supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', today),
      supabase
        .from('habit_entries')
        .select('entry_date, habit_id, is_completed')
        .eq('user_id', userId)
        .gte('entry_date', weekStart)
        .lte('entry_date', today),
    ]);
    habitsRaw = (habitsRes.data ?? []) as HabitWithEntry[];
    todayEntriesRaw = (todayRes.data ?? []) as HabitEntry[];
    weekEntriesRaw = (weekRes.data ?? []) as WeekEntry[];
  }

  // Build today's habit list with entry state attached
  const todayEntryMap = new Map<string, HabitEntry>(
    todayEntriesRaw.map((e) => [e.habit_id, e])
  );
  const habits: HabitWithEntry[] = habitsRaw.map((h) => ({
    ...h,
    todayEntry: todayEntryMap.get(h.id) ?? null,
  }));

  // Good habits (non-bad) drive all stats and the week bar chart
  const goodHabits = habitsRaw.filter((h) => !h.is_bad_habit);
  const goodHabitIds = new Set<string>(goodHabits.map((h) => h.id));
  const goodHabitCount = goodHabits.length;

  // Calculate week bar-chart data & dynamic 7-day completion total
  let weekTotalPossible = 0;
  let weekTotalCompleted = 0;

  const weekData = weekDays.map(({ date, isToday }) => {
    const activeGoodHabits = goodHabits.filter((h) => isHabitActiveOnDate(h.created_at, date));
    const activeCount = activeGoodHabits.length;
    const activeIds = new Set(activeGoodHabits.map((h) => h.id));

    const completedOnDate = weekEntriesRaw.filter(
      (e) => activeIds.has(e.habit_id) && e.entry_date === date && e.is_completed
    ).length;

    weekTotalPossible += activeCount;
    weekTotalCompleted += completedOnDate;

    return {
      date,
      isToday,
      percentage:
        activeCount > 0
          ? Math.round((completedOnDate / activeCount) * 100)
          : 0,
    };
  });

  // Overview stats
  let stats: OverviewStatsType | null = null;
  if (userId) {
    if (goodHabitCount === 0) {
      stats = {
        todayCompleted: 0, todayTotal: 0, todayPercentage: 0,
        bestStreak: 0, bestStreakHabitName: '',
        weekPercentage: 0, totalCompletions: 0,
      };
    } else {
      const completedToday = todayEntriesRaw.filter(
        (e) => goodHabitIds.has(e.habit_id) && e.is_completed
      ).length;

      // habitsRaw is already filtered to non-archived habits by the query above;
      // computeBestStreak/computeLifetimeCompletions additionally exclude "bad"
      // (avoid) habits, matching the definition used on the Year-in-Review page.
      const { bestStreak, bestStreakHabitName } = computeBestStreak(habitsRaw);
      const lifetimeCompletions = computeLifetimeCompletions(habitsRaw);

      stats = {
        todayCompleted: completedToday,
        todayTotal: goodHabitCount,
        todayPercentage: Math.round((completedToday / goodHabitCount) * 100),
        bestStreak,
        bestStreakHabitName,
        weekPercentage: weekTotalPossible > 0
          ? Math.min(100, Math.round((weekTotalCompleted / weekTotalPossible) * 100))
          : 0,
        totalCompletions: lifetimeCompletions,
      };
    }
  }

  // Display helpers
  const displayName: string =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const heroPct = stats?.todayTotal
    ? Math.round(((stats.todayCompleted ?? 0) / stats.todayTotal) * 100)
    : 0;
  const heroLine =
    !stats || stats.todayTotal === 0
      ? 'Start by adding your first habit.'
      : heroPct === 100
        ? 'All done. Rest up and do it again tomorrow.'
        : heroPct >= 50
          ? `You're ${heroPct}% through today. Keep the streak alive.`
          : `${stats.todayTotal - (stats.todayCompleted ?? 0)} left today. One at a time.`;
  const userHour = parseInt(formatInTimeZone(new Date(), userTz, 'H'), 10);
  const greeting = userHour < 12 ? 'Good morning' : userHour < 17 ? 'Good afternoon' : 'Good evening';
  const dayName = formatInTimeZone(new Date(), userTz, 'EEEE');
  const dateStr = formatInTimeZone(new Date(), userTz, 'MMMM d');

  return (
    <DashboardApp
      stats={stats}
      habits={habits}
      weekData={weekData}
      displayName={displayName}
      initials={initials}
      email={user?.email ?? ''}
      greeting={greeting}
      heroLine={heroLine}
      heroPct={heroPct}
      dayName={dayName}
      dateStr={dateStr}
    />
  );
}

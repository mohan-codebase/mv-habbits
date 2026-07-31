import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DAY_LABELS } from '@/lib/constants';
import { formatInTimeZone } from 'date-fns-tz';

function ok<T>(data: T, maxAge = 120) {
  return NextResponse.json(
    { data, error: null },
    { headers: { 'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 5}` } }
  );
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/analytics/patterns?days=90
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const days = Math.min(365, parseInt(req.nextUrl.searchParams.get('days') ?? '90', 10) || 90);

    const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle();
    const userTz = profile?.timezone || 'Asia/Kolkata';

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    const startStr = formatInTimeZone(startDate, userTz, 'yyyy-MM-dd');
    const todayStr = formatInTimeZone(today, userTz, 'yyyy-MM-dd');

    const { data: entries } = await supabase
      .from('habit_entries')
      .select('entry_date, is_completed, habit_id')
      .eq('user_id', user.id)
      .gte('entry_date', startStr)
      .lte('entry_date', todayStr);

    // Weekday patterns (0=Sun...6=Sat)
    const weekdayMap = Array.from({ length: 7 }, (_, i) => ({
      day: DAY_LABELS[i],
      dayIndex: i,
      completionRate: 0,
      totalEntries: 0,
      completedEntries: 0,
    }));

    for (const e of entries ?? []) {
      const dow = new Date(e.entry_date + 'T00:00:00').getDay();
      weekdayMap[dow].totalEntries += 1;
      if (e.is_completed) weekdayMap[dow].completedEntries += 1;
    }

    const weekdayPatterns = weekdayMap.map(({ completedEntries, totalEntries, ...rest }) => ({
      ...rest,
      completionRate: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0,
    }));

    // Category breakdown
    const { data: habits } = await supabase
      .from('habits')
      .select('id, category:categories(name, color)')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const habitCategoryMap = new Map<string, { name: string; color: string }>();
    for (const h of habits ?? []) {
      const catRaw = h.category as unknown;
      const cat = (catRaw && typeof catRaw === 'object' && !Array.isArray(catRaw))
        ? (catRaw as { name: string; color: string })
        : null;
      habitCategoryMap.set(h.id, cat ?? { name: 'Uncategorized', color: 'var(--accent-primary)' });
    }

    const categoryMap = new Map<string, { color: string; completed: number; total: number }>();
    for (const e of entries ?? []) {
      const cat = habitCategoryMap.get(e.habit_id) ?? { name: 'Uncategorized', color: 'var(--accent-primary)' };
      const slot = categoryMap.get(cat.name) ?? { color: cat.color, completed: 0, total: 0 };
      slot.total += 1;
      if (e.is_completed) slot.completed += 1;
      categoryMap.set(cat.name, slot);
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, { color, completed, total }]) => ({
      category,
      color,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    // Habit leaderboard (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDaysAgoStr = formatInTimeZone(thirtyDaysAgo, userTz, 'yyyy-MM-dd');

    const { data: recentEntries } = await supabase
      .from('habit_entries')
      .select('habit_id, is_completed')
      .eq('user_id', user.id)
      .gte('entry_date', thirtyDaysAgoStr)
      .lte('entry_date', todayStr);

    const { data: allHabits } = await supabase
      .from('habits')
      .select('id, name, icon, color, current_streak')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const leaderMap = new Map<string, { completed: number; total: number }>();
    for (const e of recentEntries ?? []) {
      const slot = leaderMap.get(e.habit_id) ?? { completed: 0, total: 0 };
      slot.total += 1;
      if (e.is_completed) slot.completed += 1;
      leaderMap.set(e.habit_id, slot);
    }

    const leaderboard = (allHabits ?? []).map((h) => {
      const slot = leaderMap.get(h.id) ?? { completed: 0, total: 0 };
      return {
        habitId: h.id,
        habitName: h.name,
        habitIcon: h.icon,
        habitColor: h.color,
        completionRate: slot.total > 0 ? Math.round((slot.completed / slot.total) * 100) : 0,
        streak: h.current_streak,
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return ok({ weekdayPatterns, categoryBreakdown, leaderboard });
  } catch (e) {
    return err(String(e), 500);
  }
}

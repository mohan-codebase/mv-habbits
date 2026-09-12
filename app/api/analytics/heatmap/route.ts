import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isHabitActiveOnDate } from '@/lib/utils/dates';
import { formatInTimeZone } from 'date-fns-tz';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T) {
  return NextResponse.json(
    { data, error: null },
    { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } }
  );
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/analytics/heatmap?months=12&habit_id=optional
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const sp = req.nextUrl.searchParams;
    const yearStr = sp.get('year');
    const habitId = sp.get('habit_id');

    const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle();
    const userTz = profile?.timezone || 'Asia/Kolkata';

    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (yearStr) {
      const year = parseInt(yearStr, 10);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      // if it's the current year, don't cap it to today so we see the full calendar year empty spaces
    } else {
      const months = Math.min(60, parseInt(sp.get('months') ?? '12', 10) || 12);
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      endDate = today;
    }

    const startStr = formatInTimeZone(startDate, userTz, 'yyyy-MM-dd');
    const endStr = formatInTimeZone(endDate, userTz, 'yyyy-MM-dd');

    let query = supabase
      .from('habit_entries')
      .select('entry_date, is_completed, habit_id')
      .eq('user_id', user.id)
      .gte('entry_date', startStr)
      .lte('entry_date', endStr);

    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    const { data: entries } = await query;

    const { data: habits } = await supabase
      .from('habits')
      .select('id, created_at, is_bad_habit')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const activeHabits = (habits ?? []).filter((h) => !h.is_bad_habit);

    // Aggregate by date
    const byDate = new Map<string, { completed: number; total: number }>();
    for (const e of entries ?? []) {
      const slot = byDate.get(e.entry_date) ?? { completed: 0, total: 0 };
      slot.total += 1;
      if (e.is_completed) slot.completed += 1;
      byDate.set(e.entry_date, slot);
    }

    // Build full date range
    const result = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateStr = formatInTimeZone(cur, userTz, 'yyyy-MM-dd');
      const slot = byDate.get(dateStr);
      const activeCount = habitId
        ? 1
        : activeHabits.filter((h) => isHabitActiveOnDate(h.created_at, dateStr)).length;

      result.push({
        date: dateStr,
        count: slot?.completed ?? 0,
        percentage: activeCount > 0 && slot ? Math.round((slot.completed / activeCount) * 100) : 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    return ok(result);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to load heatmap'), 500);
  }
}

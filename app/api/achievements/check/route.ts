import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ACHIEVEMENT_DEFS } from '@/lib/constants';
import type { AchievementType } from '@/types/achievement';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T) {
  return NextResponse.json({ data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// POST /api/achievements/check — checks and unlocks any newly earned achievements
export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();
    const userTz = profile?.timezone || 'Asia/Kolkata';
    const toUserDateStr = (date: Date = new Date()) => formatInTimeZone(date, userTz, 'yyyy-MM-dd');
    const today = toUserDateStr();

    // Get already-unlocked achievements
    const { data: existing } = await supabase
      .from('achievements')
      .select('type')
      .eq('user_id', user.id);
    const unlockedTypes = new Set((existing ?? []).map((a) => a.type));

    // Get habit stats
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, category_id, current_streak, longest_streak, total_completions')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const { count: totalCompletions } = await supabase
      .from('habit_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true);

    const maxStreakHabit = (habits ?? []).reduce(
      (best: { current_streak: number; id: string; name: string } | null, h) =>
        !best || (h.current_streak ?? 0) > best.current_streak ? h : best,
      null
    );

    const newlyUnlocked: AchievementType[] = [];
    const toInsert: {
      user_id: string;
      type: AchievementType;
      habit_id: string | null;
      metadata: Record<string, unknown>;
    }[] = [];

    // Check streak milestones
    const streakMilestones: [AchievementType, number][] = [
      ['streak_7', 7], ['streak_14', 14], ['streak_30', 30],
      ['streak_60', 60], ['streak_100', 100], ['streak_365', 365],
    ];
    for (const [type, target] of streakMilestones) {
      if (!unlockedTypes.has(type) && maxStreakHabit && (maxStreakHabit.current_streak ?? 0) >= target) {
        toInsert.push({
          user_id: user.id, type, habit_id: maxStreakHabit.id,
          metadata: { streak_count: maxStreakHabit.current_streak, habit_name: maxStreakHabit.name },
        });
        newlyUnlocked.push(type);
      }
    }

    // Check total completion milestones
    const totalMilestones: [AchievementType, number][] = [
      ['total_10', 10], ['total_50', 50], ['total_100', 100],
      ['total_500', 500], ['total_1000', 1000], ['total_5000', 5000],
    ];
    for (const [type, target] of totalMilestones) {
      if (!unlockedTypes.has(type) && (totalCompletions ?? 0) >= target) {
        toInsert.push({
          user_id: user.id, type, habit_id: null,
          metadata: { total_completions: totalCompletions },
        });
        newlyUnlocked.push(type);
      }
    }

    // --------------------------------------------------
    // BATCH FETCH FOR 30-DAY ACHIEVEMENTS
    // --------------------------------------------------
    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgoStr = toUserDateStr(thirtyDaysAgoDate);

    const { data: recentEntriesData } = await supabase
      .from('habit_entries')
      .select('entry_date, is_completed, habit_id, completed_at')
      .eq('user_id', user.id)
      .gte('entry_date', thirtyDaysAgoStr)
      .lte('entry_date', today);

    const recentEntries = recentEntriesData ?? [];
    
    const completedByDate = new Map<string, typeof recentEntries>();
    for (const entry of recentEntries) {
      if (!entry.is_completed) continue;
      const arr = completedByDate.get(entry.entry_date) ?? [];
      arr.push(entry);
      completedByDate.set(entry.entry_date, arr);
    }
    
    const habitCount = (habits ?? []).length;

    // Check perfect week (all habits completed every day for last 7 days)
    if (!unlockedTypes.has('perfect_week') && habitCount > 0) {
      let isPerfect = true;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const count = completedByDate.get(toUserDateStr(d))?.length ?? 0;
        if (count < habitCount) { isPerfect = false; break; }
      }
      if (isPerfect) {
        toInsert.push({ user_id: user.id, type: 'perfect_week', habit_id: null, metadata: {} });
        newlyUnlocked.push('perfect_week');
      }
    }

    // Check perfect month (all habits completed every day for last 30 days)
    if (!unlockedTypes.has('perfect_month') && habitCount > 0) {
      let isPerfectMonth = true;
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const count = completedByDate.get(toUserDateStr(d))?.length ?? 0;
        if (count < habitCount) { isPerfectMonth = false; break; }
      }
      if (isPerfectMonth) {
        toInsert.push({ user_id: user.id, type: 'perfect_month', habit_id: null, metadata: {} });
        newlyUnlocked.push('perfect_month');
      }
    }

    // Check consistency king (90%+ completion rate over last 30 days, min 30 entries)
    if (!unlockedTypes.has('consistency_king')) {
      const consistencyStart = new Date();
      consistencyStart.setDate(consistencyStart.getDate() - 29);
      const consistencyStr = toUserDateStr(consistencyStart);
      
      const consistencyEntries = recentEntries.filter(e => e.entry_date >= consistencyStr && e.entry_date <= today);
      const totalEntries = consistencyEntries.length;
      const completedEntriesCount = consistencyEntries.filter(e => e.is_completed).length;
      const rate = totalEntries > 0 ? (completedEntriesCount / totalEntries) * 100 : 0;

      if (rate >= 90 && totalEntries >= 30) {
        toInsert.push({ user_id: user.id, type: 'consistency_king', habit_id: null, metadata: { rate: Math.round(rate) } });
        newlyUnlocked.push('consistency_king');
      }
    }

    // Check category master (100% completion in a category for last 30 days)
    if (!unlockedTypes.has('category_master')) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id);

      const catStart = new Date();
      catStart.setDate(catStart.getDate() - 29);
      const catStr = toUserDateStr(catStart);

      for (const cat of categories ?? []) {
        const catHabits = (habits ?? []).filter(h => h.category_id === cat.id);
        if (catHabits.length === 0) continue;

        const habitIds = new Set(catHabits.map((h) => h.id));
        const catEntries = recentEntries.filter(e => habitIds.has(e.habit_id) && e.entry_date >= catStr && e.entry_date <= today);

        const total = catEntries.length;
        const completed = catEntries.filter((e) => e.is_completed).length;

        if (total > 0 && total === completed && total >= catHabits.length * 25) {
          toInsert.push({ user_id: user.id, type: 'category_master', habit_id: null, metadata: { category: cat.name } });
          newlyUnlocked.push('category_master');
          break;
        }
      }
    }

    // Check early bird (all habits completed before noon for 7 consecutive days)
    if (!unlockedTypes.has('early_bird') && habitCount > 0) {
      let isEarlyBird = true;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = toUserDateStr(d);
        const noonUtcIso = fromZonedTime(`${dateStr} 12:00:00`, userTz).toISOString();
        
        const dayEntries = completedByDate.get(dateStr) ?? [];
        const count = dayEntries.filter((e) => e.completed_at && e.completed_at < noonUtcIso).length;
        if (count < habitCount) { isEarlyBird = false; break; }
      }
      if (isEarlyBird) {
        toInsert.push({ user_id: user.id, type: 'early_bird', habit_id: null, metadata: {} });
        newlyUnlocked.push('early_bird');
      }
    }

    // Check comeback kid (current streak ≥ 7 with a 7-day gap before it, and prior activity)
    if (!unlockedTypes.has('comeback_kid')) {
      const candidates = (habits ?? []).filter(h => (h.current_streak ?? 0) >= 7);
      if (candidates.length > 0) {
        const candidateIds = candidates.map(h => h.id);
        const { data: comebackEntries } = await supabase
          .from('habit_entries')
          .select('habit_id, entry_date')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('habit_id', candidateIds);
        
        for (const habit of candidates) {
          const streakStart = new Date();
          streakStart.setDate(streakStart.getDate() - ((habit.current_streak ?? 0) - 1));

          const dayBeforeStreak = new Date(streakStart);
          dayBeforeStreak.setDate(dayBeforeStreak.getDate() - 1);
          const dayBeforeStr = toUserDateStr(dayBeforeStreak);

          const gapStart = new Date(dayBeforeStreak);
          gapStart.setDate(gapStart.getDate() - 6);
          const gapStartStr = toUserDateStr(gapStart);

          const habitEntries = (comebackEntries ?? []).filter(e => e.habit_id === habit.id);
          const gapCount = habitEntries.filter(e => e.entry_date >= gapStartStr && e.entry_date <= dayBeforeStr).length;
          
          if (gapCount === 0) {
            const priorActivity = habitEntries.filter(e => e.entry_date < gapStartStr).length;
            if (priorActivity > 0) {
              toInsert.push({ user_id: user.id, type: 'comeback_kid', habit_id: habit.id, metadata: { habit_name: habit.name } });
              newlyUnlocked.push('comeback_kid');
              break;
            }
          }
        }
      }
    }

    // Insert newly unlocked
    if (toInsert.length > 0) {
      await supabase.from('achievements').insert(toInsert);
    }

    // Return newly unlocked with their defs
    const newlyUnlockedDefs = newlyUnlocked.map((type) => {
      const def = ACHIEVEMENT_DEFS.find((d) => d.type === type);
      return { type, ...def };
    });

    return ok({ newlyUnlocked: newlyUnlockedDefs, count: newlyUnlocked.length });
  } catch (e) {
    return err(safeErrorMessage(e), 500);
  }
}

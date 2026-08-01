import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ACHIEVEMENT_DEFS } from '@/lib/constants';

function ok<T>(data: T) {
  return NextResponse.json({ data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/achievements
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data: unlocked } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    const unlockedMap = new Map((unlocked ?? []).map((a) => [a.type, a]));

    // Get progress data for locked achievements
    const { data: habits } = await supabase
      .from('habits')
      .select('id, current_streak, longest_streak, total_completions')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    const maxStreak = Math.max(0, ...(habits ?? []).map((h) => h.current_streak ?? 0));
    const { count: totalCompletions } = await supabase
      .from('habit_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true);

    const result = ACHIEVEMENT_DEFS.map((def) => {
      const achievement = unlockedMap.get(def.type);
      let progress = 0;
      let progressMax = 1;

      // Calculate progress regardless of unlock state, so display is correct
      // even if the persistence call (/api/achievements/check) never ran.
      if (def.type.startsWith('streak_')) {
        const target = parseInt(def.type.split('_')[1], 10);
        progress = Math.min(maxStreak, target);
        progressMax = target;
      } else if (def.type.startsWith('total_')) {
        const target = parseInt(def.type.split('_')[1], 10);
        progress = Math.min(totalCompletions ?? 0, target);
        progressMax = target;
      }

      // Unlocked if persisted in DB OR progress has reached the target
      // (covers achievements whose progress can't be derived above, e.g.
      // perfect_week, which simply default to unlocked = false until check runs).
      const unlocked = !!achievement || (progressMax > 0 && progress >= progressMax);

      return {
        ...def,
        unlocked,
        unlockedAt: achievement?.unlocked_at ?? null,
        habitId: achievement?.habit_id ?? null,
        metadata: achievement?.metadata ?? {},
        progress,
        progressMax,
        progressPct: progressMax > 0 ? Math.round((progress / progressMax) * 100) : 0,
      };
    });

    return ok(result);
  } catch (e) {
    return err(String(e), 500);
  }
}

import { createServerClient } from '@/lib/supabase/server';
import { ACHIEVEMENT_DEFS } from '@/lib/constants';
import AchievementGrid from '@/components/achievements/AchievementGrid';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Achievements · Productivity Master' };

export default async function AchievementsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: unlocked } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false });

  const unlockedMap = new Map((unlocked ?? []).map((a) => [a.type, a]));

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

  const achievements = ACHIEVEMENT_DEFS.map((def) => {
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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', paddingBottom: 60, padding: '24px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
          Achievements
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Earn badges by building consistent habits and reaching milestones.
        </p>
      </div>

      <AchievementGrid achievements={achievements} />
    </div>
  );
}

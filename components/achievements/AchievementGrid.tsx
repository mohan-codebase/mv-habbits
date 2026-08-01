'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import AchievementCard from './AchievementCard';
import type { AchievementDef } from '@/types/achievement';
import EmptyState from '@/components/ui/EmptyState';

interface AchievementCardData extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressMax: number;
  progressPct: number;
}

interface Props {
  achievements: AchievementCardData[];
}

type FilterTab = 'all' | 'unlocked' | 'locked';

export default function AchievementGrid({ achievements }: Props) {
  const [filter, setFilter] = useState<FilterTab>('all');

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.filter((a) => !a.unlocked).length;

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: achievements.length },
    { key: 'unlocked', label: 'Unlocked', count: unlockedCount },
    { key: 'locked', label: 'Locked', count: lockedCount },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Filter tabs + summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5">
          {tabs.map(({ key, label, count }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer transition-all duration-150"
                style={{
                  border: active ? '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)' : '1px solid var(--border-subtle)',
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
                <span
                  className="text-[11px] font-semibold px-1.5 py-px rounded-[20px]"
                  style={{
                    background: active ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'var(--bg-tertiary)',
                    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[13px] text-text-muted">
          <span className="text-[#b2b2b2] font-bold [font-family:'IBM_Plex_Mono']">{unlockedCount}</span>
          {' / '}
          {achievements.length} earned
        </span>
      </div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        className="grid [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] gap-3.5"
      >
        {filtered.map((achievement) => (
          <motion.div
            key={achievement.type}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            <AchievementCard achievement={achievement} />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            icon={filter === 'unlocked' ? <Trophy size={34} color="var(--accent-primary)" /> : <Lock size={34} color="var(--accent-primary)" />}
            title={filter === 'unlocked' ? 'No badges yet' : 'All achievements unlocked!'}
            description={
              filter === 'unlocked'
                ? 'Keep building streaks and completing habits — your first badge is closer than you think.'
                : 'You\'ve unlocked everything. Absolute legend.'
            }
            accentColor="#b2b2b2"
            compact
          />
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { DynamicIcon } from '@/lib/icons';
import type { AchievementDef } from '@/types/achievement';
import { format } from 'date-fns';

interface AchievementCardData extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressMax: number;
  progressPct: number;
}

interface Props {
  achievement: AchievementCardData;
  onNewUnlock?: boolean;
}

const RARITY_STYLES: Record<string, { border: string; glow: string; label: string }> = {
  common:    { border: 'rgba(161, 161, 161,0.2)',   glow: 'rgba(161, 161, 161,0.05)', label: '#a0a0a0' },
  rare:      { border: 'rgba(123, 123, 123,0.3)',    glow: 'rgba(123, 123, 123,0.06)',  label: '#7b7b7b' },
  epic:      { border: 'rgba(113, 113, 113,0.35)',   glow: 'rgba(113, 113, 113,0.08)',  label: '#707070' },
  legendary: { border: 'rgba(178, 178, 178,0.4)',     glow: 'rgba(178, 178, 178,0.1)',    label: '#b2b2b2' },
};


export default function AchievementCard({ achievement, onNewUnlock = false }: Props) {
  const rarityStyle = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common;
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div
      initial={onNewUnlock ? { scale: 0.8, opacity: 0 } : false}
      animate={onNewUnlock ? { scale: 1, opacity: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="rounded-[16px] px-4 py-[18px] flex flex-col gap-3 relative overflow-hidden transition-all duration-200"
      style={{
        background: isUnlocked
          ? `radial-gradient(ellipse at top left, ${rarityStyle.glow}, var(--bg-tertiary))`
          : 'var(--bg-glass)',
        border: `1px solid ${isUnlocked ? rarityStyle.border : 'var(--border-subtle)'}`,
        opacity: isUnlocked ? 1 : 0.55,
        filter: isUnlocked ? 'none' : 'grayscale(0.6)',
        boxShadow: isUnlocked ? `0 0 24px ${rarityStyle.glow}` : 'none',
      }}
      whileHover={isUnlocked ? { y: -2, boxShadow: 'none' } : { opacity: 0.7 }}
    >
      {/* Rarity badge */}
      <div
        className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-[0.08em] [font-family:'IBM_Plex_Sans'] px-1.5 py-0.5 rounded-[20px]"
        style={{
          color: rarityStyle.label,
          background: `${rarityStyle.glow}`,
          border: `1px solid ${rarityStyle.border}`,
        }}
      >
        {achievement.rarity}
      </div>

      {/* Icon */}
      <div
        className="w-[52px] h-[52px] rounded-lg flex items-center justify-center"
        style={{
          background: isUnlocked
            ? `radial-gradient(circle, ${achievement.color}22, ${achievement.color}08)`
            : 'var(--bg-tertiary)',
          border: isUnlocked
            ? `1px solid ${achievement.color}44`
            : '1px solid var(--border-subtle)',
          boxShadow: isUnlocked ? `0 0 20px ${achievement.color}33` : 'none',
        }}
      >
        {isUnlocked ? (
          <DynamicIcon name={achievement.icon} size={24} color={achievement.color} />
        ) : (
          <Lock size={20} color="var(--text-muted)" />
        )}
      </div>

      {/* Title + description */}
      <div className="flex-1">
        <p
          className="m-0 mb-1 text-[14px] font-bold [font-family:'Outfit']"
          style={{ color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {achievement.title}
        </p>
        <p className="m-0 text-[12px] text-text-muted leading-[1.5]">
          {achievement.description}
        </p>
      </div>

      {/* Progress or unlocked date */}
      {isUnlocked ? (
        achievement.unlockedAt && (
          <p className="m-0 text-[11px] [font-family:'IBM_Plex_Mono']" style={{ color: rarityStyle.label }}>
            Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
          </p>
        )
      ) : (
        achievement.progressMax > 1 && (
          <div>
            <div className="flex justify-between mb-[5px]">
              <span className="text-[11px] text-text-muted">Progress</span>
              <span className="text-[11px] text-text-muted [font-family:'IBM_Plex_Mono']">
                {achievement.progress} / {achievement.progressMax}
              </span>
            </div>
            <div className="h-1 bg-border-subtle rounded-[2px] overflow-hidden">
              <div
                className="h-full rounded-[2px] transition-[width] duration-500 ease-in-out"
                style={{
                  width: `${achievement.progressPct}%`,
                  background: achievement.color,
                }}
              />
            </div>
          </div>
        )
      )}
    </motion.div>
  );
}

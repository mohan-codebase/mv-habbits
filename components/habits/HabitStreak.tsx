'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface HabitStreakProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { icon: 14, count: 14, label: 10, gap: 2, padding: '4px 8px' },
  md: { icon: 18, count: 18, label: 11, gap: 3, padding: '6px 10px' },
  lg: { icon: 22, count: 24, label: 12, gap: 4, padding: '8px 14px' },
};

function getStreakColor(streak: number): string {
  if (streak >= 7) return '#a6a6a6';   // amber
  if (streak > 3)  return '#898989';   // orange
  return 'var(--text-muted)';           // muted
}

export default function HabitStreak({ streak, size = 'md' }: HabitStreakProps) {
  const cfg = sizeConfig[size];
  const color = getStreakColor(streak);
  const isActive = streak > 0;
  const isGolden = streak >= 7;

  return (
    <div className="inline-flex flex-col items-center" style={{ gap: cfg.gap }}>
      <div
        className="inline-flex items-center rounded-[var(--r-pill)]"
        style={{
          gap: cfg.gap + 2,
          padding: cfg.padding,
          background: isActive
            ? `rgba(${isGolden ? '245,158,11' : streak > 3 ? '249,115,22' : '71,85,105'}, 0.12)`
            : 'transparent',
        }}
      >
        <span
          className={`flex shrink-0 items-center ${isActive ? 'fire-glow' : ''}`}
          style={{ color }}
        >
          <Flame size={cfg.icon} fill={isActive ? color : 'none'} />
        </span>

        <span
          className={`min-w-[1ch] text-center leading-none font-bold font-['IBM_Plex_Mono','Courier_New',monospace] ${isGolden ? 'glow-pulse' : ''}`}
          style={{
            fontSize: cfg.count,
            color,
          }}
        >
          {streak}
        </span>
      </div>

      <span
        className="leading-none tracking-[0.02em] text-text-muted"
        style={{ fontSize: cfg.label }}
      >
        day streak
      </span>

      <style>{`
        @keyframes fire-glow-anim {
          0%, 100% {
            filter: 'none';
          }
          50% {
            filter: 'none';
          }
        }
        @keyframes glow-pulse-anim {
          0%, 100% {
            textShadow: 'none';
          }
          50% {
            textShadow: 'none';
          }
        }
        .fire-glow {
          animation: fire-glow-anim 2s ease-in-out infinite;
        }
        .glow-pulse {
          animation: glow-pulse-anim 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

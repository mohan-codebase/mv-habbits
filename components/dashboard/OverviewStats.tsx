'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Flame, CheckCircle2, TrendingUp, TrendingDown, Share2 } from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import ShareModal from '@/components/dashboard/ShareModal';
import type { OverviewStats } from '@/types/analytics';

interface OverviewStatsProps {
  stats: OverviewStats | null;
  loading: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const mv  = useMotionValue(0);
  const out = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctrl = animate(mv, value, { duration: 1.1, ease: 'easeOut' });
    return ctrl.stop;
  }, [value, mv]);

  useEffect(() => {
    return out.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [out]);

  return <span ref={ref}>0</span>;
}

function SkeletonCard() {
  return (
    <div className="flex min-h-[124px] flex-col justify-between rounded-xl border border-border-subtle bg-bg-card p-[18px_20px]">
      <div>
        <div className="shimmer mb-5 h-[10px] w-[45%] rounded-[4px]" />
        <div className="flex items-center gap-3">
          <div className="shimmer h-10 w-10 shrink-0 rounded-md" />
          <div className="shimmer h-8 w-[40%] rounded-[8px]" />
        </div>
      </div>
      <div className="shimmer mt-3 h-[12px] w-[60%] rounded-[4px]" />
    </div>
  );
}

const labelClassInline = "font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-muted inline-block";
const numClass = "text-3xl font-bold text-text-primary font-[Outfit] leading-none tracking-[-0.02em] [font-variant-numeric:tabular-nums]";
const subClass = "text-xs text-text-muted mt-1.5 tracking-[-0.005em]";

function StatCard({
  delay,
  label,
  children,
  trend,
  accentColor = 'var(--accent-primary)',
  accentColorLight = 'var(--accent-light)',
  glowColor = 'var(--accent-glow)',
}: {
  delay: number;
  label: string;
  children: React.ReactNode;
  trend?: { value: number; positive: boolean } | null;
  accentColor?: string;
  accentColorLight?: string;
  glowColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      whileHover={{
        y: -2,
        boxShadow: 'none',
      }}
      className="relative overflow-hidden rounded-xl p-[20px_22px_22px] shadow-none transition-all duration-200 ease-[ease] cursor-default"
      style={{
        background: `color-mix(in srgb, ${glowColor} 40%, var(--bg-card))`,
        border: `1px solid color-mix(in srgb, ${accentColor} 18%, var(--border-default))`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-85"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColorLight})` }}
      />
      <div className="mb-3.5 flex items-center justify-between">
        <span className={labelClassInline} style={{ color: `color-mix(in srgb, ${accentColor} 60%, var(--text-muted))` }}>{label}</span>
        {trend && (
          <span
            className="inline-flex items-center gap-[3px] font-mono text-[10.5px] font-semibold tracking-[-0.01em]"
            style={{ color: trend.positive ? 'var(--accent-light)' : 'var(--danger)' }}
          >
            {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export default function OverviewStats({ stats, loading }: OverviewStatsProps) {
  const [shareOpen, setShareOpen] = useState(false);

  if (loading || !stats) {
    return (
      <div className="hf-stats-grid">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const todayPct = stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div /> {/* Spacer */}
        <button
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all duration-150 ease-[ease] cursor-pointer"
        >
          <Share2 size={13} />
          Share Stats
        </button>
      </div>

      <div className="hf-stats-grid">
        {/* Today's Progress */}
        <StatCard delay={0} label="Today" accentColor="var(--accent-primary)" accentColorLight="var(--accent-light)" glowColor="var(--accent-glow)">
          <div className="flex items-center gap-3.5">
            <ProgressRing percentage={todayPct} size={56} strokeWidth={4} />
            <div>
              <p className={numClass}>
                {stats.todayCompleted}
                <span className="ml-0.5 text-base font-medium text-text-dimmed">
                  /{stats.todayTotal}
                </span>
              </p>
              <p className={subClass}>completed</p>
            </div>
          </div>
        </StatCard>

        {/* Best Streak */}
        <StatCard delay={0.05} label="Best Streak" accentColor="var(--warm)" accentColorLight="#c1c1c1" glowColor="var(--warm-glow)">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[rgba(187,187,187,0.22)] bg-[var(--warm-glow)]">
              <Flame size={18} color="var(--warm)" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className={numClass}>
                {stats.bestStreak}
                <span className="ml-[3px] text-sm font-medium text-text-dimmed">d</span>
              </p>
              <p className={subClass + " max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap"}>
                {stats.bestStreakHabitName || 'No habits yet'}
              </p>
            </div>
          </div>
        </StatCard>

        {/* This Week */}
        <StatCard
          delay={0.1}
          label="This Week"
          trend={{ value: stats.weekPercentage, positive: stats.weekPercentage >= 50 }}
          accentColor="var(--indigo)"
          accentColorLight="var(--indigo-dim)"
          glowColor="var(--indigo-glow)"
        >
          <div className="flex items-baseline gap-1">
            <p className={numClass}>{stats.weekPercentage}</p>
            <span className="text-base font-medium text-text-dimmed">%</span>
          </div>
          <p className={subClass}>7-day completion</p>
        </StatCard>

        {/* Level & Mastery */}
        <StatCard delay={0.15} label="Level & Rank" accentColor="var(--cyan)" accentColorLight="#cecece" glowColor="var(--cyan-glow)">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-[rgba(175,175,175,0.22)] bg-[var(--cyan-glow)] font-[Outfit] text-lg font-extrabold text-[var(--cyan)]">
                {Math.floor(stats.totalCompletions / 50) + 1}
              </div>
              <div className="min-w-0">
                <p className="m-0 font-[Outfit] text-lg font-bold tracking-[-0.02em] text-text-primary">
                  {stats.totalCompletions >= 500
                    ? 'Master'
                    : stats.totalCompletions >= 250
                    ? 'Elite'
                    : stats.totalCompletions >= 100
                    ? 'Pro'
                    : stats.totalCompletions >= 50
                    ? 'Adept'
                    : 'Novice'}
                </p>
                <p className="mt-px text-[11px] text-text-muted">
                  {stats.totalCompletions} XP
                </p>
              </div>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-[2px] bg-bg-tertiary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.totalCompletions % 50) * 2}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-[2px] bg-[linear-gradient(90deg,var(--cyan),var(--indigo))]"
              />
            </div>
          </div>
        </StatCard>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        stats={stats}
      />
    </div>
  );
}

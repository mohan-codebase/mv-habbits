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
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
        padding: '18px 20px',
        minHeight: 124,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div className="shimmer" style={{ height: 10, width: '45%', borderRadius: 4, marginBottom: 20 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="shimmer" style={{ height: 40, width: 40, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
          <div className="shimmer" style={{ height: 32, width: '40%', borderRadius: 8 }} />
        </div>
      </div>
      <div className="shimmer" style={{ height: 12, width: '60%', borderRadius: 4, marginTop: 12 }} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: 10.5,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 14,
};

const numStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: "'Outfit'",
  lineHeight: 1,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
};

const subStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  marginTop: 6,
  letterSpacing: '-0.005em',
};

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
      style={{
        background: `color-mix(in srgb, ${glowColor} 40%, var(--bg-card))`,
        border: `1px solid color-mix(in srgb, ${accentColor} 18%, var(--border-default))`,
        borderRadius: 'var(--r-xl)',
        padding: '20px 22px 22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: 'default',
        boxShadow: 'none',
      }}
      whileHover={{
        y: -2,
        boxShadow: 'none',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColorLight})`,
        opacity: 0.85,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ ...labelStyle, marginBottom: 0, color: `color-mix(in srgb, ${accentColor} 60%, var(--text-muted))` }}>{label}</span>
        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10.5,
              fontWeight: 600,
              color: trend.positive ? 'var(--accent-light)' : 'var(--danger)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '-0.01em',
            }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div /> {/* Spacer */}
        <button
          onClick={() => setShareOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Share2 size={13} />
          Share Stats
        </button>
      </div>

      <div className="hf-stats-grid">
        {/* Today's Progress */}
        <StatCard delay={0} label="Today" accentColor="var(--accent-primary)" accentColorLight="var(--accent-light)" glowColor="var(--accent-glow)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ProgressRing percentage={todayPct} size={56} strokeWidth={4} />
            <div>
              <p style={numStyle}>
                {stats.todayCompleted}
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dimmed)', marginLeft: 2 }}>
                  /{stats.todayTotal}
                </span>
              </p>
              <p style={subStyle}>completed</p>
            </div>
          </div>
        </StatCard>

        {/* Best Streak */}
        <StatCard delay={0.05} label="Best Streak" accentColor="var(--warm)" accentColorLight="#c1c1c1" glowColor="var(--warm-glow)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--r-md)',
                background: 'var(--warm-glow)',
                border: '1px solid rgba(187, 187, 187,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Flame size={18} color="var(--warm)" strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={numStyle}>
                {stats.bestStreak}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dimmed)', marginLeft: 3 }}>d</span>
              </p>
              <p style={{ ...subStyle, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <p style={numStyle}>{stats.weekPercentage}</p>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-dimmed)' }}>%</span>
          </div>
          <p style={subStyle}>7-day completion</p>
        </StatCard>

        {/* Level & Mastery */}
        <StatCard delay={0.15} label="Level & Rank" accentColor="var(--cyan)" accentColorLight="#cecece" glowColor="var(--cyan-glow)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--cyan-glow)',
                  border: '1px solid rgba(175, 175, 175,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--cyan)',
                  fontFamily: "'Outfit'",
                }}
              >
                {Math.floor(stats.totalCompletions / 50) + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: "'Outfit'",
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
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
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {stats.totalCompletions} XP
                </p>
              </div>
            </div>
            <div style={{ width: '100%', height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.totalCompletions % 50) * 2}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--indigo))', borderRadius: 2 }}
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

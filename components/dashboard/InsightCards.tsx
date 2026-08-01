'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Calendar, Trophy, Minus } from 'lucide-react';
import type { HabitWithEntry } from '@/types/habit';
interface HeatmapDay { date: string; count: number; }

interface InsightCardsProps {
  habits:  HabitWithEntry[];
  heatmap: HeatmapDay[];           // 365 days
  todayISO: string;
}

interface Insight {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub:   string;
  tone:  'good' | 'bad' | 'warn' | 'neutral';
}

const toneMap: Record<Insight['tone'], { color: string; glow: string; border: string }> = {
  good:    { color: 'var(--accent-light)', glow: 'var(--accent-glow-md)', border: 'color-mix(in srgb, var(--accent-primary) 24%, transparent)' },
  bad:     { color: 'var(--danger)',       glow: 'var(--danger-glow)',    border: 'rgba(140, 140, 140,0.24)' },
  warn:    { color: 'var(--warm)',         glow: 'var(--warm-glow)',      border: 'rgba(187, 187, 187,0.24)' },
  neutral: { color: 'var(--indigo)',       glow: 'var(--indigo-glow)',    border: 'rgba(137, 137, 137,0.24)' },
};

export default function InsightCards({ habits, heatmap, todayISO }: InsightCardsProps) {
  const insights: Insight[] = useMemo(() => {
    const out: Insight[] = [];

    // ── 1. Best weekday ──────────────────────────────────────────────
    if (heatmap.length > 0) {
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      for (const d of heatmap) {
        const dow = new Date(d.date + 'T00:00').getDay();
        dayTotals[dow] += d.count;
        dayCounts[dow] += 1;
      }
      let best = -1;
      for (let i = 0; i < 7; i++) {
        if (dayTotals[i] === 0) continue;
        if (best === -1 || dayTotals[i] > dayTotals[best]) best = i;
      }
      const names = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      if (best !== -1) {
        const avg = dayCounts[best] ? dayTotals[best] / dayCounts[best] : 0;
        // Show real check-in total so we never render "Avg 0.0" for a weekday
        // that only has a handful of check-ins across the year.
        const avgLabel = avg >= 0.1 ? `${avg.toFixed(1)}/day avg` : `${dayTotals[best]} check-ins`;
        out.push({
          icon: <Calendar size={15} />,
          label: 'Strongest day',
          value: names[best],
          sub: avgLabel,
          tone: 'neutral',
        });
      }
    }

    // ── 2. Week-over-week delta ──────────────────────────────────────
    if (heatmap.length >= 14) {
      const last14 = heatmap.slice(-14);
      const prev   = last14.slice(0, 7).reduce((s, d) => s + d.count, 0);
      const curr   = last14.slice(7).reduce((s, d) => s + d.count, 0);
      const delta  = curr - prev;
      const pct    = prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
      const tone: Insight['tone'] = delta > 0 ? 'good' : delta < 0 ? 'bad' : 'neutral';
      out.push({
        icon: delta > 0 ? <TrendingUp size={15} /> : delta < 0 ? <TrendingDown size={15} /> : <Minus size={15} />,
        label: 'Momentum',
        value: `${delta > 0 ? '+' : ''}${pct}%`,
        sub: `vs last week (${curr} vs ${prev})`,
        tone,
      });
    }

    // ── 3. Streak at risk ────────────────────────────────────────────
    const atRisk = habits
      .filter((h) => (h.current_streak ?? 0) >= 3 && !h.todayEntry?.is_completed)
      .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))[0];

    if (atRisk) {
      out.push({
        icon: <AlertTriangle size={15} />,
        label: 'Streak at risk',
        value: `${atRisk.current_streak}d · ${atRisk.name}`,
        sub: 'Check in before midnight',
        tone: 'warn',
      });
    }

    // ── 4. Perfect days (last 30) ────────────────────────────────────
    if (habits.length > 0 && heatmap.length >= 30) {
      const active = habits.length;
      const recent = heatmap.slice(-30);
      const perfect = recent.filter((d) => d.count >= active).length;
      if (perfect > 0) {
        out.push({
          icon: <Trophy size={15} />,
          label: 'Perfect days',
          value: `${perfect}/30`,
          sub: 'All habits done',
          tone: 'good',
        });
      }
    }

    // Fallback if nothing derived
    if (out.length === 0) {
      out.push({
        icon: <Sparkles size={15} />,
        label: 'Get started',
        value: 'Build a streak',
        sub: 'Check in today to unlock insights',
        tone: 'neutral',
      });
    }

    return out.slice(0, 4);
  }, [habits, heatmap, todayISO]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={13} color="var(--accent-light)" />
        <span className="eyebrow tracking-[0.12em]">Insights</span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {insights.map((insight, i) => {
          const t = toneMap[insight.tone];
          return (
            <motion.div
              key={`${insight.label}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-card py-3.5 px-4 shadow-none"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <div
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-sm"
                  style={{ background: t.glow, border: `1px solid ${t.border}`, color: t.color }}
                >
                  {insight.icon}
                </div>
                <span className="text-xs font-semibold tracking-[0.02em] text-text-muted uppercase">
                  {insight.label}
                </span>
              </div>

              <p className="truncate font-['Outfit'] text-[17px] leading-[1.2] font-bold tracking-[-0.02em] text-text-primary">
                {insight.value}
              </p>
              <p className="mt-1 text-[11.5px] tracking-[-0.005em] text-text-muted">
                {insight.sub}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

interface WeekDayData {
  date: string;
  percentage: number;
  isToday: boolean;
}

function dayLabel(d: string) {
  try { return format(parseISO(d), 'EEE'); } catch { return '---'; }
}
function fullDate(d: string) {
  try { return format(parseISO(d), 'MMM d'); } catch { return d; }
}

function barColor(pct: number): string {
  if (pct === 0)   return 'var(--bg-elevated)';
  if (pct <= 40)   return 'rgba(104, 104, 104,0.55)';
  if (pct <= 70)   return 'rgba(166, 166, 166,0.65)';
  return 'var(--accent-primary)';
}

const CHART_H = 88;
const GRID_LINES = [
  { pct: 25, bottomClass: 'bottom-[50px]' },
  { pct: 50, bottomClass: 'bottom-[72px]' },
  { pct: 75, bottomClass: 'bottom-[94px]' },
  { pct: 100, bottomClass: 'bottom-[116px]' },
];

export default function WeeklyOverview({ weekData }: { weekData: WeekDayData[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const maxPct = Math.max(...weekData.map((d) => d.percentage), 1);
  const avgPct = Math.round(weekData.reduce((s, d) => s + d.percentage, 0) / (weekData.length || 1));

  return (
    <div className="rounded-[16px] border border-border-subtle bg-bg-card p-[20px_20px_16px]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold tracking-[-0.01em] text-text-primary">
            7-Day Overview
          </span>
          <span className="text-[11px] text-text-muted">
            {weekData[0] ? `${fullDate(weekData[0].date)} – ${fullDate(weekData[weekData.length - 1].date)}` : 'This week'}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
          style={{
            background: avgPct >= 70 ? 'var(--accent-glow)' : avgPct >= 40 ? 'var(--indigo-glow)' : 'var(--bg-tertiary)',
            border: `1px solid ${avgPct >= 70 ? 'color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'var(--border-subtle)'}`,
          }}
        >
          <span
            className="font-mono text-[15px] font-bold tracking-[-0.02em]"
            style={{ color: avgPct >= 70 ? 'var(--accent-primary)' : avgPct >= 40 ? 'var(--indigo)' : 'var(--text-secondary)' }}
          >
            {avgPct}%
          </span>
          <span className="text-[10.5px] font-medium text-text-muted">avg</span>
        </div>
      </div>

      {/* Rings area */}
      <motion.div
        className="relative mt-2"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="hf-weekly-grid flex justify-between gap-1.5">
          {weekData.map((day, i) => {
            const pct = day.percentage;
            const R = 19, CIRC = 2 * Math.PI * R;
            const isSelected = day.isToday;
            const dayNum = parseInt(day.date.split('-')[2], 10);

            return (
              <div
                key={day.date}
                className="flex cursor-default flex-col items-center gap-1.5"
              >
                <span className={`text-[11px] font-semibold ${isSelected ? 'text-accent-primary' : 'text-text-muted'}`}>
                  {dayLabel(day.date)}
                </span>
                <div className="relative h-[42px] w-[42px]">
                  <svg width="42" height="42" className="absolute inset-0">
                    <circle cx="21" cy="21" r={R} fill="none" style={{ stroke: 'color-mix(in srgb, var(--accent-primary) 22%, transparent)' }} strokeWidth="2.5" />
                    <circle cx="21" cy="21" r={R} fill="none" stroke="var(--accent-primary)"
                      strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={CIRC}
                      strokeDashoffset={CIRC * (1 - pct / 100)}
                      transform="rotate(-90 21 21)"
                      className="transition-[stroke-dashoffset] duration-[600ms] ease-linear"
                    />
                  </svg>
                  <div
                    className={`absolute inset-[5px] flex items-center justify-center rounded-full transition-[background] duration-[180ms] ease-linear ${isSelected ? 'bg-accent-primary' : 'bg-transparent'}`}
                  >
                    <span className={`text-[13px] ${isSelected ? 'font-bold text-[var(--accent-on-primary)]' : 'font-semibold text-text-primary'}`}>
                      {dayNum}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

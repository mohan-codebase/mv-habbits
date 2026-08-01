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

      {/* Chart area with grid lines */}
      <motion.div
        className="relative"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Horizontal grid lines */}
        {GRID_LINES.map((line) => (
          <div
            key={line.pct}
            className={`pointer-events-none absolute inset-x-0 h-px bg-border-subtle opacity-50 ${line.bottomClass}`}
          />
        ))}

        <div className="hf-weekly-grid grid grid-cols-7 gap-1.5">
          {weekData.map((day, i) => {
            const color    = barColor(day.percentage);
            const barH     = day.percentage === 0 ? 3 : Math.max(6, Math.round((day.percentage / 100) * CHART_H));
            const isHov    = hov === i;

            return (
              <div
                key={day.date}
                className="relative flex cursor-default flex-col items-center gap-1"
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
              >
                {/* Tooltip */}
                {isHov && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 bottom-[calc(100%+8px)] whitespace-nowrap rounded-[10px] border border-border-default bg-bg-elevated p-[8px_12px]"
                  >
                    <p className="mb-0.5 text-[11px] text-text-muted">{fullDate(day.date)}</p>
                    <p className="m-0 text-sm font-bold text-text-primary">{day.percentage}%</p>
                  </motion.div>
                )}

                {/* Bar chart column */}
                <div className="relative flex w-full h-[88px] flex-col items-center justify-end">
                  {/* Percentage label above bar */}
                  {day.percentage > 0 && (
                    <span
                      className={`absolute whitespace-nowrap font-mono text-[9px] font-bold tracking-[-0.01em] ${day.isToday ? 'text-accent-primary' : 'text-text-dimmed'}`}
                      style={{ bottom: barH + 4 }}
                    >
                      {day.percentage}
                    </span>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barH }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.06 }}
                    className={`w-[80%] min-h-[3px] rounded-[4px_4px_2px_2px] transition-[background,box-shadow] duration-200 ${
                      day.isToday && day.percentage > 0
                        ? 'shadow-[0_0_12px_color-mix(in_srgb,var(--accent-primary)_35%,transparent)] opacity-100'
                        : isHov
                          ? 'shadow-[0_0_8px_rgba(255,255,255,0.08)] opacity-100'
                          : 'shadow-none opacity-80'
                    }`}
                    style={{
                      background: day.isToday && day.percentage > 0
                        ? `linear-gradient(180deg, var(--accent-light), var(--accent-primary))`
                        : color,
                    }}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-[10.5px] tracking-[0.02em] ${day.isToday ? 'font-bold text-accent-primary' : 'font-medium text-text-muted'}`}
                >
                  {dayLabel(day.date)}
                </span>

                {/* Today dot */}
                {day.isToday && (
                  <div className="-mt-0.5 h-1 w-1 rounded-full bg-[var(--accent-primary)]" />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

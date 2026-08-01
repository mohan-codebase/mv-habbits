'use client';

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import type { HeatmapCell } from '@/types/analytics';
import { toLocalDateString } from '@/lib/utils/dates';

interface CalendarHeatmapProps {
  data: HeatmapCell[];
  months?: number;
  color?: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getColor(pct: number, baseColor: string): string {
  if (pct === 0) return 'var(--bg-secondary)'; // Make empty cells visible!
  if (pct < 25) return `color-mix(in srgb, ${baseColor} 30%, transparent)`;
  if (pct < 50) return `color-mix(in srgb, ${baseColor} 50%, transparent)`;
  if (pct < 75) return `color-mix(in srgb, ${baseColor} 80%, transparent)`;
  return baseColor;
}

const CalendarHeatmap = memo(function CalendarHeatmap({ data, color }: CalendarHeatmapProps) {
  const baseColor = color ?? 'var(--accent-primary)';
  const { weeks, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) return { weeks: [], monthLabels: [] };

    // Build a date → cell map
    const cellMap = new Map<string, HeatmapCell>();
    for (const cell of data) cellMap.set(cell.date, cell);

    // Find date range
    const sortedDates = [...data].map((c) => c.date).sort();
    if (sortedDates.length === 0) return { weeks: [], monthLabels: [] };

    const start = new Date(sortedDates[0] + 'T00:00:00');
    const end = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00');

    // Align start to Sunday
    const startDow = start.getDay();
    const alignedStart = new Date(start);
    alignedStart.setDate(alignedStart.getDate() - startDow);

    const weeks: (HeatmapCell | null)[][] = [];
    const monthLabelsList: { label: string; weekIndex: number }[] = [];
    let week: (HeatmapCell | null)[] = [];
    let weekIndex = 0;
    let lastMonth = -1;

    const cur = new Date(alignedStart);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow === 0 && week.length > 0) {
        weeks.push(week);
        week = [];
        weekIndex++;
      }

      const dateStr = toLocalDateString(cur);
      const curMonth = cur.getMonth();
      if (curMonth !== lastMonth && cur >= start) {
        monthLabelsList.push({ label: MONTH_LABELS[curMonth], weekIndex });
        lastMonth = curMonth;
      }

      if (cur >= start) {
        week.push(cellMap.get(dateStr) ?? { date: dateStr, count: 0, percentage: 0 });
      } else {
        week.push(null); // padding
      }

      cur.setDate(cur.getDate() + 1);
    }
    if (week.length > 0) weeks.push(week);

    return { weeks, monthLabels: monthLabelsList };
  }, [data]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (weeks.length > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  if (weeks.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
        No data yet — start tracking habits to see your heatmap.
      </div>
    );
  }
  const CELL_SIZE = 16;
  const CELL_GAP = 4;
  const DAY_LABEL_WIDTH = 32;

  return (
    <motion.div
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <style>{`.hf-cal-cell { transition: all 0.2s ease; } .hf-cal-cell:hover { transform: scale(1.5); position: relative; z-index: 10; box-shadow: 0 2px 8px rgba(145, 145, 145,0.3); } @keyframes heatmapPulse { 0% { filter: brightness(1); } 50% { filter: brightness(1.2); } 100% { filter: brightness(1); } } .hf-cal-cell-active { animation: heatmapPulse 3s infinite ease-in-out; }`}</style>
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, minWidth: 'max-content' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', paddingLeft: DAY_LABEL_WIDTH, gap: CELL_GAP }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.weekIndex === wi);
            return (
              <div
                key={wi}
                style={{
                  width: CELL_SIZE,
                  fontSize: 11,
                  color: label ? 'var(--text-secondary)' : 'transparent',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {label?.label ?? ''}
              </div>
            );
          })}
        </div>

        {/* Grid rows (Sun–Sat) */}
        {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
          <div key={dow} style={{ display: 'flex', alignItems: 'center', gap: CELL_GAP }}>
            {/* Day label */}
            <div
              style={{
                width: DAY_LABEL_WIDTH,
                fontSize: 11,
                color: dow % 2 === 1 ? 'var(--text-muted)' : 'transparent',
                fontFamily: "'IBM Plex Sans', sans-serif",
                textAlign: 'right',
                paddingRight: 6,
                flexShrink: 0,
                fontWeight: 500,
              }}
            >
              {DAY_LABELS[dow]}
            </div>
            {/* Cells */}
            {weeks.map((week, wi) => {
              const cell = week[dow];
              if (!cell) {
                return (
                  <div
                    key={wi}
                    style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 14, flexShrink: 0 }}
                  />
                );
              }
              return (
                <div
                  key={wi}
                  className={`hf-cal-cell ${cell.percentage > 0 ? 'hf-cal-cell-active' : ''}`}
                  title={`${cell.date}: ${cell.percentage}% complete`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 14,
                    background: getColor(cell.percentage, baseColor),
                    flexShrink: 0,
                    cursor: 'default',
                    border: cell.percentage > 0 ? '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)' : '1px solid var(--border-subtle)',
                    animationDelay: `${(wi + dow) * 0.05}s`,
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: DAY_LABEL_WIDTH, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 6, fontWeight: 500 }}>Less</span>
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 14,
                background: getColor(pct, baseColor),
                border: pct > 0 ? '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)' : '1px solid var(--border-subtle)',
              }}
            />
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 500 }}>More</span>
        </div>
        </div>
      </div>
    </motion.div>
  );
});

export default CalendarHeatmap;

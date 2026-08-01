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
      <div className="text-text-muted text-[14px] text-center py-8">
        No data yet — start tracking habits to see your heatmap.
      </div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div ref={scrollRef} className="overflow-x-auto pb-2">
      <style>{`.hf-cal-cell { transition: all 0.2s ease; } .hf-cal-cell:hover { transform: scale(1.5); position: relative; z-index: 10; box-shadow: 0 2px 8px rgba(145, 145, 145,0.3); } @keyframes heatmapPulse { 0% { filter: brightness(1); } 50% { filter: brightness(1.2); } 100% { filter: brightness(1); } } .hf-cal-cell-active { animation: heatmapPulse 3s infinite ease-in-out; }`}</style>
      <div className="inline-flex flex-col gap-2 min-w-max">
        {/* Month labels */}
        <div className="flex pl-8 gap-1">
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.weekIndex === wi);
            return (
              <div
                key={wi}
                className={`w-4 text-xs [font-family:'IBM_Plex_Sans',sans-serif] whitespace-nowrap font-semibold ${label ? 'text-text-secondary' : 'text-transparent'}`}
              >
                {label?.label ?? ''}
              </div>
            );
          })}
        </div>

        {/* Grid rows (Sun–Sat) */}
        {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
          <div key={dow} className="flex items-center gap-1">
            {/* Day label */}
            <div
              className={`w-8 text-xs [font-family:'IBM_Plex_Sans',sans-serif] text-right pr-1.5 flex-shrink-0 font-medium ${dow % 2 === 1 ? 'text-text-muted' : 'text-transparent'}`}
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
                    className="w-4 h-4 rounded-[14px] flex-shrink-0"
                  />
                );
              }
              return (
                <div
                  key={wi}
                  className={`hf-cal-cell w-4 h-4 rounded-[14px] flex-shrink-0 cursor-default border ${cell.percentage > 0 ? 'hf-cal-cell-active border-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]' : 'border-border-subtle'}`}
                  title={`${cell.date}: ${cell.percentage}% complete`}
                  style={{
                    background: getColor(cell.percentage, baseColor),
                    animationDelay: `${(wi + dow) * 0.05}s`,
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-1 pl-8 mt-1.5">
          <span className="text-xs text-text-muted mr-1.5 font-medium">Less</span>
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className={`w-4 h-4 rounded-[14px] border ${pct > 0 ? 'border-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]' : 'border-border-subtle'}`}
              style={{
                background: getColor(pct, baseColor),
              }}
            />
          ))}
          <span className="text-xs text-text-muted ml-1.5 font-medium">More</span>
        </div>
        </div>
      </div>
    </motion.div>
  );
});

export default CalendarHeatmap;

'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyTrend } from '@/types/analytics';
import { format, parseISO } from 'date-fns';
import { useAccentColor } from '@/components/ui/ThemeProvider';

interface CompletionChartProps {
  data: DailyTrend[];
  onRangeChange?: (days: number) => void;
  currentRange?: number;
}

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

interface TooltipPayload {
  value: number;
  payload: DailyTrend;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border-default rounded-lg px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <p className="m-0 mb-1 text-[12px] text-text-muted [font-family:'IBM_Plex_Sans',sans-serif] font-medium">
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      <p className="m-0 text-[20px] font-extrabold text-accent-primary [font-family:'IBM_Plex_Mono',monospace]">
        {d.percentage}%
      </p>
      <p className="mt-1 text-sm font-medium text-text-secondary">
        {d.completed} / {d.total} habits
      </p>
    </div>
  );
}

const CompletionChart = memo(function CompletionChart({ data, onRangeChange, currentRange = 30 }: CompletionChartProps) {
  const accentHex = useAccentColor();
  const [range, setRange] = useState(currentRange);

  useEffect(() => {
    setRange(currentRange);
  }, [currentRange]);

  const handleRange = (days: number) => {
    setRange(days);
    onRangeChange?.(days);
  };

  // Format X-axis labels based on range
  const formatXAxis = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (range <= 30) return format(d, 'MMM d');
      if (range <= 90) return format(d, 'MMM d');
      return format(d, 'MMM');
    } catch {
      return dateStr;
    }
  };

  // Explicit tick set — always includes first + last (today) so the final data
  // point is labelled with its date. Recharts' integer `interval` drops the
  // last tick when N-1 isn't divisible by the step, which was why "today"
  // was rendering past the last visible label.
  const step = range <= 7 ? 1 : range <= 30 ? 7 : range <= 90 ? 14 : 30;
  const ticks = (() => {
    if (data.length === 0) return undefined;
    const out: string[] = [];
    for (let i = 0; i < data.length; i += step) out.push(data[i].date);
    const last = data[data.length - 1].date;
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  })();

  return (
    <div className="flex flex-col gap-4">
      {/* Range selector */}
      <div className="flex gap-1.5 justify-end">
        {RANGES.map(({ label, days }) => {
          const active = range === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => handleRange(days)}
              className="px-3.5 py-1.5 rounded-full text-[12px] cursor-pointer transition-all duration-200"
              style={{
                border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: active ? 'var(--accent-primary)' : 'var(--surface-tint)',
                color: active ? 'var(--accent-on-primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                boxShadow: active ? '0 0 12px color-mix(in srgb, var(--accent-primary) 35%, transparent)' : 'none',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <motion.div
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full"
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentHex} stopOpacity={0.6} />
                <stop offset="95%" stopColor={accentHex} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              ticks={ticks}
              tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: accentHex, strokeOpacity: 0.35, strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke={accentHex}
              strokeWidth={3.5}
              strokeLinecap="round"
              fill="url(#completionGradient)"
              style={{ filter: `drop-shadow(0px 4px 8px color-mix(in srgb, ${accentHex} 50%, transparent))` }}
              dot={false}
              activeDot={{ r: 7, fill: accentHex, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
});

export default CompletionChart;

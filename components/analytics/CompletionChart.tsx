'use client';

import React, { useState, memo } from 'react';
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
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 14,
        padding: '12px 16px',
        boxShadow: 'none',
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Sans'", fontWeight: 500 }}>
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: "'IBM Plex Mono'" }}>
        {d.percentage}%
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
        {d.completed} / {d.total} habits
      </p>
    </div>
  );
}

const CompletionChart = memo(function CompletionChart({ data, onRangeChange, currentRange = 30 }: CompletionChartProps) {
  const accentHex = useAccentColor();
  const [range, setRange] = useState(currentRange);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {RANGES.map(({ label, days }) => {
          const active = range === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => handleRange(days)}
              style={{
                padding: '6px 14px',
                borderRadius: 14,
                border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: active ? 'var(--accent-primary)' : 'transparent',
                color: active ? 'var(--accent-on-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
        style={{ width: '100%' }}
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentHex} stopOpacity={0.6} />
                <stop offset="95%" stopColor={accentHex} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255, 255, 255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              ticks={ticks}
              tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Sans'", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Sans'", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: accentHex, strokeOpacity: 0.3, strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke={accentHex}
              strokeWidth={4}
              strokeLinecap="round"
              fill="url(#completionGradient)"
              style={{ filter: `drop-shadow(0px 4px 5px ${accentHex}4D)` }}
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

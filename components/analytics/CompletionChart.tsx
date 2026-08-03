'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(139, 92, 246, ${alpha})`;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(139, 92, 246, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
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
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const measuredWidth = entries[0].contentRect.width;
      if (measuredWidth > 0) {
        setWidth(measuredWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

  // Explicit tick set
  const step = range <= 7 ? 1 : range <= 30 ? 7 : range <= 90 ? 14 : 30;
  const ticks = (() => {
    if (data.length === 0) return undefined;
    const out: string[] = [];
    for (let i = 0; i < data.length; i += step) out.push(data[i].date);
    const last = data[data.length - 1].date;
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  })();

  const gradientId = `completionGradient-${(accentHex || 'default').replace(/[^a-zA-Z0-9]/g, '')}`;
  const dropShadowColor = hexToRgba(accentHex, 0.45);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {/* Range selector */}
      <div className="flex gap-1.5 justify-end">
        {RANGES.map(({ label, days }) => {
          const active = range === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => handleRange(days)}
              className={`px-3.5 py-1.5 rounded-full border text-[12px] cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-accent-primary bg-accent-primary text-accent-on-primary font-bold shadow-[0_0_12px_color-mix(in_srgb,var(--accent-primary)_35%,transparent)]'
                  : 'border-border-subtle bg-[var(--surface-tint)] text-text-muted font-medium shadow-none'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Chart container with ResizeObserver for exact width calculation */}
      <div
        ref={containerRef}
        className="w-full h-[240px] min-h-[240px] relative min-w-0 flex items-center justify-center overflow-hidden"
      >
        {!mounted ? (
          <div className="w-full h-[240px] animate-pulse rounded-xl bg-[var(--bg-tertiary)]" />
        ) : data.length === 0 ? (
          <div className="flex h-[240px] w-full items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            No trend data available for this range
          </div>
        ) : width > 0 ? (
          <AreaChart width={width} height={240} data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
              fill={`url(#${gradientId})`}
              style={{ filter: `drop-shadow(0px 4px 8px ${dropShadowColor})` }}
              dot={false}
              activeDot={{ r: 7, fill: accentHex, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        ) : (
          <div className="w-full h-[240px] animate-pulse rounded-xl bg-[var(--bg-tertiary)]" />
        )}
      </div>
    </div>
  );
});

export default CompletionChart;


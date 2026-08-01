'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useAccentColor } from '@/components/ui/ThemeProvider';

const CHART_HEIGHT = 200;

export interface WeeklyPoint {
  date: string;
  label: string;   // day name, e.g. "Mon"
  dayNum: number;  // day-of-month
  pct: number;     // completion percentage 0–100
  isToday: boolean;
}

interface TooltipPayload {
  payload: WeeklyPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[14px] border border-border-default bg-bg-card py-3 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <p className="mb-1 text-[12px] font-medium text-text-muted [font-family:'IBM_Plex_Sans',sans-serif]">
        {d.label} {d.dayNum}{d.isToday ? ' · Today' : ''}
      </p>
      <p className="m-0 text-[20px] font-extrabold text-accent-primary [font-family:'IBM_Plex_Mono',monospace]">
        {d.pct}%
      </p>
    </div>
  );
}

/* Weekly report — 7-day completion trend as a smooth area chart.
   `color` prop accepts a hex string for per-habit charts; falls back to the
   live theme accent so accent-color changes are reflected immediately. */
const WeeklyReportChart = memo(function WeeklyReportChart({
  data,
  avg,
  color,
}: {
  data: WeeklyPoint[];
  avg: number;
  color?: string;
}) {
  const accentHex = useAccentColor();
  // Use caller-supplied hex only when it's a real hex value; CSS vars and
  // undefined both fall back to the live accent from context.
  const c = (color && /^#[0-9A-Fa-f]{3,8}$/.test(color)) ? color : accentHex;
  const gradientId = `weeklyReportGradient-${c.replace('#', '')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-[200px] w-full">
      {width > 0 ? (
        <motion.div animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <AreaChart width={width} height={CHART_HEIGHT} data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c} stopOpacity={0.6} />
                <stop offset="95%" stopColor={c} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={c} strokeOpacity={0.14} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: c, strokeOpacity: 0.35, strokeWidth: 2 }} />
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke={c}
                strokeOpacity={0.45}
                strokeDasharray="5 4"
                label={{ value: `avg ${avg}%`, position: 'insideTopRight', fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="pct"
              stroke={c}
              strokeWidth={3.5}
              strokeLinecap="round"
              fill={`url(#${gradientId})`}
              style={{ filter: `drop-shadow(0px 4px 8px color-mix(in srgb, ${c} 50%, transparent))` }}
              dot={false}
              activeDot={{ r: 7, fill: c, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </motion.div>
      ) : null}
    </div>
  );
});

export default WeeklyReportChart;

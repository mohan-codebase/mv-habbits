import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Check } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAccentColor } from '@/components/ui/ThemeProvider';

interface HeatmapDay { date: string; count: number; }

interface ProgressChartProps {
  data: HeatmapDay[];       // 365 days of {date, count}
  habitCount: number;       // active habits, for "on track" logic
}

type Range = '7d' | '30d' | '90d';

const rangeDays: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

function DeltaPill({ value, positive }: { value: number; positive: boolean }) {
  const zero = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-[3px] rounded-full px-[7px] py-0.5 font-mono text-[10.5px] font-semibold tracking-[-0.01em] border ${
        zero
          ? 'text-text-muted bg-bg-tertiary border-border-default'
          : positive
            ? 'text-accent-light bg-[var(--accent-glow-md)] border-[color-mix(in_srgb,var(--accent-primary)_24%,transparent)]'
            : 'text-danger bg-danger-glow border-[rgba(140,140,140,0.24)]'
      }`}
    >
      {zero ? <Minus size={9} /> : positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {positive && !zero ? '+' : ''}{value}%
    </span>
  );
}

export default function ProgressChart({ data, habitCount }: ProgressChartProps) {
  const accentHex = useAccentColor();
  const [range, setRange] = useState<Range>('30d');
  const [mounted, setMounted] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const measuredWidth = entries[0].contentRect.width;
      if (measuredWidth > 0) setWidth(measuredWidth);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Window + stats
  const { window, prevWindow } = useMemo(() => {
    const n = rangeDays[range];
    const all = data.slice(-n * 2);
    const current = data.slice(-n);
    const previous = all.slice(0, all.length - current.length);
    return { window: current, prevWindow: previous };
  }, [data, range]);

  const total     = useMemo(() => window.reduce((s, d) => s + d.count, 0), [window]);
  const prevTotal = useMemo(() => prevWindow.reduce((s, d) => s + d.count, 0), [prevWindow]);
  const avg       = window.length > 0 ? total / window.length : 0;
  const prevAvg   = prevWindow.length > 0 ? prevTotal / prevWindow.length : 0;
  const deltaPct  = prevAvg === 0 ? (avg > 0 ? 100 : 0) : Math.round(((avg - prevAvg) / prevAvg) * 100);

  // Completion rate
  const completionPct = useMemo(() => {
    if (window.length === 0 || habitCount === 0) return 0;
    const maxPossible = habitCount * window.length;
    return Math.round((total / maxPossible) * 100);
  }, [window, habitCount, total]);
  const prevCompletionPct = useMemo(() => {
    if (prevWindow.length === 0 || habitCount === 0) return 0;
    const maxPossible = habitCount * prevWindow.length;
    return Math.round((prevTotal / prevWindow.length) * 100);
  }, [prevWindow, habitCount, prevTotal]);
  const completionDelta = completionPct - prevCompletionPct;

  const chartData = useMemo(() => {
    return window.map((d) => ({
      date: d.date,
      count: d.count,
      percentage: habitCount > 0 ? Math.min(100, Math.round((d.count / habitCount) * 100)) : 0,
    }));
  }, [window, habitCount]);

  const onTrack = completionDelta >= 0 && completionPct >= 50;
  const gradientId = `progressGradient-${(accentHex || 'default').replace(/[^a-zA-Z0-9]/g, '')}`;

  function hexToRgba(hex: string, alpha: number): string {
    if (!hex || !hex.startsWith('#')) return `rgba(139, 92, 246, ${alpha})`;
    let c = hex.substring(1).replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(139, 92, 246, ${alpha})`;
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  return (
    <section className="rounded-[16px] border border-border-subtle bg-bg-card p-5 shadow-none">
      {/* Header: title + status + range tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="m-0 font-[Outfit,sans-serif] text-[17px] font-bold tracking-[-0.02em] text-text-primary">
            Progress Trends
          </h3>
          <span
            className={`inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] font-semibold border ${
              onTrack
                ? 'bg-[var(--accent-glow-md)] border-[color-mix(in_srgb,var(--accent-primary)_28%,transparent)] text-accent-light'
                : 'bg-[var(--warm-glow)] border-[rgba(187,187,187,0.28)] text-[var(--warm)]'
            }`}
          >
            <Check size={11} strokeWidth={3} />
            {onTrack ? 'On track' : 'Needs work'}
          </span>
        </div>

        {/* Range tabs */}
        <div className="flex gap-1.5">
          {(['7d', '30d', '90d'] as Range[]).map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`cursor-pointer rounded-full px-3 py-[5px] text-xs transition-all duration-200 ease-[ease] border ${
                  active
                    ? 'border-accent-primary bg-accent-primary text-accent-on-primary font-bold shadow-[0_0_12px_color-mix(in_srgb,var(--accent-primary)_35%,transparent)]'
                    : 'border-border-subtle bg-[var(--surface-tint)] text-text-muted font-medium shadow-none'
                }`}
              >
                {r.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <KpiTile
          label="Completion rate"
          value={`${completionPct}%`}
          delta={completionDelta}
          positive={completionDelta >= 0}
        />
        <KpiTile
          label="Total check-ins"
          value={total.toLocaleString()}
          delta={deltaPct}
          positive={deltaPct >= 0}
          sub={`${avg.toFixed(1)} / day avg`}
        />
      </div>

      {/* Recharts Area Chart with explicit width */}
      <div ref={containerRef} className="w-full h-[220px] min-h-[220px] relative min-w-0 flex items-center justify-center overflow-hidden">
        {!mounted ? (
          <div className="w-full h-[220px] animate-pulse rounded-xl bg-[var(--bg-tertiary)]" />
        ) : width > 0 ? (
          <AreaChart width={width} height={220} data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentHex} stopOpacity={0.6} />
                <stop offset="95%" stopColor={accentHex} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => {
                try { return format(parseISO(val), range === '7d' ? 'EEE' : 'MMM d'); } catch { return val; }
              }}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tickFormatter={(v) => `${v}`}
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-[14px] border border-border-default bg-bg-card p-[10px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <p className="m-0 mb-1 text-[11.5px] font-medium text-text-muted">
                      {typeof label === 'string' ? format(parseISO(label), 'MMM d, yyyy') : label ?? ''}
                    </p>
                    <p className="m-0 font-mono text-lg font-extrabold" style={{ color: accentHex }}>
                      {d.count} <span className="text-xs font-medium text-text-muted">check-in{d.count === 1 ? '' : 's'}</span>
                    </p>
                    <p className="m-0 mt-[3px] text-[11.5px] text-text-secondary">
                      {d.percentage}% completion
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: accentHex, strokeOpacity: 0.35, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={accentHex}
              strokeWidth={3.5}
              strokeLinecap="round"
              fill={`url(#${gradientId})`}
              style={{ filter: `drop-shadow(0px 4px 8px ${hexToRgba(accentHex, 0.45)})` }}
              dot={false}
              activeDot={{ r: 7, fill: accentHex, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        ) : (
          <div className="w-full h-[220px] animate-pulse rounded-xl bg-[var(--bg-tertiary)]" />
        )}
      </div>
    </section>
  );
}

function KpiTile({
  label,
  value,
  delta,
  positive,
  sub,
}: {
  label: string;
  value: string;
  delta: number;
  positive: boolean;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-bg-tertiary p-[12px_14px] shadow-none">
      <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <p className="text-[22px] font-bold leading-none tracking-[-0.02em] text-text-primary [font-variant-numeric:tabular-nums] [font-family:'Outfit']">
          {value}
        </p>
        <DeltaPill value={delta} positive={positive} />
      </div>
      {sub && (
        <span className="mt-0.5 text-[11px] tracking-[-0.005em] text-text-muted">
          {sub}
        </span>
      )}
    </div>
  );
}

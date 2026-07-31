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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 'var(--r-pill)',
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '-0.01em',
        color: zero ? 'var(--text-muted)' : positive ? 'var(--accent-light)' : 'var(--danger)',
        background: zero ? 'var(--bg-tertiary)' : positive ? 'var(--accent-glow-md)' : 'var(--danger-glow)',
        border: `1px solid ${zero ? 'var(--border-default)' : positive ? 'color-mix(in srgb, var(--accent-primary) 24%, transparent)' : 'rgba(140, 140, 140,0.24)'}`,
      }}
    >
      {zero ? <Minus size={9} /> : positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {positive && !zero ? '+' : ''}{value}%
    </span>
  );
}

export default function ProgressChart({ data, habitCount }: ProgressChartProps) {
  const accentHex = useAccentColor();
  const [range, setRange] = useState<Range>('30d');

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

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'none',
      }}
    >
      {/* Header: title + status + range tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Progress Trends
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 9999,
              background: onTrack ? 'var(--accent-glow-md)' : 'var(--warm-glow)',
              border: `1px solid ${onTrack ? 'color-mix(in srgb, var(--accent-primary) 28%, transparent)' : 'rgba(187, 187, 187,0.28)'}`,
              color: onTrack ? 'var(--accent-light)' : 'var(--warm)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Check size={11} strokeWidth={3} />
            {onTrack ? 'On track' : 'Needs work'}
          </span>
        </div>

        {/* Range tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['7d', '30d', '90d'] as Range[]).map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 9999,
                  border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: active ? 'var(--accent-primary)' : 'var(--surface-tint)',
                  color: active ? 'var(--accent-on-primary)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 0 12px color-mix(in srgb, var(--accent-primary) 35%, transparent)' : 'none',
                }}
              >
                {r.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
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

      {/* Recharts Glowing Monotone Area Chart */}
      <motion.div animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 8, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 14,
                      padding: '10px 14px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {typeof label === 'string' ? format(parseISO(label), 'MMM d, yyyy') : label ?? ''}
                    </p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: accentHex, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {d.count} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>check-in{d.count === 1 ? '' : 's'}</span>
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
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
              fill="url(#progressGradient)"
              style={{ filter: `drop-shadow(0px 4px 8px color-mix(in srgb, ${accentHex} 50%, transparent))` }}
              dot={false}
              activeDot={{ r: 7, fill: accentHex, stroke: 'var(--bg-primary)', strokeWidth: 3 }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
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
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: 'none',
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: "'Outfit'",
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <DeltaPill value={delta} positive={positive} />
      </div>
      {sub && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '-0.005em', marginTop: 2 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

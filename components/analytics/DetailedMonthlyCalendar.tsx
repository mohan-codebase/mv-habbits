'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HeatmapCell } from '@/types/analytics';
import { toLocalDateString } from '@/lib/utils/dates';

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DetailedMonthlyCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const currentMonthIdx = year === new Date().getFullYear() ? new Date().getMonth() : 11;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/heatmap?year=${year}`);
        if (res.ok) {
          const { data } = await res.json();
          setData(data ?? []);
        }
      } catch (err) {
        console.error('Failed to load yearly data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    setIsExpanded(false); // Reset expansion when year changes
  }, [year]);

  const baseColor = 'var(--accent-primary)';

  const groupedMonths = useMemo(() => {
    const cellMap = new Map<string, HeatmapCell>();
    for (const cell of data) cellMap.set(cell.date, cell);

    const months: {
      label: string;
      year: number;
      monthIndex: number;
      cells: (HeatmapCell | null)[];
    }[] = [];

    // Always render 12 months for the selected year
    for (let month = 0; month < 12; month++) {
      const label = MONTH_LABELS[month];
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const cells: (HeatmapCell | null)[] = [];
      // padding for the first week
      for (let i = 0; i < firstDay; i++) {
        cells.push(null);
      }
      
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = toLocalDateString(d);
        cells.push(cellMap.get(dateStr) ?? { date: dateStr, count: 0, percentage: 0 });
      }
      
      months.push({ label, year, monthIndex: month, cells });
    }
    
    return months;
  }, [data, year]);

  return (
    <div className="rounded-[16px] border border-border-subtle bg-bg-card p-5 mt-8">
      {/* Year Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="m-0 text-base font-bold text-text-primary">Detailed Monthly Progress</h3>
          <p className="m-0 mt-1 text-[13px] text-text-muted">Daily completion breakdown for {year}</p>
        </div>
        <div className="flex items-center gap-4 bg-[var(--bg-elevated)] rounded-full px-2 py-1 border border-[var(--border-subtle)]">
          <button 
            onClick={() => setYear(y => y - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            ←
          </button>
          <span className="font-mono text-[15px] font-bold tracking-tight w-12 text-center">{year}</span>
          <button 
            onClick={() => setYear(y => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-text-muted hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card/50 backdrop-blur-sm rounded-xl">
            <div className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupedMonths.map((m) => {
            const isCurrent = m.monthIndex === currentMonthIdx;
            const displayClass = isExpanded || isCurrent ? 'flex' : 'hidden md:flex';
            
            return (
              <div key={`${m.year}-${m.monthIndex}`} className={`flex-col gap-3 p-[18px_20px] rounded-2xl bg-[var(--bg-elevated)] border border-border-subtle shadow-[0_4px_24px_rgba(0,0,0,0.04)] ${displayClass}`}>
                <h4 className="m-0 text-[15px] font-[800] tracking-tight text-text-primary">
                  {m.label}
                </h4>
                
                <div className="grid grid-cols-7 gap-y-2 gap-x-1.5 mt-1">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-text-muted mb-1">
                      {d.slice(0, 1)}
                    </div>
                  ))}
                  
                  {m.cells.map((cell, i) => {
                    if (!cell) return <div key={i} className="aspect-square" />;
                    
                    const pct = cell.percentage;
                    const R = 11, CIRC = 2 * Math.PI * R;
                    const dayNum = parseInt(cell.date.split('-')[2], 10);
                    const hasData = pct > 0;
                    
                    return (
                      <div key={i} className="relative flex aspect-square items-center justify-center cursor-default group">
                        <svg width="28" height="28" viewBox="0 0 28 28" className="absolute inset-0 m-auto">
                          <circle 
                            cx="14" cy="14" r={R} fill="none" 
                            style={{ stroke: `color-mix(in srgb, ${baseColor} 15%, transparent)` }} 
                            strokeWidth="1.5" 
                          />
                          {hasData && (
                            <circle 
                              cx="14" cy="14" r={R} fill="none" stroke={baseColor}
                              strokeWidth="1.5" strokeLinecap="round"
                              strokeDasharray={CIRC}
                              strokeDashoffset={CIRC * (1 - pct / 100)}
                              transform="rotate(-90 14 14)"
                              className="transition-[stroke-dashoffset] duration-[600ms] ease-linear"
                            />
                          )}
                        </svg>
                        <span className={`text-[10.5px] ${hasData ? 'font-bold text-text-primary' : 'font-semibold text-text-muted'}`}>
                          {dayNum}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 bottom-[calc(100%+4px)] whitespace-nowrap rounded-[10px] border border-border-default bg-bg-elevated p-[8px_12px] opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1">
                          <p className="mb-0.5 text-[11px] font-medium text-text-muted">
                            {new Date(cell.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="m-0 text-sm font-bold text-text-primary">{pct}% completed</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Mobile Toggle Button */}
        {!isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="md:hidden mt-6 w-full cursor-pointer rounded-xl border border-border-default bg-[var(--surface-tint)] py-3 text-[13px] font-bold text-text-primary transition-colors hover:bg-[var(--surface-hover)]"
          >
            Show all months
          </button>
        )}
        {isExpanded && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="md:hidden mt-6 w-full cursor-pointer rounded-xl border border-border-default bg-[var(--surface-tint)] py-3 text-[13px] font-bold text-text-primary transition-colors hover:bg-[var(--surface-hover)]"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

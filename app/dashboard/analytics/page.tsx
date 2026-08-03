'use client';

import React, { useState, useEffect } from 'react';
import CalendarHeatmap from '@/components/analytics/CalendarHeatmap';
import DetailedMonthlyCalendar from '@/components/analytics/DetailedMonthlyCalendar';
import CompletionChart from '@/components/analytics/CompletionChart';
import type { HeatmapCell, DailyTrend } from '@/types/analytics';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [heatmapRes, trendsRes] = await Promise.all([
          fetch('/api/analytics/heatmap?months=12'),
          fetch(`/api/analytics/trends?days=${trendDays}`),
        ]);

        if (heatmapRes.ok) {
          const { data } = await heatmapRes.json() as { data: HeatmapCell[] };
          setHeatmap(data ?? []);
        }
        if (trendsRes.ok) {
          const { data } = await trendsRes.json() as { data: DailyTrend[] };
          setTrends(data ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [trendDays]);

  if (loading && heatmap.length === 0) {
    return (
      <div className="flex w-full flex-col gap-6 p-6">
        <h1 className="text-[28px] font-extrabold">Global Analytics</h1>
        <div className="h-[200px] animate-pulse rounded-[16px] bg-bg-glass" />
        <div className="h-[300px] animate-pulse rounded-[16px] bg-bg-glass" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-8 px-4 pt-6 pb-[120px]">
      <div>
        <h1 className="m-0 text-[28px] font-extrabold text-text-primary">Global Analytics</h1>
        <p className="mt-1 mb-0 text-text-muted">Overview of your habit completions across all routines.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="rounded-[16px] border border-border-subtle bg-bg-card p-5">
          <h3 className="m-0 mb-4 text-base font-bold text-text-primary">Activity Heatmap (Last 12 Months)</h3>
          <CalendarHeatmap data={heatmap} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <DetailedMonthlyCalendar />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="rounded-[16px] border border-border-subtle bg-bg-card p-5">
          <h3 className="m-0 mb-4 text-base font-bold text-text-primary">Completion Trends</h3>
          <CompletionChart data={trends} currentRange={trendDays} onRangeChange={setTrendDays} />
        </div>
      </motion.div>
    </div>
  );
}

import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AnalyticsLoading() {
  return (
    <DashboardShell>
      <div className="[padding:clamp(12px,2.5vw,32px)] flex flex-col [gap:clamp(16px,2vw,24px)] max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2.5">
          <div className="shimmer h-3 w-[120px] rounded-[4px]" />
          <div className="shimmer h-8 w-[220px] rounded-sm" />
        </div>

        {/* Stat row */}
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[100px] bg-bg-card border border-border-subtle rounded-xl px-5 py-4"
            >
              <div className="shimmer h-2.5 w-[50%] rounded-[4px] mb-4" />
              <div className="shimmer h-7 w-[60%] rounded-sm" />
            </div>
          ))}
        </div>

        {/* Chart blocks */}
        <div className="shimmer h-[320px] w-full rounded-[24px] opacity-50" />
        <div className="hf-analytics-grid grid [grid-template-columns:1fr_1fr] gap-4">
          <div className="shimmer h-[260px] rounded-[24px] opacity-50" />
          <div className="shimmer h-[260px] rounded-[24px] opacity-50" />
        </div>
        <div className="shimmer h-[240px] w-full rounded-[24px] opacity-40" />
      </div>

      <style>{`
        @media (max-width: 767px) {
          .hf-analytics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardShell>
  );
}

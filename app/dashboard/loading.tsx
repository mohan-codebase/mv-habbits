import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

/**
 * Premium dashboard skeleton shell.
 * Mimics the layout of the dashboard to prevent layout shifts.
 */
export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="[padding:clamp(12px,2.5vw,32px)_clamp(12px,2.5vw,32px)_clamp(32px,4vw,48px)] flex flex-col [gap:clamp(16px,2vw,24px)] max-w-[1280px] mx-auto">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3">
          <div className="shimmer h-3 w-[140px] rounded-[4px]" />
          <div className="shimmer h-8 w-[60%] max-w-[400px] rounded-sm" />
        </div>

        {/* Banner Skeleton */}
        <div className="shimmer h-[160px] w-full rounded-[24px] opacity-60" />

        {/* Stats Grid Skeleton */}
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[124px] bg-bg-card border border-border-subtle rounded-xl px-5 py-[18px] flex flex-col justify-between"
            >
              <div>
                <div className="shimmer h-2.5 w-[45%] rounded-[4px] mb-5" />
                <div className="flex items-center gap-3">
                  <div className="shimmer h-10 w-10 rounded-md flex-shrink-0" />
                  <div className="shimmer h-8 w-[40%] rounded-sm" />
                </div>
              </div>
              <div className="shimmer h-3 w-[60%] rounded-[4px] mt-3" />
            </div>
          ))}
        </div>

        {/* 2-Column Main Layout Skeleton */}
        <div
          className="hf-dashboard-grid grid [grid-template-columns:1fr_340px] [gap:clamp(16px,2vw,24px)] items-start"
        >
          {/* Left Column: Habits + Chart */}
          <div className="flex flex-col [gap:clamp(16px,2vw,24px)]">
            <div className="shimmer h-[400px] w-full rounded-[24px] opacity-40" />
            <div className="shimmer h-[300px] w-full rounded-[24px] opacity-40" />
          </div>

          {/* Right Column: Feed + Sidebar */}
          <div className="flex flex-col [gap:clamp(16px,2vw,24px)]">
            <div className="shimmer h-[260px] w-full rounded-[24px] opacity-50" />
            <div className="shimmer h-[340px] w-full rounded-[24px] opacity-50" />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .hf-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}

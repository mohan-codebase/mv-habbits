import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AchievementsLoading() {
  return (
    <DashboardShell>
      <div className="[padding:clamp(12px,2.5vw,32px)] flex flex-col [gap:clamp(16px,2vw,24px)] max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2.5">
          <div className="shimmer h-3 w-[130px] rounded-[4px]" />
          <div className="shimmer h-8 w-[240px] rounded-sm" />
        </div>

        {/* Achievement grid */}
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[140px] bg-bg-card border border-border-subtle rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="shimmer h-11 w-11 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <div className="shimmer h-3.5 w-[70%] rounded-[4px] mb-2" />
                  <div className="shimmer h-2.5 w-[50%] rounded-[4px]" />
                </div>
              </div>
              <div className="shimmer h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

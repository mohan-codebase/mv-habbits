import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function HabitsLoading() {
  return (
    <DashboardShell>
      <div className="[padding:clamp(12px,2.5vw,32px)] flex flex-col [gap:clamp(16px,2vw,24px)] max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2.5">
            <div className="shimmer h-3 w-[120px] rounded-[4px]" />
            <div className="shimmer h-8 w-[200px] rounded-sm" />
          </div>
          <div className="shimmer h-[38px] w-[120px] rounded-md" />
        </div>

        {/* Habit cards */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[80px] bg-bg-card border border-border-subtle rounded-xl px-5 py-4 flex items-center gap-4"
          >
            <div className="shimmer h-10 w-10 rounded-md flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="shimmer h-3.5 w-[40%] rounded-[4px]" />
              <div className="shimmer h-2.5 w-[25%] rounded-[4px]" />
            </div>
            <div className="shimmer h-8 w-8 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

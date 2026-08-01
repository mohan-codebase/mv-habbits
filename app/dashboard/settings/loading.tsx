import React from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function SettingsLoading() {
  return (
    <DashboardShell>
      <div className="[padding:clamp(12px,2.5vw,32px)] flex flex-col gap-6 max-w-[640px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2.5">
          <div className="shimmer h-8 w-[140px] rounded-sm" />
          <div className="shimmer h-3 w-[260px] rounded-[4px]" />
        </div>

        {/* Section cards */}
        {[180, 220, 160, 100].map((h, i) => (
          <div
            key={i}
            className="bg-bg-card border border-border-subtle rounded-[16px] p-5"
            style={{ height: h }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="shimmer h-[18px] w-[18px] rounded-[4px]" />
              <div className="shimmer h-4 w-[120px] rounded-[4px]" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="shimmer h-10 w-full rounded-md" />
              {i < 2 && <div className="shimmer h-10 w-full rounded-md" />}
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

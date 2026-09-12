import React from 'react';
import { Flame, BarChart3, Zap, Bell, Trophy, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Flame,
    title: "Streaks that don't lie",
    body: 'Timezone-aware streak calculations, so midnight in your city is midnight. Missed days freeze or reset accurately without timezone drift.',
    color: 'text-warm',
    bgColor: 'bg-warm-glow',
    borderColor: 'border-warm/20',
  },
  {
    icon: BarChart3,
    title: 'Analytics that explain',
    body: 'Year-long heatmaps, weekday completion rhythms, and category breakdowns let you identify exactly when you slip and why.',
    color: 'text-cyan',
    bgColor: 'bg-cyan-glow',
    borderColor: 'border-cyan/20',
  },
  {
    icon: Zap,
    title: 'Instant everything',
    body: 'Optimistic check-ins snap instantly without loading spinners, syncing across all your active devices in real time via Supabase.',
    color: 'text-accent-primary',
    bgColor: 'bg-accent-glow',
    borderColor: 'border-border-accent',
  },
  {
    icon: Bell,
    title: 'Reminders that arrive',
    body: 'Per-habit notification schedules delivered directly to your device as native web push notifications right when you need them.',
    color: 'text-indigo',
    bgColor: 'bg-indigo-glow',
    borderColor: 'border-indigo/20',
  },
  {
    icon: Trophy,
    title: '18 achievements',
    body: 'Earn streak milestones, perfect week badges, and comeback honors as you build consistency and earn focus reward coins.',
    color: 'text-warm',
    bgColor: 'bg-warm-glow',
    borderColor: 'border-warm/20',
  },
  {
    icon: Sparkles,
    title: 'AI habit coach',
    body: 'Personalized, weekly coaching insights and pattern analysis grounded directly in your own habit metrics and routines.',
    color: 'text-pink',
    bgColor: 'bg-pink-glow',
    borderColor: 'border-pink/20',
    premiumPill: true,
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-[70px] border-b border-border-subtle bg-bg-primary py-[clamp(64px,10vw,100px)] px-[clamp(16px,4vw,48px)]"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Section header */}
        <div className="mx-auto max-w-[680px] text-center mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary [font-family:'IBM_Plex_Mono',monospace] px-3.5 py-1 rounded-full border border-border-accent bg-accent-glow mb-4">
            Built For Consistency
          </span>
          <h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.2] m-0 mb-3.5">
            Everything you need to turn goals into daily rituals
          </h2>
          <p className="text-[15px] text-text-secondary leading-[1.65] m-0">
            No bloat, no confusing menus. Just fast check-ins, reliable streaks, and honest analytics.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative flex flex-col justify-between rounded-xl border border-border-subtle bg-bg-card p-6 transition-all duration-200 hover:border-border-default hover:bg-bg-elevated"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border ${f.borderColor} ${f.bgColor} ${f.color}`}
                    >
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    {f.premiumPill && (
                      <span className="rounded-full border border-border-accent bg-accent-glow px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-primary [font-family:'IBM_Plex_Mono',monospace]">
                        Premium
                      </span>
                    )}
                  </div>
                  <h3 className="text-[17px] font-bold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.01em] m-0 mb-2.5">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] text-text-secondary leading-[1.65] m-0">
                    {f.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

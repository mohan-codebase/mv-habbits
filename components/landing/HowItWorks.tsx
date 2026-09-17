import React from 'react';
import { PlusCircle, CheckCircle2, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: PlusCircle,
    title: 'Add your habits',
    body: 'Name it, pick an icon and target cadence, and configure an optional reminder time. Takes under 60 seconds to set up.',
  },
  {
    step: '02',
    icon: CheckCircle2,
    title: 'Check in daily',
    body: 'One instantaneous tap from your browser or home screen. Works fluidly on phone, tablet, and desktop.',
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Watch the pattern',
    body: 'Long streaks build momentum. Heatmaps, achievement tiers, and pattern analytics reveal your most productive days.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-[70px] border-b border-border-subtle bg-bg-secondary py-[clamp(64px,10vw,100px)] px-[clamp(16px,4vw,48px)]"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Section header */}
        <div className="mx-auto max-w-[640px] text-center mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary [font-family:'IBM_Plex_Mono',monospace] px-3.5 py-1 rounded-full border border-border-accent bg-accent-glow mb-4">
            Simple Workflow
          </span>
          <h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.2] m-0 mb-3.5">
            How MV Habits works
          </h2>
          <p className="text-[15px] text-text-secondary leading-[1.65] m-0">
            A frictionless loop designed to keep your friction near zero so your momentum never dies.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative flex flex-col rounded-xl border border-border-subtle bg-bg-card p-7 transition-all duration-200 hover:border-border-default hover:bg-bg-elevated"
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl font-black text-accent-primary [font-family:'IBM_Plex_Mono',monospace] tracking-wider opacity-90">
                    {s.step}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-tertiary text-text-primary">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                </div>

                <h3 className="text-[18px] font-bold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.01em] m-0 mb-2.5">
                  {s.title}
                </h3>
                <p className="text-[13.5px] text-text-secondary leading-[1.65] m-0">
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

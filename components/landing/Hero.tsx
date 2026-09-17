import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-bg-secondary pt-[clamp(88px,12vw,140px)] pb-[clamp(48px,8vw,96px)] px-[clamp(16px,4vw,48px)]">
      {/* Background glow effects */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[360px] rounded-full opacity-35 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow-lg) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border-accent bg-accent-glow px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary [font-family:'IBM_Plex_Mono',monospace] mb-6">
          <span>Daily Habit Tracker</span>
          <span className="h-1 w-1 rounded-full bg-accent-primary" />
          <span>Realtime Sync</span>
        </div>

        {/* Primary H1 Headline */}
        <h1 className="mx-auto max-w-[920px] text-[clamp(32px,5.5vw,62px)] font-extrabold leading-[1.12] tracking-[-0.035em] text-text-primary [font-family:'Outfit',sans-serif] m-0 mb-6">
          Build daily habits that{' '}
          <span className="bg-gradient-to-r from-accent-primary via-indigo to-pink bg-clip-text text-transparent">
            actually stick
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-[660px] text-[clamp(16px,2vw,19px)] leading-[1.6] text-text-secondary m-0 mb-9">
          Track habits with real-time sync across all devices, streaks that survive timezones, and analytics that reveal why you slip. Free to start.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-7 py-3.5 text-[15px] font-bold text-accent-on-primary no-underline transition-all duration-150 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary [font-family:inherit]"
          >
            <span>Start free</span>
            <ArrowRight size={17} />
          </Link>

          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-full border border-border-default bg-bg-card px-6 py-3.5 text-[15px] font-medium text-text-secondary no-underline transition-colors duration-150 hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary [font-family:inherit]"
          >
            See how it works
          </a>
        </div>

        {/* Hero Visual Preview */}
        <div className="relative mx-auto max-w-[1100px] rounded-2xl border border-border-default bg-bg-card p-2 sm:p-3 shadow-2xl transition-transform duration-300">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-primary">
            <Image
              src="/marketing/hero-dashboard.png"
              alt="MV Habits dashboard preview showing daily habit streaks, monthly consistency, and habit check-in logs"
              width={1200}
              height={750}
              priority
              className="w-full h-auto block object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1100px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/pricing';

export default function Pricing() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('yearly');

  const freePlan = PLANS.free;
  const premiumPlan = PLANS.premium;

  const premiumMonthlyEquivalent = (premiumPlan.price.yearly / 12).toFixed(2);

  const featuresList = [
    { label: 'Active daily habits', free: 'Up to 5 habits', premium: 'Unlimited habits' },
    { label: 'Daily check-in logs', free: 'Unlimited', premium: 'Unlimited' },
    { label: 'Streak tracking & 18 milestones', free: 'All 18 included', premium: 'All 18 included' },
    { label: 'Analytics history', free: 'Last 30 days', premium: 'Full history + year heatmap' },
    { label: 'Weekday & pattern analysis', free: false, premium: true },
    { label: 'Scheduled push reminders', free: '1 habit', premium: 'Unlimited habits' },
    { label: 'AI habit coach (weekly insights)', free: false, premium: true },
    { label: 'Export formats', free: 'JSON', premium: 'JSON, CSV, Excel, PDF' },
    { label: 'Focus rewards & coin tracking', free: true, premium: true },
    { label: 'Passcode & biometric lock', free: false, premium: true },
  ];

  return (
    <section
      id="pricing"
      className="scroll-mt-[70px] border-b border-border-subtle bg-bg-primary py-[clamp(64px,10vw,100px)] px-[clamp(16px,4vw,48px)]"
    >
      <div className="mx-auto max-w-[1100px]">
        {/* Section header */}
        <div className="mx-auto max-w-[640px] text-center mb-10">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary [font-family:'IBM_Plex_Mono',monospace] px-3.5 py-1 rounded-full border border-border-accent bg-accent-glow mb-4">
            Honest Pricing
          </span>
          <h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.2] m-0 mb-3.5">
            Start free, upgrade for deeper insights
          </h2>
          <p className="text-[15px] text-text-secondary leading-[1.65] m-0">
            No credit card required to start. Build your core routines for free, or unlock lifetime analytics and AI coaching.
          </p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="inline-flex items-center rounded-full border border-border-default bg-bg-card p-1">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                interval === 'monthly'
                  ? 'bg-accent-primary text-accent-on-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('yearly')}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                interval === 'yearly'
                  ? 'bg-accent-primary text-accent-on-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Yearly</span>
              <span className="rounded-full bg-accent-glow border border-border-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-primary tracking-wide">
                Save 33%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-bg-card p-7 sm:p-8 transition-all hover:border-border-default">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary [font-family:'Outfit',sans-serif] m-0">
                  {freePlan.name}
                </h3>
                <span className="rounded-full border border-border-subtle bg-bg-tertiary px-3 py-0.5 text-xs font-semibold text-text-muted">
                  Core
                </span>
              </div>
              <p className="text-[13.5px] text-text-secondary leading-[1.6] m-0 mb-6">
                Perfect for establishing 1–5 essential daily routines with real-time multi-device sync.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-text-primary [font-family:'Outfit',sans-serif]">
                  $0
                </span>
                <span className="text-xs text-text-muted font-medium">/ forever</span>
              </div>

              <div className="border-t border-border-subtle pt-6 mb-8 flex flex-col gap-3.5">
                {featuresList.map((f) => {
                  const included = f.free !== false;
                  return (
                    <div key={f.label} className="flex items-start gap-3 text-[13.5px]">
                      {included ? (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-glow text-accent-primary">
                          <Check size={12} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-text-dimmed">
                          <Minus size={13} />
                        </div>
                      )}
                      <span className={included ? 'text-text-secondary' : 'text-text-dimmed'}>
                        {f.label}
                        {typeof f.free === 'string' && (
                          <strong className="ml-1 text-text-primary font-semibold">({f.free})</strong>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/signup?plan=free"
              className="inline-flex w-full items-center justify-center rounded-full border border-border-default bg-bg-tertiary py-3 text-[14px] font-bold text-text-primary no-underline transition-colors hover:bg-bg-elevated hover:border-border-accent"
            >
              Get started free
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-accent-primary bg-bg-card p-7 sm:p-8 shadow-xl shadow-accent-glow/20">
            {/* Pill */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary px-3.5 py-1 text-xs font-bold text-accent-on-primary shadow-sm tracking-wide">
                <Sparkles size={12} />
                <span>Unlimited &amp; AI Coach</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary [font-family:'Outfit',sans-serif] m-0">
                  {premiumPlan.name}
                </h3>
                <span className="rounded-full border border-border-accent bg-accent-glow px-3 py-0.5 text-xs font-bold uppercase text-accent-primary tracking-wider [font-family:'IBM_Plex_Mono',monospace]">
                  Pro
                </span>
              </div>
              <p className="text-[13.5px] text-text-secondary leading-[1.6] m-0 mb-6">
                Unlimited habits, complete year-round analytics, automated export reports, and smart coaching.
              </p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-text-primary [font-family:'Outfit',sans-serif]">
                  ${interval === 'yearly' ? premiumMonthlyEquivalent : premiumPlan.price.monthly}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  / month {interval === 'yearly' && <span className="text-accent-primary font-semibold">(billed annually at ${premiumPlan.price.yearly}/yr)</span>}
                </span>
              </div>
              <p className="text-xs text-text-muted m-0 mb-8">
                {interval === 'yearly' ? '33% savings applied with annual billing' : 'Flexible monthly billing, cancel anytime'}
              </p>

              <div className="border-t border-border-subtle pt-6 mb-8 flex flex-col gap-3.5">
                {featuresList.map((f) => {
                  const included = f.premium !== false;
                  return (
                    <div key={f.label} className="flex items-start gap-3 text-[13.5px]">
                      {included ? (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-primary text-accent-on-primary">
                          <Check size={12} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-text-dimmed">
                          <Minus size={13} />
                        </div>
                      )}
                      <span className="text-text-primary font-medium">
                        {f.label}
                        {typeof f.premium === 'string' && (
                          <strong className="ml-1 text-accent-primary font-semibold">({f.premium})</strong>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/signup?plan=premium"
              className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary py-3 text-[14px] font-bold text-accent-on-primary no-underline transition-all hover:bg-accent-hover hover:shadow-md"
            >
              Start 7-day free trial
            </Link>
          </div>
        </div>

        {/* Refund / Guarantee note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted m-0">
            Cancel anytime. 14-day money-back guarantee. Read our{' '}
            <Link href="/refunds" className="text-accent-primary underline hover:text-accent-hover">
              refund policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

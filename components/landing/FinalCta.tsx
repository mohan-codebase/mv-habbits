import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-bg-secondary py-[clamp(64px,10vw,100px)] px-[clamp(16px,4vw,48px)] text-center">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full opacity-25 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow-lg) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[680px]">
        <h2 className="text-[clamp(28px,4.5vw,46px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.15] m-0 mb-4">
          Ready to build routines that actually stick?
        </h2>
        <p className="text-[16px] text-text-secondary leading-[1.6] m-0 mb-8 max-w-[520px] mx-auto">
          Join today and establish your first streak. Free forever for up to 5 habits, no credit card required.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-8 py-4 text-[15px] font-bold text-accent-on-primary no-underline transition-all duration-150 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <span>Start free today</span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

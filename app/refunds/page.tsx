import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { SUPPORT_EMAIL } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Refund Policy — MV Habits',
  description: 'Learn about our 14-day money-back guarantee and refund policy.',
};

const EFFECTIVE_DATE = 'April 28, 2026';

function PageHero({ badge, title, subtitle }: { badge: string; title: string; subtitle: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle bg-bg-secondary [padding:clamp(80px,10vw,120px)_clamp(16px,5vw,64px)_clamp(36px,5vw,56px)] text-center">
      <div className="max-w-[720px] mx-auto">
        <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-accent-primary [font-family:'IBM_Plex_Mono',monospace] px-3.5 py-[5px] rounded-[100px] border border-border-accent bg-accent-glow mb-5">
          {badge}
        </span>
        <h1 className="[font-size:clamp(28px,4vw,44px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.2] m-0 mb-3.5">
          {title}
        </h1>
        <p className="text-[15px] text-text-secondary leading-[1.6] m-0">{subtitle}</p>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  content,
  items,
  footer,
}: {
  id: string;
  title: string;
  content?: string;
  items?: { subtitle: string; text: string }[];
  footer?: string;
}) {
  return (
    <section id={id} className="scroll-mt-[88px]">
      <h2 className="[font-size:clamp(17px,2vw,20px)] font-bold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.02em] m-0 mb-3.5">
        {title}
      </h2>
      {content && (
        <p className={`text-[14.5px] text-text-secondary leading-[1.75] ${items ? 'm-0 mb-4' : 'm-0'}`}>
          {content}
        </p>
      )}
      {items && (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.subtitle}
              className="px-[18px] py-3.5 bg-bg-card border border-border-subtle rounded-lg border-l-[3px] border-l-accent-primary"
            >
              <p className="text-[13px] font-bold text-text-primary [font-family:'Outfit',sans-serif] m-0 mb-[5px]">
                {item.subtitle}
              </p>
              <p className="text-[13.5px] text-text-secondary leading-[1.65] m-0">{item.text}</p>
            </div>
          ))}
        </div>
      )}
      {footer && (
        <p className="text-[13.5px] text-text-muted leading-[1.65] mt-3.5 px-3.5 py-2.5 bg-bg-tertiary rounded-md border border-border-subtle">
          {footer}
        </p>
      )}
    </section>
  );
}

const REFUND_SECTIONS = [
  {
    id: 'overview',
    title: '1. 14-Day Money-Back Guarantee',
    content:
      'We want you to be completely satisfied with MV Habits. We offer an unconditional 14-day money-back guarantee on all initial subscription purchases (both monthly and annual plans).',
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    items: [
      {
        subtitle: 'Initial Purchases',
        text: 'You may request a full refund within 14 calendar days of your original payment date, no questions asked.',
      },
      {
        subtitle: 'Recurring Renewals',
        text: 'For annual renewals, refund requests must be submitted within 7 days of the renewal charge. Monthly renewals are non-refundable once the billing month has begun, but you can cancel at any time to stop future charges.',
      },
      {
        subtitle: 'Account Status',
        text: 'Upon refund processing, your account will be reverted to the Free tier. Your historical habits and entries will remain intact.',
      },
    ],
  },
  {
    id: 'request',
    title: '3. How to Request a Refund',
    content:
      'To request a refund, please send an email to our support team with your account email address and transaction ID or invoice receipt.',
    footer: `Contact: ${SUPPORT_EMAIL}`,
  },
  {
    id: 'processing',
    title: '4. Processing Time',
    content:
      'Refunds are typically reviewed and approved within 2 business days. Depending on your bank or payment provider, it may take 5–10 business days for the funds to reflect on your statement.',
  },
];

export default function RefundsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary">
        <PageHero
          badge="Legal"
          title="Refund Policy"
          subtitle={<>Effective date: <strong className="text-text-primary">{EFFECTIVE_DATE}</strong></>}
        />

        <div className="max-w-[800px] mx-auto [padding:clamp(40px,6vw,72px)_clamp(16px,5vw,40px)] flex flex-col gap-12">
          {/* TOC */}
          <nav
            aria-label="Contents"
            className="bg-bg-card border border-border-subtle rounded-xl px-[26px] py-[22px] shadow-none"
          >
            <p className="text-xs font-semibold tracking-[0.1em] uppercase text-text-muted [font-family:'IBM_Plex_Mono',monospace] m-0 mb-3">
              Contents
            </p>
            <ol className="list-none p-0 m-0 flex flex-col gap-2">
              {REFUND_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[13.5px] text-text-secondary no-underline transition-colors hover:text-accent-primary"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {REFUND_SECTIONS.map((s) => (
            <Section key={s.id} {...s} />
          ))}

          {/* Footer nav */}
          <div className="pt-4 border-t border-border-subtle flex gap-5 flex-wrap">
            <Link href="/" className="text-[13.5px] text-accent-primary no-underline font-semibold">
              ← Back to home
            </Link>
            <Link
              href="/terms"
              className="text-[13.5px] text-text-muted no-underline transition-colors hover:text-text-primary"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

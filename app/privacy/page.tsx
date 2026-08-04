'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';

const EFFECTIVE_DATE = 'April 28, 2026';

/* ─── Shared layout primitives ─────────────────────────────────── */

function PageHero({ badge, title, subtitle }: { badge: string; title: string; subtitle: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle bg-bg-secondary [padding:clamp(80px,10vw,120px)_clamp(16px,5vw,64px)_clamp(36px,5vw,56px)] text-center">
      <div className="max-w-[720px] mx-auto">
        <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-accent-primary [font-family:'IBM_Plex_Mono',monospace] px-3.5 py-[5px] rounded-[100px] border border-border-accent bg-accent-glow mb-5">{badge}</span>
        <h1 className="[font-size:clamp(28px,4vw,44px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.2] m-0 mb-3.5">{title}</h1>
        <p className="text-[15px] text-text-secondary leading-[1.6] m-0">{subtitle}</p>
      </div>
    </div>
  );
}

function Section({ id, title, content, items, footer }: {
  id: string; title: string; content?: string;
  items?: { subtitle: string; text: string }[]; footer?: string;
}) {
  return (
    <section id={id} className="scroll-mt-[88px]">
      <h2 className="[font-size:clamp(17px,2vw,20px)] font-bold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.02em] m-0 mb-3.5">{title}</h2>
      {content && <p className={`text-[14.5px] text-text-secondary leading-[1.75] ${items ? 'm-0 mb-4' : 'm-0'}`}>{content}</p>}
      {items && (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item.subtitle} className="px-[18px] py-3.5 bg-bg-card border border-border-subtle rounded-lg border-l-[3px] border-l-accent-primary">
              <p className="text-[13px] font-bold text-text-primary [font-family:'Outfit',sans-serif] m-0 mb-[5px]">{item.subtitle}</p>
              <p className="text-[13.5px] text-text-secondary leading-[1.65] m-0">{item.text}</p>
            </div>
          ))}
        </div>
      )}
      {footer && (
        <p className="text-[13.5px] text-text-muted leading-[1.65] mt-3.5 px-3.5 py-2.5 bg-bg-tertiary rounded-md border border-border-subtle">{footer}</p>
      )}
    </section>
  );
}

const PRIVACY_SECTIONS = [
  {
    id: 'overview', title: '1. Overview',
    content: 'Productivity Master ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. If you disagree with its terms, please discontinue use of the Service.',
  },
  {
    id: 'data-collected', title: '2. Information We Collect',
    items: [
      { subtitle: 'Account Information', text: 'Email address and optional display name. Passwords are never stored in plaintext — authentication is handled by Supabase with bcrypt hashing.' },
      { subtitle: 'Habit & Entry Data', text: 'Habits you create (name, icon, colour, category, reminder time) and daily check-in entries (date, completion status, optional notes).' },
      { subtitle: 'Push Notification Tokens', text: 'If you opt in, we store your browser push subscription endpoint and encryption keys. These are used solely to deliver habit reminders and deleted on unsubscribe.' },
      { subtitle: 'Usage Analytics', text: 'Anonymised, aggregate usage data only. We do not use Google Analytics or build advertising profiles.' },
      { subtitle: 'Device & Browser', text: 'User-agent string for debugging. We do not track cross-site behaviour.' },
    ],
  },
  {
    id: 'data-use', title: '3. How We Use Your Information',
    items: [
      { subtitle: 'Provide the Service', text: 'Authentication, habit display, streak and analytics computation.' },
      { subtitle: 'Reminders', text: 'Sending push notifications at your configured times, if opted in.' },
      { subtitle: 'Product Improvement', text: 'Understanding aggregate usage patterns. We never sell your data.' },
      { subtitle: 'Security', text: 'Detecting and preventing fraud, abuse, and unauthorised access.' },
      { subtitle: 'Legal Compliance', text: 'Complying with applicable laws and lawful government requests.' },
    ],
  },
  {
    id: 'data-sharing', title: '4. Data Sharing & Third Parties',
    content: 'We do not sell, trade, or rent your personal information. We use the following sub-processors:',
    items: [
      { subtitle: 'Supabase', text: 'Database hosting and authentication. Data stored in the EU (Frankfurt). See supabase.com/privacy.' },
      { subtitle: 'Vercel', text: 'Application hosting. See vercel.com/legal/privacy-policy.' },
      { subtitle: 'Browser Push Services', text: "Push notifications route through the browser vendor's push service (FCM/APNs). We only send encrypted payloads." },
    ],
  },
  {
    id: 'data-retention', title: '5. Data Retention',
    content: 'We retain your data for as long as your account is active. On account deletion, all data is permanently removed within 30 days. Anonymised aggregate metrics may be retained indefinitely.',
  },
  {
    id: 'your-rights', title: '6. Your Rights',
    content: 'Depending on your jurisdiction (GDPR, CCPA, etc.) you may have the right to:',
    items: [
      { subtitle: 'Access', text: 'Request a copy of all personal data we hold about you.' },
      { subtitle: 'Correction', text: 'Request correction of inaccurate data.' },
      { subtitle: 'Deletion', text: 'Request deletion of your account and all associated data.' },
      { subtitle: 'Portability', text: 'Export your habits and entries in JSON format.' },
      { subtitle: 'Objection', text: 'Object to processing for certain purposes.' },
    ],
    footer: 'To exercise any right, email privacy@productivity-master.app. We respond within 30 days.',
  },
  {
    id: 'cookies', title: '7. Cookies & Local Storage',
    content: 'Productivity Master uses the following browser storage:',
    items: [
      { subtitle: 'Auth Cookies', text: 'Supabase sets a secure, HttpOnly session cookie to keep you logged in.' },
      { subtitle: 'Preferences (localStorage)', text: 'Theme and onboarding state. These never leave your device.' },
      { subtitle: 'Push State (localStorage)', text: 'Subscription status cached locally to avoid unnecessary prompts.' },
    ],
    footer: 'We do not use third-party advertising or tracking cookies.',
  },
  {
    id: 'security', title: '8. Security',
    content: 'We use TLS in transit, Row Level Security (RLS) on all database tables, regular dependency auditing, and VAPID-authenticated Web Push. No internet transmission is 100% secure — we cannot guarantee absolute security.',
  },
  {
    id: 'children', title: "9. Children's Privacy",
    content: 'The Service is not directed at children under 13. We do not knowingly collect data from children under 13. Contact privacy@productivity-master.app immediately if you believe a child has registered.',
  },
  {
    id: 'changes', title: '10. Changes to This Policy',
    content: 'We may update this policy. Material changes will be communicated via email or in-app banner. Continued use after changes constitutes acceptance.',
  },
  {
    id: 'contact', title: '11. Contact',
    content: 'For privacy questions or data requests:',
    footer: 'privacy@productivity-master.app',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary">
        <PageHero
          badge="Legal"
          title="Privacy Policy"
          subtitle={<>Effective date: <strong className="text-text-primary">{EFFECTIVE_DATE}</strong></>}
        />

        <div className="max-w-[800px] mx-auto [padding:clamp(40px,6vw,72px)_clamp(16px,5vw,40px)] flex flex-col gap-12">
          {/* TOC */}
          <nav aria-label="Contents" className="bg-bg-card border border-border-subtle rounded-xl px-[26px] py-[22px] shadow-none">
            <p className="text-xs font-semibold tracking-[0.1em] uppercase text-text-muted [font-family:'IBM_Plex_Mono',monospace] m-0 mb-3">Contents</p>
            <ol className="list-none p-0 m-0 flex flex-col gap-2">
              {PRIVACY_SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[13.5px] text-text-secondary no-underline transition-colors hover:text-accent-primary">{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {PRIVACY_SECTIONS.map(s => <Section key={s.id} {...s} />)}

          {/* Footer nav */}
          <div className="pt-4 border-t border-border-subtle flex gap-5 flex-wrap">
            <Link href="/" className="text-[13.5px] text-accent-primary no-underline font-semibold">← Back to home</Link>
            <Link href="/terms" className="text-[13.5px] text-text-muted no-underline transition-colors hover:text-text-primary">Terms of Service →</Link>
          </div>
        </div>
      </main>
    </>
  );
}

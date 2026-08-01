'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';

const EFFECTIVE_DATE = 'April 28, 2026';

function PageHero({ badge, title, subtitle }: { badge: string; title: string; subtitle: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle bg-[linear-gradient(to_bottom,var(--bg-secondary),var(--bg-primary))] [padding:clamp(80px,10vw,120px)_clamp(16px,5vw,64px)_clamp(36px,5vw,56px)] text-center">
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
            <div key={item.subtitle} className="px-[18px] py-3.5 bg-bg-card border border-border-subtle rounded-lg border-l-[3px] border-l-indigo">
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

const TERMS_SECTIONS = [
  {
    id: 'acceptance', title: '1. Acceptance of Terms',
    content: 'By accessing or using Productivity Master ("Service", "we", "our", "us"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use the Service. We may update these Terms at any time; continued use constitutes acceptance of the updated Terms.',
  },
  {
    id: 'eligibility', title: '2. Eligibility',
    content: 'You must be at least 13 years old to use Productivity Master. By using the Service, you represent that you meet this requirement. If you are under 18, you represent that you have your parent or guardian\'s permission.',
  },
  {
    id: 'account', title: '3. Account Registration',
    items: [
      { subtitle: 'Accuracy', text: 'You must provide accurate information when creating an account.' },
      { subtitle: 'Security', text: 'You are responsible for maintaining the confidentiality of your password and for all activity under your account.' },
      { subtitle: 'Notification of breach', text: 'You must notify us immediately at support@productivity-master.app if you suspect unauthorised access to your account.' },
      { subtitle: 'One account per person', text: 'You may not create multiple accounts to circumvent any limitations or restrictions.' },
    ],
  },
  {
    id: 'acceptable-use', title: '4. Acceptable Use',
    content: 'You agree not to:',
    items: [
      { subtitle: 'Misuse the Service', text: 'Use the Service for any unlawful purpose, or in violation of any applicable laws or regulations.' },
      { subtitle: 'Automated access', text: 'Scrape, crawl, or use bots to access the Service without our prior written consent.' },
      { subtitle: 'Interference', text: 'Attempt to disrupt, disable, or impair the security or integrity of the Service or its servers.' },
      { subtitle: 'Impersonation', text: 'Impersonate any person or entity, or falsely represent your affiliation with any person or entity.' },
      { subtitle: 'IP violations', text: 'Upload or transmit content that infringes any intellectual property or privacy rights of any third party.' },
    ],
  },
  {
    id: 'intellectual-property', title: '5. Intellectual Property',
    content: 'The Service and its original content, features, and functionality are owned by Productivity Master and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of the data you input (your habits and entries). You grant us a limited, non-exclusive licence to store and process your data solely to provide the Service.',
  },
  {
    id: 'subscription', title: '6. Subscriptions & Payments',
    content: 'Productivity Master currently offers a free tier with all core features included. If we introduce paid plans in the future, the following will apply:',
    items: [
      { subtitle: 'Billing', text: 'Subscriptions are billed in advance on a monthly or annual basis. All fees are exclusive of applicable taxes.' },
      { subtitle: 'Cancellation', text: 'You may cancel your subscription at any time. Your access to paid features continues until the end of the current billing period.' },
      { subtitle: 'Refunds', text: 'We offer a 14-day money-back guarantee for first-time paid subscribers, no questions asked. After 14 days, payments are non-refundable.' },
      { subtitle: 'Price changes', text: 'We reserve the right to change pricing with 30 days\' notice via email or in-app notification.' },
    ],
  },
  {
    id: 'disclaimers', title: '7. Disclaimers',
    content: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.',
  },
  {
    id: 'limitation', title: '8. Limitation of Liability',
    content: 'TO THE FULLEST EXTENT PERMITTED BY LAW, HABITFORGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF £50 GBP OR THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRIOR TO THE CLAIM.',
  },
  {
    id: 'termination', title: '9. Termination',
    content: 'We reserve the right to suspend or terminate your account at our sole discretion, without notice, if you violate these Terms or for any other reason. You may delete your account at any time from the Settings page. Upon termination, all licences granted to you immediately cease, and we will delete your data in accordance with our Privacy Policy.',
  },
  {
    id: 'governing-law', title: '10. Governing Law',
    content: 'These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to conflict-of-law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
  },
  {
    id: 'changes-terms', title: '11. Changes to These Terms',
    content: 'We may revise these Terms at any time. If the changes are material, we will notify you via email or an in-app notice at least 14 days before they take effect. Your continued use of the Service after changes are effective constitutes your agreement to the revised Terms.',
  },
  {
    id: 'contact-terms', title: '12. Contact',
    content: 'For questions about these Terms:',
    footer: 'legal@productivity-master.app',
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary">
        <PageHero
          badge="Legal"
          title="Terms of Service"
          subtitle={<>Effective date: <strong className="text-text-primary">{EFFECTIVE_DATE}</strong></>}
        />

        <div className="max-w-[800px] mx-auto [padding:clamp(40px,6vw,72px)_clamp(16px,5vw,40px)] flex flex-col gap-12">
          {/* TOC */}
          <nav aria-label="Contents" className="bg-bg-card border border-border-subtle rounded-xl px-[26px] py-[22px] shadow-none">
            <p className="text-xs font-semibold tracking-[0.1em] uppercase text-text-muted [font-family:'IBM_Plex_Mono',monospace] m-0 mb-3">Contents</p>
            <ol className="list-none p-0 m-0 flex flex-col gap-2">
              {TERMS_SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[13.5px] text-text-secondary no-underline transition-colors hover:text-indigo">{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {TERMS_SECTIONS.map(s => <Section key={s.id} {...s} />)}

          {/* Footer nav */}
          <div className="pt-4 border-t border-border-subtle flex gap-5 flex-wrap">
            <Link href="/" className="text-[13.5px] text-accent-primary no-underline font-semibold">← Back to home</Link>
            <Link href="/privacy" className="text-[13.5px] text-text-muted no-underline transition-colors hover:text-text-primary">Privacy Policy →</Link>
          </div>
        </div>
      </main>
    </>
  );
}

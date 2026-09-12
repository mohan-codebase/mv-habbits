import React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Is my data private and secure?',
    a: 'Yes. Every database table enforces PostgreSQL Row Level Security (RLS), meaning no other user can access your habits, logs, or analytics. We do not sell data, display ads, or run third-party tracker scripts. You retain 100% ownership of your records.',
  },
  {
    q: 'Can I use Productivity Master on my phone?',
    a: 'Yes. The application is built as a Progressive Web App (PWA). You can install it directly to your home screen on iOS (via Safari Share → Add to Home Screen) and Android (via Chrome install banner) for a fullscreen native-like experience.',
  },
  {
    q: 'What happens if I cancel my Premium subscription?',
    a: 'If you cancel, you will keep Premium access until the end of your billing cycle. After that, your account simply transitions to the Free tier. You will never lose your historical check-in data or habits; premium features like AI coaching simply lock until renewed.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes. We offer an unconditional 14-day refund policy for all subscription purchases if you are not satisfied. Please review our full terms on our refund policy page.',
    hasRefundLink: true,
  },
  {
    q: 'Does it work offline?',
    a: 'Our cached service worker allows the app shell to load offline, but habit check-in synchronization and streak validation require an active internet connection to ensure your cloud database stays in lockstep across devices.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. You can export your full habit history anytime. Free users can export raw JSON. Premium users can also export formatted CSV, Excel spreadsheets (.xlsx), and printable summary PDF reports.',
  },
  {
    q: 'Who can see my habits and daily streaks?',
    a: 'Only you. There are no public social feeds or shared leaderboards with strangers. Your routines, notes, and milestones are strictly private to your authenticated account.',
  },
];

export default function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-[70px] border-b border-border-subtle bg-bg-secondary py-[clamp(64px,10vw,100px)] px-[clamp(16px,4vw,48px)]"
    >
      <div className="mx-auto max-w-[840px]">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary [font-family:'IBM_Plex_Mono',monospace] px-3.5 py-1 rounded-full border border-border-accent bg-accent-glow mb-4">
            Got Questions?
          </span>
          <h2 className="text-[clamp(26px,4vw,40px)] font-extrabold text-text-primary [font-family:'Outfit',sans-serif] tracking-[-0.03em] leading-[1.2] m-0 mb-3.5">
            Frequently Asked Questions
          </h2>
          <p className="text-[15px] text-text-secondary leading-[1.65] m-0">
            Clear, honest answers about privacy, platforms, and subscriptions.
          </p>
        </div>

        {/* FAQ Accordion using native details/summary */}
        <div className="flex flex-col gap-3.5">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-border-subtle bg-bg-card transition-all duration-200 open:border-border-default open:bg-bg-elevated"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-[15px] font-bold text-text-primary [font-family:'Outfit',sans-serif] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-text-muted transition-transform duration-200 group-open:rotate-180 group-open:text-accent-primary">
                  <ChevronDown size={16} />
                </span>
              </summary>
              <div className="px-5 pb-5 pt-1 text-[14px] leading-[1.7] text-text-secondary border-t border-border-subtle/50 mt-1">
                <p className="m-0">
                  {faq.a}
                  {faq.hasRefundLink && (
                    <Link
                      href="/refunds"
                      className="ml-1 text-accent-primary font-medium underline hover:text-accent-hover"
                    >
                      View refund policy &rarr;
                    </Link>
                  )}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

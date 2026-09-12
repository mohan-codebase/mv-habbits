import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { PRODUCT_NAME, SUPPORT_EMAIL, LEGAL_ENTITY } from '@/lib/brand';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-bg-primary text-text-secondary">
      <div className="mx-auto max-w-[1200px] px-[clamp(16px,4vw,48px)] py-14">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Brand & Tagline */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 no-underline mb-3">
              <AppLogo width={26} height={26} />
              <span className="text-[15px] font-bold tracking-[-0.02em] text-text-primary [font-family:'Outfit',sans-serif]">
                {PRODUCT_NAME}
              </span>
            </Link>
            <p className="text-[13px] leading-[1.6] text-text-muted m-0 mb-4 max-w-[240px]">
              Daily habit tracker built for streaks, routines, and honest personal growth.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary [font-family:'IBM_Plex_Mono',monospace] m-0 mb-4">
              Product
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <Link href="/#features" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary [font-family:'IBM_Plex_Mono',monospace] m-0 mb-4">
              Legal
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <Link href="/privacy" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-text-secondary no-underline transition-colors hover:text-text-primary">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-primary [font-family:'IBM_Plex_Mono',monospace] m-0 mb-4">
              Support
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-text-secondary no-underline transition-colors hover:text-text-primary"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Systems Operational</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p className="m-0">
            &copy; {currentYear} {LEGAL_ENTITY}. All rights reserved.
          </p>
          <p className="m-0">
            Secure, private habit tracking. Built with Next.js &amp; Supabase.
          </p>
        </div>
      </div>
    </footer>
  );
}

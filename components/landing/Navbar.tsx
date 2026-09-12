'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Tighten the glass navbar as user scrolls
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between px-[clamp(16px,4vw,48px)] border-b transition-[background,border-color] duration-200 ease-[ease]"
        style={{
          background: scrolled ? 'var(--bg-glass-strong)' : 'var(--bg-glass)',
          borderBottomColor: scrolled ? 'var(--border-default)' : 'var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 no-underline"
          onClick={() => setMenuOpen(false)}
        >
          <AppLogo width={28} height={28} />
          <span className="text-[15px] font-bold tracking-[-0.02em] text-text-primary">
            Productivity Master
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hf-desktop-nav flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-sm px-3 py-1.5 text-[13.5px] font-medium text-text-secondary no-underline transition-colors duration-150 hover:bg-bg-tertiary hover:text-text-primary"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hf-desktop-nav flex items-center gap-2">
          <Link
            href="/login"
            className="cursor-pointer rounded-full border-none bg-transparent px-3.5 py-[7px] text-[13.5px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary no-underline [font-family:inherit]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="cursor-pointer rounded-full border-none bg-accent-primary px-4 py-[7px] text-[13.5px] font-bold text-accent-on-primary shadow-none no-underline transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] [font-family:inherit]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          className="hf-mobile-menu-btn hidden h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-bg-tertiary text-text-secondary"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile fullscreen menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 top-[60px] z-[49] flex flex-col gap-1 overflow-y-auto bg-bg-glass-strong px-[clamp(16px,5vw,32px)] py-6"
          >
            {NAV_LINKS.map(({ label, href }, i) => (
              <motion.a
                key={label}
                href={href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                onClick={() => setMenuOpen(false)}
                className="rounded-md border-b border-border-subtle px-3 py-3.5 text-[18px] font-semibold text-text-primary no-underline transition-colors duration-150 hover:bg-bg-tertiary font-['Outfit']"
              >
                {label}
              </motion.a>
            ))}

            {/* Mobile CTA buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="w-full cursor-pointer rounded-lg border border-border-default bg-bg-tertiary p-3.5 text-center text-[15px] font-semibold text-text-primary no-underline [font-family:inherit]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="w-full cursor-pointer rounded-lg border-none bg-accent-primary p-3.5 text-center text-[15px] font-bold text-accent-on-primary shadow-none no-underline [font-family:inherit]"
              >
                Start for free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

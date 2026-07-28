'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, Smile } from 'lucide-react';
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

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 48px)',
          background: scrolled ? 'var(--bg-glass-strong)' : 'var(--bg-glass)',
          borderBottom: `1px solid ${scrolled ? 'var(--border-default)' : 'var(--border-subtle)'}`,
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          onClick={() => setMenuOpen(false)}
        >
          <AppLogo width={28} height={28} />
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            Productivity Master
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hf-desktop-nav">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--r-sm)',
                fontSize: 13.5,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hf-desktop-nav">
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '7px 14px',
              borderRadius: 9999,
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13.5,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
              fontFamily: 'inherit',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Sign in
            </button>
          </Link>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '7px 16px',
                borderRadius: 9999,
                background: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
                fontSize: 13.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: 'none',
              }}
            >
              Get started
            </motion.button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'none', // shown via .hf-mobile-menu-btn
            width: 36, height: 36,
            borderRadius: 'var(--r-sm)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
          className="hf-mobile-menu-btn"
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
            style={{
              position: 'fixed',
              top: 60, left: 0, right: 0, bottom: 0,
              zIndex: 49,
              background: 'var(--bg-glass-strong)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px clamp(16px, 5vw, 32px)',
              gap: 4,
              overflowY: 'auto',
            }}
          >
            {NAV_LINKS.map(({ label, href }, i) => (
              <motion.a
                key={label}
                href={href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '14px 12px',
                  borderRadius: 'var(--r-md)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: "'Outfit'",
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {label}
              </motion.a>
            ))}

            {/* Mobile CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <button style={{
                  width: '100%', padding: '14px',
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Sign in
                </button>
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)}>
                <button style={{
                  width: '100%', padding: '14px',
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--accent-primary)',
                  color: 'var(--accent-on-primary)',
                  border: 'none',
                  fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: 'none',
                }}>
                  Start for free
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

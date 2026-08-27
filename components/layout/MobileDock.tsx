'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Plus, Settings, NotebookPen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccentColor } from '@/components/ui/ThemeProvider';

interface MobileDockProps {
  onAddHabit?: () => void;
}

export default function MobileDock({ onAddHabit }: MobileDockProps) {
  const pathname = usePathname();
  const accentHex = useAccentColor();

  const isOverview = pathname === '/dashboard';
  const isAnalytics = pathname?.startsWith('/dashboard/analytics');
  const isNotes = pathname?.startsWith('/dashboard/notes');
  const isSettings = pathname?.startsWith('/dashboard/settings');

  const triggerAddHabit = (e: React.MouseEvent) => {
    if (onAddHabit) {
      e.preventDefault();
      onAddHabit();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('productivity-master:open-add'));
    }
  };

  const navItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: isOverview,
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      active: isAnalytics,
    },
    {
      label: 'Notes',
      href: '/dashboard/notes',
      icon: NotebookPen,
      active: isNotes,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      active: isSettings,
    },
  ];

  return (
    <div className="hf-mobile-nav no-print fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[210] flex justify-center pointer-events-none lg:hidden">
        <motion.nav
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="pointer-events-auto w-full max-w-md bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--border-medium)] rounded-full px-2 py-1.5 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_24px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)] relative"
        >
          {/* Left items: Home & Analytics */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer min-w-[60px]"
                  style={{
                    color: item.active ? accentHex : 'var(--text-muted)',
                  }}
                >
                  {item.active && (
                    <motion.div
                      layoutId="mobile-dock-pill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `color-mix(in srgb, ${accentHex} 16%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${accentHex} 32%, transparent)`,
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={item.active ? 2.4 : 1.8} className="relative z-10" />
                  <span className="text-[10px] tracking-tight relative z-10 font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Center Plus CTA Button */}
          <div className="px-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.06 }}
              onClick={triggerAddHabit}
              aria-label="Add Habit"
              className="w-11 h-11 rounded-full text-white flex items-center justify-center border border-white/25 transition-all cursor-pointer relative z-10"
              style={{
                background: accentHex,
                boxShadow: `0 0 20px color-mix(in srgb, ${accentHex} 50%, transparent), 0 4px 12px rgba(0,0,0,0.4)`,
              }}
            >
              <Plus size={22} strokeWidth={2.8} />
            </motion.button>
          </div>

          {/* Right items: Habits & Settings */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {navItems.slice(2).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer min-w-[60px]"
                  style={{
                    color: item.active ? accentHex : 'var(--text-muted)',
                  }}
                >
                  {item.active && (
                    <motion.div
                      layoutId="mobile-dock-pill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `color-mix(in srgb, ${accentHex} 16%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${accentHex} 32%, transparent)`,
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={item.active ? 2.4 : 1.8} className="relative z-10" />
                  <span className="text-[10px] tracking-tight relative z-10 font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      </div>
  );
}


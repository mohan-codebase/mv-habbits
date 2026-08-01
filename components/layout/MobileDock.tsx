'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Plus, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileDockProps {
  onAddHabit?: () => void;
}

export default function MobileDock({ onAddHabit }: MobileDockProps) {
  const pathname = usePathname();

  const isOverview = pathname === '/dashboard';
  const isAnalytics = pathname === '/dashboard/analytics';
  const isSettings = pathname === '/dashboard/settings';

  const triggerAddHabit = (e: React.MouseEvent) => {
    if (onAddHabit) {
      e.preventDefault();
      onAddHabit();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('productivity-master:open-add'));
    }
  };

  return (
    <div
      className="hf-mobile-nav no-print fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none sm:hidden"
    >
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="pointer-events-auto w-full max-w-sm bg-[var(--bg-glass-strong)] backdrop-blur-xl border border-[var(--border-medium)] rounded-full px-3 py-2 flex items-center justify-between shadow-2xl shadow-purple-950/20"
      >
        {/* Home / Overview */}
        <Link
          href="/dashboard"
          aria-label="Overview"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isOverview
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          <LayoutDashboard size={18} strokeWidth={isOverview ? 2.5 : 2} />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Analytics */}
        <Link
          href="/dashboard/analytics"
          aria-label="Analytics"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isAnalytics
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          <BarChart3 size={18} strokeWidth={isAnalytics ? 2.5 : 2} />
          <span className="text-[10px]">Analytics</span>
        </Link>

        {/* Quick Add Plus Button */}
        <button
          onClick={triggerAddHabit}
          aria-label="Add Habit"
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-purple-400 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 border border-white/20 active:scale-90 transition-transform cursor-pointer -mt-1"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isSettings
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          <Settings size={18} strokeWidth={isSettings ? 2.5 : 2} />
          <span className="text-[10px]">Settings</span>
        </Link>
      </motion.nav>
    </div>
  );
}

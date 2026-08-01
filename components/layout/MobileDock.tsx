'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Plus, Trophy, Settings, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileDockProps {
  onAddHabit?: () => void;
}

export default function MobileDock({ onAddHabit }: MobileDockProps) {
  const pathname = usePathname();

  const isOverview = pathname === '/dashboard';
  const isAnalytics = pathname === '/dashboard/analytics';
  const isAchievements = pathname === '/dashboard/achievements';
  const isNetwork = pathname === '/dashboard/network';
  const isSettings = pathname === '/dashboard/settings';

  const triggerAddHabit = (e: React.MouseEvent) => {
    if (onAddHabit) {
      e.preventDefault();
      onAddHabit();
    }
  };

  return (
    <div
      className="hf-mobile-nav no-print fixed bottom-4 left-4 right-4 z-[90] flex justify-center pointer-events-none"
    >
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="pointer-events-auto w-full max-w-[420px] bg-bg-glass-strong border border-border-default rounded-full px-3 py-1.5 flex items-center justify-around shadow-none"
      >
        {/* Overview */}
        <Link
          href="/dashboard"
          aria-label="Overview"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-full no-underline transition-all duration-200 ${
            isOverview ? 'text-accent-on-primary bg-accent-primary' : 'text-text-muted bg-transparent'
          }`}
        >
          <LayoutDashboard size={19} strokeWidth={isOverview ? 2.5 : 2} />
          <span className={`text-[10px] ${isOverview ? 'font-bold' : 'font-medium'}`}>Home</span>
        </Link>


        {/* Quick Add Center Button */}
        <button
          onClick={triggerAddHabit}
          aria-label="Add Habit"
          className="w-11 h-11 rounded-full border-none bg-[linear-gradient(135deg,var(--accent-primary)_0%,var(--accent-hover)_100%)] text-accent-on-primary flex items-center justify-center cursor-pointer shadow-none mx-0.5 transition-transform duration-150 ease-out active:scale-[0.92]"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>


        {/* Settings */}
        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-full no-underline transition-all duration-200 ${
            isSettings ? 'text-accent-on-primary bg-accent-primary' : 'text-text-muted bg-transparent'
          }`}
        >
          <Settings size={19} strokeWidth={isSettings ? 2.5 : 2} />
          <span className={`text-[10px] ${isSettings ? 'font-bold' : 'font-medium'}`}>Settings</span>
        </Link>
      </motion.nav>
    </div>
  );
}

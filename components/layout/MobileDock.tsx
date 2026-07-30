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
      className="hf-mobile-nav no-print"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: '1px solid var(--border-default)',
          borderRadius: 9999,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          boxShadow: 'none',
        }}
      >
        {/* Overview */}
        <Link
          href="/dashboard"
          aria-label="Overview"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '8px 12px',
            borderRadius: 9999,
            textDecoration: 'none',
            color: isOverview ? 'var(--accent-on-primary)' : 'var(--text-muted)',
            background: isOverview ? 'var(--accent-primary)' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <LayoutDashboard size={19} strokeWidth={isOverview ? 2.5 : 2} />
          <span style={{ fontSize: 10, fontWeight: isOverview ? 700 : 500 }}>Home</span>
        </Link>


        {/* Quick Add Center Button */}
        <button
          onClick={triggerAddHabit}
          aria-label="Add Habit"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)',
            color: 'var(--accent-on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'none',
            margin: '0 2px',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>


        {/* Settings */}
        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '8px 12px',
            borderRadius: 9999,
            textDecoration: 'none',
            color: isSettings ? 'var(--accent-on-primary)' : 'var(--text-muted)',
            background: isSettings ? 'var(--accent-primary)' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <Settings size={19} strokeWidth={isSettings ? 2.5 : 2} />
          <span style={{ fontSize: 10, fontWeight: isSettings ? 700 : 500 }}>Settings</span>
        </Link>
      </motion.nav>
    </div>
  );
}

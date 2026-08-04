'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Trophy,
  CalendarCheck,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Search,
  X,
  Menu,
  Users,
  Activity,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme } from '@/components/ui/ThemeProvider';
import CommandPalette from '@/components/layout/CommandPalette';
import DevicesModal from '@/components/settings/DevicesModal';
import AppLogo from '@/components/ui/AppLogo';

// Sidebar nav row — filled when active, hover tint otherwise.
function NavItem({
  icon, label, active = false, href, onClick,
}: {
  icon?: React.ReactNode; label: string; active?: boolean; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm transition-all duration-150 no-underline ${
        active
          ? 'bg-[#8B5CF6] text-white font-bold shadow-accent'
          : 'text-slate-700 dark:text-slate-300 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 font-semibold'
      }`}
    >
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

// Expandable white-button group with sub-items
function NavGroup({
  label, expanded, onToggle, children,
}: {
  icon?: React.ReactNode;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-opacity cursor-pointer text-left shadow-sm"
      >
        <span className="flex-1">{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-center"
        >
          <ChevronDown size={15} color="currentColor" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0 pl-3.5 border-l-2 border-purple-500/20 ml-2.5 mt-0.5 mb-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-item inside a NavGroup
function SubNavItem({
  icon, label, active = false, href, onClick,
}: {
  icon?: React.ReactNode; label: string; active?: boolean; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-full text-xs transition-all duration-150 no-underline ${
        active
          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold'
          : 'text-slate-400 hover:bg-purple-500/10 hover:text-slate-200 font-normal'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const { theme, toggle } = useTheme();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const isDark = theme === 'dark';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isOverviewActive = pathname === '/dashboard';
  const isNotesActive = pathname === '/dashboard/notes';
  const isAnalyticsActive = pathname === '/dashboard/analytics';
  const isAchievementsActive = pathname === '/dashboard/achievements';
  const isYearActive = pathname === '/dashboard/year-in-review';
  const isQuotesActive = pathname === '/dashboard/quotes';
  const isNetworkActive = pathname === '/dashboard/network';
  const isFeedActive = pathname === '/dashboard/feed';
  const isSettingsActive = pathname === '/dashboard/settings';

  return (
    <>
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hf-desktop-sidebar-toggle fixed top-5 left-5 z-[60] w-10 h-10 rounded-full bg-slate-900/90 border border-purple-500/20 text-white cursor-pointer items-center justify-center hidden hover:bg-slate-800 transition-colors shadow-lg"
          title="Show Sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <aside
        className="hf-desktop-sidebar no-print fixed top-4 left-4 bottom-4 h-[calc(100vh-32px)] w-[240px] z-50 flex flex-col bg-[var(--bg-glass-strong)] border border-[var(--border-default)] backdrop-blur-xl rounded-3xl shadow-2xl p-4 overflow-y-auto transition-transform duration-300"
      >
        <div className="px-2 pt-0.5 pb-5">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline">
            <AppLogo width={32} height={32} />
            <div className="min-w-0">
              <p className="m-0 text-base font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">Productivity Master</p>
              <p className="m-0 mt-0.5 text-[11px] text-purple-500 dark:text-purple-400 font-semibold">by Mohan</p>
            </div>
          </Link>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-full mb-3.5 border border-[var(--border-default)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer font-medium text-xs transition-all"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search</span>
          <span className="text-[11px] font-bold text-slate-500">⌘K</span>
        </button>

        <nav className="flex flex-col gap-1">
          <p className="my-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Habit Tracker</p>
          <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={(e) => { if (isOverviewActive) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} />
          <NavItem icon={<NotebookPen size={17} />} label="Notes" active={isNotesActive} href="/dashboard/notes" />
          <NavItem icon={<Sparkles size={17} />} label="Quotes" active={isQuotesActive} href="/dashboard/quotes" />
          <NavItem icon={<BarChart3 size={17} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" />
          <NavItem icon={<Trophy size={17} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" />
          <NavItem icon={<CalendarCheck size={17} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" />

          <p className="mt-3.5 mb-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Social</p>
          <NavItem icon={<Users size={17} />} label="Network" active={isNetworkActive} href="/dashboard/network" />
          <NavItem icon={<Activity size={17} />} label="Feed" active={isFeedActive} href="/dashboard/feed" />

          <p className="mt-3.5 mb-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Settings</p>
          <NavItem icon={<Settings size={17} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" />
        </nav>

        <div className="mt-auto flex flex-col gap-1.5 pt-4">
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-full border-0 cursor-pointer bg-transparent text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors text-left"
          >
            <span className="flex shrink-0"><Menu size={18} /></span>
            Hide sidebar
          </button>
          <button
            onClick={toggle}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-full border-0 cursor-pointer bg-transparent text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors text-left"
          >
            <span className="flex shrink-0">{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          {user && (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 w-full p-2.5 rounded-2xl mt-1.5 border border-[var(--border-default)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] cursor-pointer text-left no-underline transition-all"
            >
              <div className="w-9 h-9 rounded-full shrink-0 bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                <p className="m-0 text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </Link>
          )}
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="hf-mobile-nav fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="hf-mobile-nav fixed top-0 left-0 bottom-0 w-[260px] z-[100] bg-[var(--bg-secondary)] border-r border-[var(--border-default)] p-5 flex flex-col overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 no-underline">
                  <AppLogo width={34} height={34} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-extrabold text-[var(--text-primary)] font-sans">Productivity Master</span>
                    <span className="text-[10px] text-purple-400 font-semibold">by Mohan</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border-0 flex items-center justify-center cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <button
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-full mb-3.5 border border-purple-500/20 bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer text-xs font-semibold"
              >
                <Search size={16} />
                <span className="flex-1 text-left">Search</span>
                <span className="text-[11px] font-bold text-slate-500">⌘K</span>
              </button>

              <nav className="flex flex-col gap-1">
                <p className="my-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500">Habit Tracker</p>
                <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<NotebookPen size={17} />} label="Notes" active={isNotesActive} href="/dashboard/notes" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<Sparkles size={17} />} label="Quotes" active={isQuotesActive} href="/dashboard/quotes" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<BarChart3 size={17} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<Trophy size={17} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<CalendarCheck size={17} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" onClick={() => setMobileOpen(false)} />

                <p className="mt-3.5 mb-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500">Social</p>
                <NavItem icon={<Users size={17} />} label="Network" active={isNetworkActive} href="/dashboard/network" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<Activity size={17} />} label="Feed" active={isFeedActive} href="/dashboard/feed" onClick={() => setMobileOpen(false)} />

                <p className="mt-3.5 mb-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500">Settings</p>
                <NavItem icon={<Settings size={17} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" onClick={() => setMobileOpen(false)} />
              </nav>

              <div className="mt-auto flex flex-col gap-1.5 pt-4">
                <button
                  onClick={() => { toggle(); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-full border-0 cursor-pointer bg-transparent text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors text-left"
                >
                  <span className="flex shrink-0">{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>

                {user && (
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-2xl mt-1.5 border border-[var(--border-default)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] cursor-pointer text-left no-underline transition-all"
                  >
                    <div className="w-9 h-9 rounded-full shrink-0 bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-xs font-bold text-[var(--text-primary)] truncate">{displayName}</p>
                      <p className="m-0 text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </>
  );
}

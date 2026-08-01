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
      className={`w-full flex items-center gap-3 px-[14px] py-[10px] rounded-full border-none cursor-pointer text-[14px] font-[inherit] text-left no-underline transition-[background,color] duration-150 ease-in-out ${
        active
          ? 'bg-accent-primary text-accent-on-primary font-bold'
          : 'bg-transparent text-text-secondary font-semibold hover:bg-[var(--surface-tint)]'
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
    <div className="flex flex-col gap-px">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-[10px] px-[14px] py-[10px] rounded-full border-none cursor-pointer bg-accent-primary text-accent-on-primary text-base font-bold font-[inherit] text-left transition-opacity duration-150 hover:opacity-[0.88]"
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
            <div className="flex flex-col gap-0 pl-[14px] border-l-2 border-[rgba(255,255,255,0.12)] ml-[10px] mt-0.5 mb-1">
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
      className={`w-full flex items-center gap-[10px] px-[10px] py-2 rounded-full border-none cursor-pointer text-[13px] font-[inherit] text-left no-underline transition-all duration-150 ${
        active
          ? 'bg-[rgba(255,255,255,0.10)] text-text-primary font-semibold'
          : 'bg-transparent text-text-muted font-normal hover:bg-[rgba(255,255,255,0.07)] hover:text-text-primary'
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
  const isNetworkActive = pathname === '/dashboard/network';
  const isFeedActive = pathname === '/dashboard/feed';
  const isSettingsActive = pathname === '/dashboard/settings';

  return (
    <>
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hf-desktop-sidebar-toggle fixed top-5 left-5 z-[60] w-[42px] h-[42px] rounded-full bg-bg-card border border-border-default shadow-none cursor-pointer text-text-primary items-center justify-center hidden"
          title="Show Sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <aside
        className="hf-desktop-sidebar no-print fixed top-4 left-4 bottom-4 h-[calc(100vh-32px)] w-[240px] z-50 flex flex-col bg-bg-card border border-border-default rounded-2xl shadow-none px-[14px] pt-5 pb-4 overflow-y-auto transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="px-2 pt-0.5 pb-[22px]">
          <Link href="/dashboard" className="flex items-center gap-[11px] no-underline">
            <AppLogo width={32} height={32} />
            <div className="min-w-0">
              <p className="m-0 text-lg font-extrabold text-text-primary tracking-[-0.02em] font-['Outfit',sans-serif]">Productivity Master</p>
              <p className="mt-px mb-0 text-xs text-text-muted font-semibold">by Mohan</p>
            </div>
          </Link>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-[10px] w-full px-3 py-[9px] rounded-full mb-[14px] border border-border-default bg-bg-card text-text-muted cursor-pointer font-[inherit] text-[13px] font-semibold"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search</span>
          <span className="text-xs font-bold text-text-dimmed">⌘K</span>
        </button>

        <nav className="flex flex-col gap-[3px]">
          <p className="mt-1 mb-[6px] px-3 text-[10px] font-bold tracking-[0.14em] uppercase text-text-dimmed">Habit Tracker</p>
          <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={(e) => { if (isOverviewActive) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} />
          <NavItem icon={<NotebookPen size={17} />} label="Notes" active={isNotesActive} href="/dashboard/notes" />
          <NavItem icon={<BarChart3 size={17} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" />
          <NavItem icon={<Trophy size={17} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" />
          <NavItem icon={<CalendarCheck size={17} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" />

          <p className="mt-[14px] mx-0 mb-[6px] px-3 text-[10px] font-bold tracking-[0.14em] uppercase text-text-dimmed">Social</p>
          <NavItem icon={<Users size={17} />} label="Network" active={isNetworkActive} href="/dashboard/network" />
          <NavItem icon={<Activity size={17} />} label="Feed" active={isFeedActive} href="/dashboard/feed" />

          <p className="mt-[14px] mx-0 mb-[6px] px-3 text-[10px] font-bold tracking-[0.14em] uppercase text-text-dimmed">Settings</p>
          <NavItem icon={<Settings size={17} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" />
        </nav>

        <div className="mt-auto flex flex-col gap-[6px] pt-[18px]">
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-3 w-full px-[14px] py-[11px] rounded-full border-none cursor-pointer bg-transparent text-text-secondary text-[14px] font-semibold font-[inherit] text-left transition-colors duration-150 hover:bg-[var(--surface-tint)]"
          >
            <span className="flex shrink-0"><Menu size={18} /></span>
            Hide sidebar
          </button>
          <button
            onClick={toggle}
            className="flex items-center gap-3 w-full px-[14px] py-[11px] rounded-full border-none cursor-pointer bg-transparent text-text-secondary text-[14px] font-semibold font-[inherit] text-left transition-colors duration-150 hover:bg-[var(--surface-tint)]"
          >
            <span className="flex shrink-0">{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          {user && (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-[11px] w-full px-3 py-[10px] rounded-full mt-[6px] border border-border-default bg-bg-card cursor-pointer font-[inherit] text-left no-underline"
            >
              <div className="w-9 h-9 rounded-full shrink-0 bg-accent-primary text-accent-on-primary flex items-center justify-center text-[14px] font-extrabold">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[13px] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</p>
                <p className="m-0 text-xs text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</p>
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
              className="hf-mobile-nav fixed inset-0 z-[99] bg-[rgba(0,0,0,0.5)]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="hf-mobile-nav fixed top-0 left-0 bottom-0 w-[240px] z-[100] bg-bg-tertiary border-r border-border-default px-4 py-5 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-[10px] no-underline">
                  <AppLogo width={34} height={34} />
                  <div className="flex flex-col leading-[1.15]">
                    <span className="text-[14px] font-extrabold text-text-primary font-['Outfit',sans-serif]">Productivity Master</span>
                    <span className="text-[10px] text-text-muted font-semibold">by Mohan</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.08)] border-none flex items-center justify-center cursor-pointer text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <button
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
                className="flex items-center gap-[10px] w-full px-3 py-[9px] rounded-full mb-[14px] border border-border-default bg-bg-card text-text-muted cursor-pointer font-[inherit] text-[13px] font-semibold"
              >
                <Search size={16} />
                <span className="flex-1 text-left">Search</span>
                <span className="text-xs font-bold text-text-dimmed">⌘K</span>
              </button>

              <nav className="flex flex-col gap-[3px]">
                <p className="mt-1 mb-[6px] px-3 text-[10px] font-bold tracking-[0.14em] uppercase text-text-dimmed">Habit Tracker</p>
                <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<NotebookPen size={17} />} label="Notes" active={isNotesActive} href="/dashboard/notes" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<BarChart3 size={17} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<Trophy size={17} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<CalendarCheck size={17} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" onClick={() => setMobileOpen(false)} />

                <p className="mt-[14px] mb-[6px] px-3 text-[10px] font-bold tracking-[0.14em] uppercase text-text-dimmed">Social</p>
                <NavItem icon={<Users size={17} />} label="Network" active={isNetworkActive} href="/dashboard/network" onClick={() => setMobileOpen(false)} />
                <NavItem icon={<Activity size={17} />} label="Feed" active={isFeedActive} href="/dashboard/feed" onClick={() => setMobileOpen(false)} />

                <p className="mt-[14px] mb-[6px] px-3 text-[10px] font-bold tracking-[0.14em] uppercase text-text-dimmed">Settings</p>
                <NavItem icon={<Settings size={17} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" onClick={() => setMobileOpen(false)} />
              </nav>

              <div className="mt-auto flex flex-col gap-[6px] pt-[18px]">
                <button
                  onClick={() => { toggle(); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-[14px] py-[11px] rounded-full border-none cursor-pointer bg-transparent text-text-secondary text-[14px] font-semibold font-[inherit] text-left transition-colors duration-150 hover:bg-[var(--surface-tint)]"
                >
                  <span className="flex shrink-0">{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>

                {user && (
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-[11px] w-full px-3 py-[10px] rounded-full mt-[6px] border border-border-default bg-bg-card cursor-pointer font-[inherit] text-left no-underline"
                  >
                    <div className="w-9 h-9 rounded-full shrink-0 bg-accent-primary text-accent-on-primary flex items-center justify-center text-[14px] font-extrabold">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-[13px] font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</p>
                      <p className="m-0 text-xs text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</p>
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

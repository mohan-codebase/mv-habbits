'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, LogOut, X, ChevronDown, CalendarDays, Smile, NotebookPen, Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import AppLogo from '@/components/ui/AppLogo';

const HABIT_SUB_NAV = [
  { label: 'Overview',       tab: 'habits',       href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Notes',          tab: 'notes',        href: '/dashboard/notes',        icon: NotebookPen },
  { label: 'Quotes',         tab: 'quotes',       href: '/dashboard/quotes',       icon: Sparkles },
  { label: 'Analytics',      tab: 'analytics',    href: '/dashboard/analytics',    icon: BarChart2 },
  { label: 'Achievements',   tab: 'achievements', href: '/dashboard/achievements', icon: Trophy },
  { label: 'Year in Review', tab: 'year-review',  href: '/dashboard/year-in-review', icon: CalendarDays },
];


interface TopbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Topbar({ activeTab = 'home', onTabChange }: TopbarProps) {
  const supabase = useMemo(() => createClient(), []);
  const router      = useRouter();
  const pathname    = usePathname();
  const [user, setUser]           = useState<User | null>(null);
  const [paletteOpen, setPalette] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const handleAddHabit = () => {
    window.dispatchEvent(new Event('productivity-master:open-add'));
    onTabChange?.('habits');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette((o) => !o); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
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

  const isHabitsActive = ['home', 'habits', 'analytics', 'achievements', 'year-review', 'settings'].includes(activeTab);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[300px] bg-[var(--bg-secondary)] border-r border-[var(--border-default)] z-[101] flex flex-col p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] shadow-2xl"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <AppLogo width={28} height={28} />
                  <span className="text-lg font-extrabold text-[var(--text-primary)] font-sans">
                    Productivity Master
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] flex items-center justify-center cursor-pointer text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile */}
              {user && (
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#8B5CF6] border border-white/20 flex items-center justify-center text-sm font-extrabold text-white">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] m-0 truncate">{displayName}</p>
                      <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 mb-5">
                <ThemeToggle />
                <NotificationBell />
                <button
                  onClick={handleAddHabit}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full border-0 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white cursor-pointer text-xs font-bold shadow-accent transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Add Habit
                </button>
              </div>

              {/* All nav pages */}
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
                <p className="my-1.5 px-3 text-[10px] font-bold tracking-widest uppercase text-slate-500">Habit Tracker</p>
                {HABIT_SUB_NAV.map(({ label, tab, href, icon: Icon }) => {
                  const active = activeTab === tab || (pathname === href && !activeTab);
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        if (onTabChange) {
                          onTabChange(tab);
                        } else if (href) {
                          router.push(href);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full cursor-pointer border-0 text-sm w-full text-left transition-all ${
                        active
                          ? 'bg-[#8B5CF6] text-white font-bold shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] font-semibold'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Logout at Bottom */}
              <div className="flex flex-col gap-2.5 mt-auto pt-4">
                <button
                  onClick={() => { setPalette(true); setSidebarOpen(false); }}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-full border border-purple-500/20 bg-white/5 text-slate-400 cursor-pointer text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Search size={18} />
                  Search (⌘K)
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 cursor-pointer text-sm font-semibold hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header
        className="flex items-center justify-between shrink-0 h-16 px-6 bg-[#0F111A]/90 dark:bg-[#0F111A]/90 bg-white/90 border-b border-purple-500/20 backdrop-blur-xl sticky top-0 z-40"
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <AppLogo width={32} height={32} />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Productivity Master
            </span>
            <span className="text-xs text-purple-500 dark:text-purple-400 font-semibold">
              by Mohan
            </span>
          </div>
        </div>

        {/* Center: All feature tabs (desktop only) */}
        <nav className="hidden lg:flex items-center gap-2 flex-1 mx-6">
          {HABIT_SUB_NAV.map(({ label, tab, href, icon: Icon }) => {
            const active = activeTab === tab || (pathname === href && !activeTab);
            return (
              <button
                key={tab}
                onClick={() => {
                  if (onTabChange) {
                    onTabChange(tab);
                  } else if (href) {
                    router.push(href);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full cursor-pointer text-xs transition-all ${
                  active
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent font-semibold'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Desktop actions (lg+ only) + Mobile hamburger menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop actions (ONLY visible on lg screens and larger!) */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={handleAddHabit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border-0 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white cursor-pointer text-xs font-bold shadow-accent transition-all active:scale-95"
            >
              <Plus size={18} />
              Add Habit
            </button>
            <button
              onClick={() => setPalette(true)}
              className="w-10 h-10 rounded-full border border-purple-500/20 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <Search size={18} />
            </button>
            {user && (
              <div
                title={displayName}
                className="w-10 h-10 rounded-full bg-[#8B5CF6] border border-white/20 flex items-center justify-center text-xs font-extrabold text-white cursor-pointer shadow-sm"
              >
                {initials}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-10 h-10 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile hamburger menu (ONLY visible on mobile!) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex lg:hidden w-12 h-11 rounded-full border-0 bg-transparent flex-col items-center justify-center cursor-pointer gap-1.5 p-0"
          >
            <div className="w-7 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
            <div className="w-7 h-0.5 bg-purple-500 rounded-full" />
          </button>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPalette(false)} />
    </>
  );
}

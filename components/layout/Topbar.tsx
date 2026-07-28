'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, LayoutDashboard, Dumbbell, BarChart2, Trophy, Settings2, LogOut, X, ChevronDown, CalendarDays, Smile } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import CommandPalette from '@/components/layout/CommandPalette';
import NotificationBell from '@/components/layout/NotificationBell';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const HABIT_SUB_NAV = [
  { label: 'Overview',       tab: 'habits',       icon: LayoutDashboard },
  { label: 'Analytics',      tab: 'analytics',    icon: BarChart2 },
  { label: 'Achievements',   tab: 'achievements', icon: Trophy },
  { label: 'Year in Review', tab: 'year-review',  icon: CalendarDays },
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
  const [habitExpanded, setHabitExpanded] = useState(true);
  const [habitDropdownOpen, setHabitDropdownOpen] = useState(false);

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
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0,0.6)',
                zIndex: 100,
              }}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: 300,
                background: 'var(--bg-primary)',
                borderRight: '1px solid var(--border-default)',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                padding: 20,
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Sidebar Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Smile size={26} color="var(--text-primary)" />
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Productivity Master
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile */}
              {user && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 9999,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{displayName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <ThemeToggle />
                <NotificationBell />
                <button
                  onClick={handleAddHabit}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 9999,
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: 'var(--accent-on-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Plus size={18} />
                  Add Habit
                </button>
              </div>

              {/* All nav pages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
                <button
                  onClick={() => setHabitExpanded(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', borderRadius: 14, cursor: 'pointer',
                    background: '#ffffff',
                    border: 'none',
                    color: '#1a1a1a',
                    fontWeight: 700, width: '100%', textAlign: 'left',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                    transition: 'opacity 0.15s',
                    marginBottom: 2,
                  }}
                >
                  <Dumbbell size={16} strokeWidth={2.2} color="#1a1a1a" />
                  <span style={{ fontSize: 14, flex: 1, letterSpacing: '-0.01em' }}>Habit Tracker</span>
                  <motion.span
                    animate={{ rotate: habitExpanded ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronDown size={16} color="#555" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {habitExpanded && (
                    <motion.div
                      key="habit-sub"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 0,
                        paddingLeft: 16,
                        borderLeft: '2px solid rgba(255,255,255,0.12)',
                        marginLeft: 10,
                        marginBottom: 8,
                      }}>
                        {HABIT_SUB_NAV.map(({ label, tab, icon: Icon }) => {
                          const active = activeTab === tab;
                          return (
                            <button
                              key={tab}
                              onClick={() => { onTabChange?.(tab); setSidebarOpen(false); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 10px', borderRadius: 9999, cursor: 'pointer',
                                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                                border: 'none',
                                color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                                fontWeight: active ? 600 : 400,
                                width: '100%', textAlign: 'left',
                                transition: 'all 0.15s',
                              }}
                            >
                              <Icon size={15} strokeWidth={active ? 2.2 : 1.6} />
                              <span style={{ fontSize: 13.5 }}>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search & Logout at Bottom */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => { setPalette(true); setSidebarOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 9999,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <Search size={18} />
                  Search (⌘K)
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 9999,
                    border: '1px solid rgba(104, 104, 104,0.3)',
                    background: 'var(--danger-glow)',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
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
        className="flex items-center justify-between shrink-0"
        style={{
          height: 64,
          padding: '0 24px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid color-mix(in srgb, var(--border-default) 70%, transparent)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Smile size={28} color="var(--text-primary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.4px',
              }}
            >
              Productivity Master
            </span>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 500,
                marginTop: 1,
              }}
            >
              by Mohan
            </span>
          </div>
        </div>

        {/* Center: All feature tabs (desktop only) */}
        <nav
          className="hidden lg:flex"
          style={{
            alignItems: 'center', gap: 12, flex: 1,
            margin: '0 24px',
          }}
        >
          {/* Habit Tracker Dropdown */}
          <div
            onMouseEnter={() => setHabitDropdownOpen(true)}
            onMouseLeave={() => setHabitDropdownOpen(false)}
            style={{ position: 'relative' }}
          >
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9999, cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isHabitsActive ? 'rgba(85, 85, 85, 0.08)' : 'transparent',
                border: `1px solid ${isHabitsActive ? 'rgba(85, 85, 85, 0.25)' : 'transparent'}`,
                color: isHabitsActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Dumbbell size={15} />
              <span>Habit Tracker</span>
              <ChevronDown size={14} style={{ transform: habitDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
              {habitDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 6,
                    width: 200,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 14,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                    padding: 8,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  {HABIT_SUB_NAV.map(({ label, tab, icon: Icon }) => {
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          onTabChange?.(tab);
                          setHabitDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 9999, cursor: 'pointer',
                          background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          border: 'none',
                          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: 13,
                          fontWeight: active ? 600 : 400,
                          width: '100%', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right: Desktop actions (lg+ only) + Mobile hamburger menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Desktop actions (ONLY visible on lg screens and larger!) */}
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }} className="lg:flex">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={handleAddHabit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--accent-primary)',
                color: 'var(--accent-on-primary)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={18} />
              Add Habit
            </button>
            <button
              onClick={() => setPalette(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Search size={18} />
            </button>
            {user && (
              <div
                title={displayName}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                border: '1px solid rgba(104, 104, 104,0.3)',
                background: 'var(--danger-glow)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile hamburger menu (ONLY visible on mobile!) */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 48,
              height: 44,
              borderRadius: 9999,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 6,
              padding: 0,
            }}
            className="flex lg:hidden"
          >
            <div style={{
              width: 32,
              height: 3,
              background: 'var(--text-primary)',
              borderRadius: 2,
            }} />
            <div style={{
              width: 32,
              height: 3,
              background: 'var(--accent-primary)',
              borderRadius: 2,
            }} />
          </button>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPalette(false)} />
    </>
  );
}

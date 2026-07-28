'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
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
  Smile,
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
  label, active = false, href, onClick,
}: {
  icon?: React.ReactNode; label: string; active?: boolean; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
        fontSize: 14, fontWeight: active ? 700 : 600, fontFamily: 'inherit', textAlign: 'left',
        textDecoration: 'none',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-tint)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {label}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
          background: 'var(--accent-primary)',
          color: 'var(--accent-on-primary)',
          fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', textAlign: 'left',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <span style={{ flex: 1 }}>{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'flex', alignItems: 'center' }}
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
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              paddingLeft: 14,
              borderLeft: '2px solid rgba(255,255,255,0.12)',
              marginLeft: 10,
              marginTop: 2,
              marginBottom: 4,
            }}>
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
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
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
  const [habitNavOpen, setHabitNavOpen] = useState(pathname.startsWith('/dashboard') || pathname === '/dashboard');
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
          className="hf-desktop-sidebar-toggle"
          style={{
            position: 'fixed', top: 20, left: 20, zIndex: 60,
            width: 42, height: 42, borderRadius: 9999,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
            cursor: 'pointer', color: 'var(--text-primary)',
            alignItems: 'center', justifyContent: 'center',
            display: 'none',
          }}
          title="Show Sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <aside
        className="hf-desktop-sidebar no-print"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          bottom: 16,
          height: 'calc(100vh - 32px)',
          width: 240,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--border-default)',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.20), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          padding: '20px 14px 16px',
          overflowY: 'auto',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
      >
        <div style={{ padding: '2px 8px 22px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
            <AppLogo width={32} height={32} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>Productivity Master</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>by Mohan</p>
            </div>
          </Link>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '9px 12px', borderRadius: 9999, marginBottom: 14,
            border: '1px solid var(--border-default)', background: 'var(--bg-card)',
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          }}
        >
          <Search size={16} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmed)' }}>⌘K</span>
        </button>

        <p style={{ margin: '0 0 8px', padding: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Menu</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <NavGroup
            icon={<CheckCircle2 size={16} strokeWidth={2.2} color="#1a1a1a" />}
            label="Habit Tracker"
            expanded={habitNavOpen}
            onToggle={() => setHabitNavOpen(o => !o)}
          >
            <SubNavItem icon={<LayoutDashboard size={15} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={(e) => { if (isOverviewActive) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} />
            <SubNavItem icon={<BarChart3 size={15} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" />
            <SubNavItem icon={<Trophy size={15} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" />
            <SubNavItem icon={<CalendarCheck size={15} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" />
          </NavGroup>

          <NavGroup
            icon={<Users size={16} strokeWidth={2.2} color="#1a1a1a" />}
            label="Social"
            expanded={true}
            onToggle={() => {}}
          >
            <SubNavItem icon={<Users size={15} />} label="Network" active={isNetworkActive} href="/dashboard/network" />
            <SubNavItem icon={<Activity size={15} />} label="Feed" active={isFeedActive} href="/dashboard/feed" />
          </NavGroup>

          <NavItem icon={<Settings size={18} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" />
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '11px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-tint)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}><Menu size={18} /></span>
            Hide sidebar
          </button>
          <button
            onClick={toggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '11px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-tint)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          {user && (
            <Link
              href="/dashboard/settings"
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                padding: '10px 12px', borderRadius: 9999, marginTop: 6,
                border: '1px solid var(--border-default)', background: 'var(--bg-card)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
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
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99,
                background: 'rgba(0, 0, 0, 0.5)',
              }}
              className="hf-mobile-nav"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: 240,
                zIndex: 100,
                background: 'var(--bg-tertiary)',
                borderRight: '1px solid var(--border-default)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
              }}
              className="hf-mobile-nav"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <AppLogo width={34} height={34} />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>Productivity Master</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>by Mohan</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-primary)',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <button
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', borderRadius: 9999, marginBottom: 14,
                  border: '1px solid var(--border-default)', background: 'var(--bg-card)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                }}
              >
                <Search size={16} />
                <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dimmed)' }}>⌘K</span>
              </button>

              <p style={{ margin: '0 0 8px', padding: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Menu</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <NavGroup
                  icon={<CheckCircle2 size={16} strokeWidth={2.2} color="#1a1a1a" />}
                  label="Habit Tracker"
                  expanded={habitNavOpen}
                  onToggle={() => setHabitNavOpen(o => !o)}
                >
                  <SubNavItem icon={<LayoutDashboard size={15} />} label="Overview" active={isOverviewActive} href="/dashboard" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<BarChart3 size={15} />} label="Analytics" active={isAnalyticsActive} href="/dashboard/analytics" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<Trophy size={15} />} label="Achievements" active={isAchievementsActive} href="/dashboard/achievements" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<CalendarCheck size={15} />} label="Year in Review" active={isYearActive} href="/dashboard/year-in-review" onClick={() => setMobileOpen(false)} />
                </NavGroup>

                <NavGroup
                  icon={<Users size={16} strokeWidth={2.2} color="#1a1a1a" />}
                  label="Social"
                  expanded={true}
                  onToggle={() => {}}
                >
                  <SubNavItem icon={<Users size={15} />} label="Network" active={isNetworkActive} href="/dashboard/network" onClick={() => setMobileOpen(false)} />
                  <SubNavItem icon={<Activity size={15} />} label="Feed" active={isFeedActive} href="/dashboard/feed" onClick={() => setMobileOpen(false)} />
                </NavGroup>

                <NavItem icon={<Settings size={18} />} label="Settings" active={isSettingsActive} href="/dashboard/settings" onClick={() => setMobileOpen(false)} />
              </nav>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
                <button
                  onClick={() => { toggle(); setMobileOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '11px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-secondary)',
                    fontSize: 14, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-tint)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ display: 'flex', flexShrink: 0 }}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</span>
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>

                {user && (
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                      padding: '10px 12px', borderRadius: 9999, marginTop: 6,
                      border: '1px solid var(--border-default)', background: 'var(--bg-card)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800,
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
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

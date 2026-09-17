'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PushNotificationToggle from '@/components/settings/PushNotificationToggle';
import SecuritySettings from '@/components/settings/SecuritySettings';
import DevicesModal from '@/components/settings/DevicesModal';
import DataManagement from '@/components/settings/DataManagement';
import PwaSettingsCard from '@/components/settings/PwaSettingsCard';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme, useAccentColor } from '@/components/ui/ThemeProvider';
import { Shield, Sun, Moon, HelpCircle, LogOut, Bell, Database, Smartphone, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const { theme, toggle } = useTheme();
  const accentHex = useAccentColor();
  const isDark = theme === 'dark';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

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

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="hf-page max-w-[800px] mx-auto flex flex-col gap-8 p-4 sm:p-6 pb-32">
      {/* Header */}
      <div>
        <h1 className="m-0 text-[clamp(24px,4vw,32px)] font-extrabold leading-tight tracking-tight text-text-primary [font-family:'Outfit',sans-serif]">
          Settings
        </h1>
        <p className="mt-1 mb-0 text-sm text-text-muted">
          Manage your account profile, security preferences, system theme, and data.
        </p>
      </div>

      {/* User Profile Banner Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_12%,var(--bg-card))_0%,var(--bg-card)_100%)] p-5 sm:p-6 shadow-lg shadow-black/20"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle with Theme Accent Glow */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-black text-white shadow-lg relative"
              style={{
                background: `linear-gradient(135deg, ${accentHex} 0%, color-mix(in srgb, ${accentHex} 70%, #000) 100%)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${accentHex} 40%, transparent)`,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="m-0 truncate text-lg font-extrabold tracking-tight text-text-primary">
                  {displayName}
                </p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider"
                  style={{
                    background: `color-mix(in srgb, ${accentHex} 16%, transparent)`,
                    color: accentHex,
                    border: `1px solid color-mix(in srgb, ${accentHex} 30%, transparent)`,
                  }}
                >
                  Active Account
                </span>
              </div>
              <p className="mt-1 mb-0 truncate text-xs font-medium text-text-muted">
                {user.email}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section: App & Installation */}
      <div className="flex flex-col gap-3">
        <h2 className="m-0 px-1 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Download size={14} style={{ color: accentHex }} />
          <span>App & Installation</span>
        </h2>
        <PwaSettingsCard />
      </div>

      {/* Section 1: Security & Authentication */}
      <div className="flex flex-col gap-3">
        <h2 className="m-0 px-1 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Shield size={14} style={{ color: accentHex }} />
          <span>Security & Authentication</span>
        </h2>
        <div className="rounded-2xl border border-border-subtle bg-bg-card/90 backdrop-blur-md overflow-hidden divide-y divide-border-subtle/50 shadow-md">
          {/* SecuritySettings handles Password, Passcode, Biometrics */}
          <SecuritySettings />

          {/* Active Devices & Sessions Row */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-bg-tertiary/40">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${accentHex} 12%, transparent)`,
                  color: accentHex,
                }}
              >
                <Smartphone size={18} />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-text-primary">Devices & Active Sessions</p>
                <p className="m-0 text-xs text-text-muted">View and manage sessions logged into your account.</p>
              </div>
            </div>
            <button
              onClick={() => setDevicesOpen(true)}
              className="cursor-pointer rounded-full border border-border-default bg-bg-tertiary px-4 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-accent-primary hover:text-accent-primary self-start sm:self-auto shrink-0"
            >
              Manage sessions
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Preferences & Theme */}
      <div className="flex flex-col gap-3">
        <h2 className="m-0 px-1 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Bell size={14} style={{ color: accentHex }} />
          <span>Preferences & Appearance</span>
        </h2>
        <div className="rounded-2xl border border-border-subtle bg-bg-card/90 backdrop-blur-md overflow-hidden divide-y divide-border-subtle/50 shadow-md">
          {/* Push Notifications Row */}
          <PushNotificationToggle />

          {/* Theme Switcher Row */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:bg-bg-tertiary/40">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${accentHex} 12%, transparent)`,
                  color: accentHex,
                }}
              >
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-text-primary">Interface Theme</p>
                <p className="m-0 text-xs text-text-muted">Currently using {isDark ? 'Dark Mode' : 'Light Mode'}.</p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="cursor-pointer rounded-full border border-border-default bg-bg-tertiary px-4 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-accent-primary hover:text-accent-primary shrink-0"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Data Management */}
      <div className="flex flex-col gap-3">
        <h2 className="m-0 px-1 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Database size={14} style={{ color: accentHex }} />
          <span>Data & Backups</span>
        </h2>
        <div className="rounded-2xl border border-border-subtle bg-bg-card/90 backdrop-blur-md overflow-hidden shadow-md">
          <DataManagement user={user} />
        </div>
      </div>

      {/* Section 4: Support & Session */}
      <div className="flex flex-col gap-3">
        <h2 className="m-0 px-1 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <HelpCircle size={14} style={{ color: accentHex }} />
          <span>Account & Support</span>
        </h2>
        <div className="rounded-2xl border border-border-subtle bg-bg-card/90 backdrop-blur-md overflow-hidden divide-y divide-border-subtle/50 shadow-md">
          {/* Help & Support */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:bg-bg-tertiary/40">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary text-text-secondary">
                <HelpCircle size={18} />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-text-primary">Help & Feedback</p>
                <p className="m-0 text-xs text-text-muted">Questions or suggestions? Contact our team.</p>
              </div>
            </div>
            <a
              href="mailto:support@semmaflow.com?subject=MV Habits Help"
              className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-tertiary px-4 py-1.5 text-xs font-semibold text-text-primary no-underline transition-all hover:border-accent-primary hover:text-accent-primary shrink-0"
            >
              Contact Support
            </a>
          </div>

          {/* Sign Out */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:bg-danger/5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <LogOut size={18} />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-text-primary">Sign Out</p>
                <p className="m-0 text-xs text-text-muted">Sign out of your account on this device.</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="cursor-pointer rounded-full border border-danger/30 bg-danger/10 px-4 py-1.5 text-xs font-bold text-danger transition-all hover:bg-danger hover:text-white shrink-0 disabled:cursor-wait"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}

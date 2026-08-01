'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PushNotificationToggle from '@/components/settings/PushNotificationToggle';
import SecuritySettings from '@/components/settings/SecuritySettings';
import DevicesModal from '@/components/settings/DevicesModal';
import DataManagement from '@/components/settings/DataManagement';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Shield, Sun, Moon, HelpCircle, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const { theme, toggle } = useTheme();
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
    <div className="hf-page flex flex-col gap-6 p-[24px_20px]">
      <div className="mb-2 min-w-0">
        <h1 className="m-0 text-[clamp(22px,3vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-text-primary [font-family:'Outfit',sans-serif]">
          Settings
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-text-muted">
          Manage your user profile, configurations, security preferences, and theme.
        </p>
      </div>

      <div className="flex max-w-[560px] flex-col gap-4">
        {/* User Profile Card */}
        {user && (
          <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-[linear-gradient(155deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-[18px_20px]">
            <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-primary)_0%,#727272_100%)] text-[18px] font-extrabold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[16px] font-extrabold tracking-[-0.02em] text-text-primary">
                {displayName}
              </p>
              <p className="mt-0.5 mb-0 truncate text-[12.5px] text-text-muted">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Push Notifications Card */}
        <PushNotificationToggle />

        {/* Passcode and Biometric Security Settings */}
        <SecuritySettings />

        {/* Data Management Card */}
        <DataManagement user={user} />

        {/* Security / Devices Card */}
        <div className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card p-[16px_18px]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-tertiary text-text-primary">
            <Shield size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
              Devices & Sessions
            </p>
            <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
              View and revoke active sessions on other browsers or devices.
            </p>
            <button
              onClick={() => setDevicesOpen(true)}
              className="cursor-pointer rounded-lg border-none bg-accent-primary p-[7px_14px] text-[13px] font-semibold text-accent-on-primary [font-family:inherit]"
            >
              Manage sessions
            </button>
          </div>
        </div>

        {/* Theme Settings Card */}
        <div className="flex flex-col gap-[18px] rounded-xl border border-border-subtle bg-bg-card p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-tertiary text-text-primary">
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
                Theme Settings
              </p>
              <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
                Customize system theme and primary accent colors.
              </p>
              <button
                onClick={toggle}
                className="cursor-pointer rounded-lg border border-border-default bg-bg-tertiary p-[7px_14px] text-[13px] font-semibold text-text-secondary transition-all duration-200 ease-in-out [font-family:inherit]"
              >
                Switch to {isDark ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>
        </div>

        {/* Help & Support Card */}
        <div className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card p-[16px_18px]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-tertiary text-text-primary">
            <HelpCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
              Help & Support
            </p>
            <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
              Need help or have suggestions? Reach out to our support team.
            </p>
            <a
              href="mailto:support@semmaflow.com?subject=Productivity Master Help"
              className="inline-block rounded-lg border border-border-default bg-bg-tertiary p-[7px_14px] text-[13px] font-semibold text-text-secondary no-underline [font-family:inherit]"
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="flex items-start gap-3.5 rounded-xl border border-[rgba(255,0,0,0.1)] bg-bg-card p-[16px_18px]">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-[rgba(255,0,0,0.15)] bg-[rgba(255,0,0,0.05)] text-danger">
            <LogOut size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
              Account Session
            </p>
            <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
              Sign out from this session. Active passcode and biometric configurations remain safe.
            </p>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{ cursor: signingOut ? 'wait' : 'pointer' }}
              className="rounded-lg border-none bg-danger p-[7px_14px] text-[13px] font-semibold text-accent-on-primary [font-family:inherit]"
            >
              {signingOut ? 'Signing out...' : 'Sign out of account'}
            </button>
          </div>
        </div>

      </div>

      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}

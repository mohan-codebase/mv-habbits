'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Compass, User, LogOut, Sun, Moon, Lock, Unlock, Eye, EyeOff, Shield, Globe } from 'lucide-react';
import DevicesModal from '@/components/settings/DevicesModal';
import { useRouter } from 'next/navigation';
import FitnessSummary from '@/components/dashboard/FitnessSummary';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';
import type { HabitWithEntry } from '@/types/habit';

interface DashboardAppProps {
  stats: OverviewStatsType | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName: string;
  initials: string;
  email: string;
  greeting: string;
  heroLine: string;
  heroPct: number;
  dayName: string;
  dateStr: string;
}

function FaceIdGlyph({ size = 68 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden
      className="block"
    >
      <path d="M20 8h-4a8 8 0 0 0-8 8v4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M52 8h4a8 8 0 0 1 8 8v4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 64h-4a8 8 0 0 1-8-8v-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M52 64h4a8 8 0 0 0 8-8v-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M26 28v-3" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 28v-3" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M36 25v16h-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 47c5.7 5 16.3 5 22 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardApp({
  stats,
  habits,
  weekData,
  displayName,
  initials,
  email,
  greeting,
  heroLine,
  heroPct,
  dayName,
  dateStr,
}: DashboardAppProps) {
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<'habits' | null>('habits');
  const [menuOpen, setMenuOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Passcode Lock States
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [lockScreenMode, setLockScreenMode] = useState<'create' | 'unlock'>('unlock');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  // True while the server passcode lookup is in flight (used to gate the
  // habits button so we never show "create" before the server answers).
  const [passcodeChecking, setPasscodeChecking] = useState(false);
  // Lock status from the server (never the code itself).
  const [hasPasscode, setHasPasscode] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  // Whether this device exposes a platform authenticator (Face ID / Touch ID).
  const [biometricSupported, setBiometricSupported] = useState(false);
  // True while a WebAuthn ceremony (enroll / unlock) is running.
  const [biometricBusy, setBiometricBusy] = useState(false);
  const habitsUnlockedRef = useRef(false);

  // Ask the server for lock status — { hasPasscode, hasBiometric } — and mirror
  // it into state. The code itself never leaves the server; verification is
  // done via POST /api/passcode/verify. `ok` is false when the server is
  // unreachable so callers can avoid bypassing the lock while offline.
  type LockStatus = { ok: boolean; hasPasscode: boolean; hasBiometric: boolean };
  const fetchLockStatus = async (): Promise<LockStatus> => {
    try {
      const res = await fetch('/api/passcode');
      const json = await res.json();
      if (res.ok && json?.data) {
        const next = {
          hasPasscode: Boolean(json.data.hasPasscode),
          hasBiometric: Boolean(json.data.hasBiometric),
        };
        setHasPasscode(next.hasPasscode);
        setHasBiometric(next.hasBiometric);
        return { ok: true, ...next };
      }
    } catch {
      // unreachable — treat as unknown
    }
    return { ok: false, hasPasscode: false, hasBiometric: false };
  };

  const formattedName = displayName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
    .join(' ');

  useEffect(() => {
    setIsMounted(true);
    const theme = localStorage.getItem('productivity_master_theme') || 'dark';
    setIsDark(theme === 'dark');

    // One-time cleanup: older builds cached the raw passcode here.
    localStorage.removeItem('semma_flow_habits_passcode');
    localStorage.removeItem('productivity_master_active_app');

    // Does this device have a platform authenticator (Face ID / Touch ID)?
    if (typeof window !== 'undefined' && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }

    // Fetch lock status quietly to populate states without showing the lock screen on mount.
    habitsUnlockedRef.current = true;
    fetchLockStatus();
  }, []);


  const handleSelectApp = async (app: 'habits' | 'trip') => {
    if (app === 'habits') {
      // Always check the server so a fresh login/device asks to UNLOCK with
      // the existing passcode rather than creating a new one.
      setPasscodeChecking(true);
      const status = await fetchLockStatus();
      setPasscodeChecking(false);
      if (!status.ok) {
        alert('Could not reach the server. Check your connection and try again.');
        return;
      }
      setPasscode('');
      setPasscodeError(null);
      if (status.hasPasscode) {
        setLockScreenMode('unlock');
        setShowLockScreen(true);
      } else {
        setLockScreenMode('create');
        setShowLockScreen(true);
      }
    } else {
      router.push('/trip');
    }
  };

  const handleVerifyPasscode = async () => {
    if (lockScreenMode === 'create') {
      if (!passcode.trim()) {
        setPasscodeError('Passcode cannot be empty.');
        return;
      }
      if (passcode !== confirmPasscode) {
        setPasscodeError('Passcodes do not match.');
        return;
      }
      // Persist to the server (stored as a salted hash) so the lock works
      // across devices.
      try {
        const res = await fetch('/api/passcode', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        if (!res.ok) {
          setPasscodeError('Could not save passcode. Please try again.');
          return;
        }
      } catch {
        setPasscodeError('Could not save passcode. Check your connection.');
        return;
      }
      setHasPasscode(true);
      habitsUnlockedRef.current = true;
      localStorage.setItem('productivity_master_active_app', 'habits');
      setActiveApp('habits');
      setShowLockScreen(false);
      setPasscode('');
      setConfirmPasscode('');
      setPasscodeError(null);
      window.dispatchEvent(new Event('productivity-master:active-app-changed'));
    } else {
      // Verify against the server-side hash — the code is never stored locally.
      try {
        const res = await fetch('/api/passcode/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        const json = await res.json();
        if (res.ok && json?.data?.verified) {
          habitsUnlockedRef.current = true;
          localStorage.setItem('productivity_master_active_app', 'habits');
          setActiveApp('habits');
          setShowLockScreen(false);
          setPasscode('');
          setPasscodeError(null);
          window.dispatchEvent(new Event('productivity-master:active-app-changed'));
        } else if (res.ok) {
          setPasscodeError('Incorrect passcode. Please try again.');
        } else {
          setPasscodeError('Could not verify passcode. Please try again.');
        }
      } catch {
        setPasscodeError('Could not verify passcode. Check your connection.');
      }
    }
  };

  const handleBackToHub = () => {
    habitsUnlockedRef.current = false;
    localStorage.removeItem('productivity_master_active_app');
    setActiveApp(null);
    setShowLockScreen(false);
    window.dispatchEvent(new Event('productivity-master:active-app-changed'));
  };

  const handleResetPasscode = async () => {
    if (!hasPasscode) {
      alert('No passcode is currently set.');
      return;
    }

    const input = prompt('Enter your current passcode to confirm reset:');
    if (input === null) return; // cancelled

    try {
      // Confirm the current passcode server-side before removing anything.
      const verifyRes = await fetch('/api/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: input }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson?.data?.verified) {
        alert('Incorrect passcode. Reset failed.');
        return;
      }

      // Removes the passcode and any biometric credentials server-side.
      const res = await fetch('/api/passcode', { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not remove the lock. Please try again.');
        return;
      }
    } catch {
      alert('Could not remove the lock. Check your connection.');
      return;
    }

    habitsUnlockedRef.current = false;
    localStorage.removeItem('productivity_master_active_app');
    setHasPasscode(false);
    setHasBiometric(false);
    setActiveApp(null);
    setShowLockScreen(false);
    setMenuOpen(false);
    window.dispatchEvent(new Event('productivity-master:active-app-changed'));
    alert('Habit lock has been successfully removed.');
  };

  // Enroll this device's Face ID / Touch ID as a habit-lock unlock method.
  const handleEnrollBiometric = async () => {
    setBiometricBusy(true);
    try {
      const optRes = await fetch('/api/passcode/webauthn/register');
      const optJson = await optRes.json();
      if (!optRes.ok || !optJson?.data) {
        alert(optJson?.error || 'Could not start biometric setup.');
        return;
      }
      const { startRegistration } = await import('@simplewebauthn/browser');
      const response = await startRegistration({ optionsJSON: optJson.data });
      const verRes = await fetch('/api/passcode/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const verJson = await verRes.json();
      if (verRes.ok && verJson?.data?.verified) {
        setHasBiometric(true);
        setMenuOpen(false);
        alert('Face ID / Touch ID unlock is now enabled.');
      } else {
        alert(verJson?.error || 'Could not enable biometric unlock.');
      }
    } catch (e) {
      // NotAllowedError = user dismissed the OS prompt; stay quiet.
      if ((e as Error)?.name !== 'NotAllowedError') {
        alert('Biometric setup was cancelled or is unavailable on this device.');
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  // Unlock the habits app with Face ID / Touch ID.
  const handleBiometricUnlock = async () => {
    setBiometricBusy(true);
    setPasscodeError(null);
    try {
      const optRes = await fetch('/api/passcode/webauthn/authenticate');
      const optJson = await optRes.json();
      if (!optRes.ok || !optJson?.data) {
        setPasscodeError('Biometric unavailable. Enter your passcode.');
        return;
      }
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const response = await startAuthentication({ optionsJSON: optJson.data });
      const verRes = await fetch('/api/passcode/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const verJson = await verRes.json();
      if (verRes.ok && verJson?.data?.verified) {
        habitsUnlockedRef.current = true;
        localStorage.setItem('productivity_master_active_app', 'habits');
        setActiveApp('habits');
        setShowLockScreen(false);
        setPasscode('');
        setPasscodeError(null);
        window.dispatchEvent(new Event('productivity-master:active-app-changed'));
      } else {
        setPasscodeError('Face ID failed. Try your passcode.');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'NotAllowedError') {
        setPasscodeError('Face ID failed. Try your passcode.');
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  // Remove this account's biometric credentials (passcode stays).
  const handleDisableBiometric = async () => {
    if (!confirm('Disable Face ID / Touch ID unlock? Your passcode will still work.')) return;
    setBiometricBusy(true);
    try {
      const res = await fetch('/api/passcode/webauthn/register', { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not disable biometric unlock. Please try again.');
        return;
      }
      setHasBiometric(false);
      setMenuOpen(false);
      alert('Biometric unlock disabled.');
    } catch {
      alert('Could not disable biometric unlock. Check your connection.');
    } finally {
      setBiometricBusy(false);
    }
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('productivity_master_theme', next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  if (!isMounted) return null;

  if (activeApp === 'habits') {
    return (
      <FitnessSummary
        stats={stats}
        habits={habits}
        weekData={weekData}
        displayName={formattedName}
        initials={initials}
        email={email}
        onBackToHub={handleBackToHub}
      />
    );
  }

  if (showLockScreen) {
    const canUseFaceId = lockScreenMode === 'unlock' && hasBiometric && biometricSupported;

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-primary p-6 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="box-border w-full max-w-[390px] rounded-[28px] border border-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] bg-bg-secondary p-[34px_26px_24px] text-center shadow-[0_22px_70px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <div
            className="mb-[22px] inline-flex items-center justify-center text-text-primary"
            style={{
              width: canUseFaceId ? 104 : 70,
              height: canUseFaceId ? 104 : 70,
              borderRadius: canUseFaceId ? 30 : '50%',
              background: canUseFaceId
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--text-primary) 12%, transparent), color-mix(in srgb, var(--text-primary) 4%, transparent))'
                : 'color-mix(in srgb, var(--text-primary) 9%, transparent)',
              border: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
              boxShadow: canUseFaceId ? '0 14px 34px rgba(0, 0, 0, 0.18)' : 'none',
            }}
          >
            {canUseFaceId ? <FaceIdGlyph size={70} /> : lockScreenMode === 'create' ? <Lock size={28} /> : <Unlock size={28} />}
          </div>

          <h2 className="m-0 text-2xl font-[760] tracking-normal text-text-primary">
            {lockScreenMode === 'create' ? 'Set Habit Passcode' : canUseFaceId ? 'Face ID' : 'Habits Locked'}
          </h2>
          <p className="m-0 mb-6 mt-2 text-sm leading-[1.45] text-text-secondary">
            {lockScreenMode === 'create'
              ? 'Create a passcode to protect your habit tracking entries.'
              : canUseFaceId
                ? 'Use Face ID to unlock Habit Tracker.'
                : 'Enter your passcode to unlock Habit Tracker.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPasscode();
            }}
            className="flex flex-col gap-4"
          >
            {canUseFaceId && (
              <>
                <button
                  type="button"
                  disabled={biometricBusy}
                  onClick={handleBiometricUnlock}
                  className="flex w-full items-center justify-center gap-[9px] rounded-2xl border-none bg-text-primary py-3.5 text-[15px] font-[760] text-bg-primary shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-[transform,filter,opacity] duration-150 ease-[ease] disabled:cursor-wait"
                  style={{ cursor: biometricBusy ? 'wait' : 'pointer', opacity: biometricBusy ? 0.72 : 1 }}
                >
                  <FaceIdGlyph size={22} />
                  {biometricBusy ? 'Looking for Face ID...' : 'Use Face ID'}
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="h-px flex-1 bg-border-subtle" />
                  <span className="text-xs font-semibold text-text-muted">Passcode</span>
                  <span className="h-px flex-1 bg-border-subtle" />
                </div>
              </>
            )}
            <div className="relative w-full">
              <input
                autoFocus
                type={showPasscodeText ? 'text' : 'password'}
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError(null);
                }}
                className="box-border w-full rounded-2xl border border-[color-mix(in_srgb,var(--text-primary)_11%,transparent)] bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] p-[13px_42px_13px_14px] text-center text-base font-semibold font-[inherit] text-text-primary outline-none transition-all duration-150 ease-[ease] focus:border-[color-mix(in_srgb,var(--text-primary)_26%,transparent)]"
              />
              <button
                type="button"
                onClick={() => setShowPasscodeText(!showPasscodeText)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center border-none bg-none p-1 text-text-muted cursor-pointer"
              >
                {showPasscodeText ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {lockScreenMode === 'create' && (
              <input
                type={showPasscodeText ? 'text' : 'password'}
                placeholder="Confirm passcode"
                value={confirmPasscode}
                onChange={(e) => {
                  setConfirmPasscode(e.target.value);
                  setPasscodeError(null);
                }}
                className="box-border w-full rounded-2xl border border-[color-mix(in_srgb,var(--text-primary)_11%,transparent)] bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] p-[13px_14px] text-center text-base font-semibold font-[inherit] text-text-primary outline-none transition-all duration-150 ease-[ease] focus:border-[color-mix(in_srgb,var(--text-primary)_26%,transparent)]"
              />
            )}

            {passcodeError && (
              <p className="m-0 text-[13px] font-semibold text-[#6a6a6a]">
                {passcodeError}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                className="w-full cursor-pointer rounded-2xl border-none py-[13px] text-[15px] font-[760] transition-all duration-150 ease-[ease]"
                style={{
                  background: canUseFaceId
                    ? 'color-mix(in srgb, var(--text-primary) 8%, transparent)'
                    : 'var(--text-primary)',
                  color: canUseFaceId ? 'var(--text-primary)' : 'var(--bg-primary)',
                }}
              >
                {lockScreenMode === 'create' ? 'Save and Unlock' : canUseFaceId ? 'Unlock with Passcode' : 'Unlock'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLockScreen(false);
                  setPasscode('');
                  setConfirmPasscode('');
                  setPasscodeError(null);
                }}
                className="w-full cursor-pointer rounded-2xl border border-[color-mix(in_srgb,var(--text-primary)_9%,transparent)] bg-transparent py-3 text-sm font-semibold text-text-secondary transition-all duration-150 ease-[ease]"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }


  return (
    <>
      <FitnessSummary
        stats={stats}
        habits={habits}
        weekData={weekData}
        displayName={formattedName}
        initials={initials}
        email={email}
      />
      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Unlock, Eye, EyeOff } from 'lucide-react';
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

// Unlocking lasts for the life of the browser tab. sessionStorage (not
// localStorage) is deliberate: closing the tab re-locks, which is the whole
// point of a privacy lock.
const UNLOCK_KEY = 'productivity_master_habits_unlocked';

// 'checking' also covers the first paint — habits must never render before we
// know whether this account is locked, or the lock is decorative.
type LockState = 'checking' | 'locked' | 'unlocked';

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
}: DashboardAppProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [lockState, setLockState] = useState<LockState>('checking');

  // Passcode lock state. Setup (create / reset / biometric enrollment) is owned
  // by components/settings/SecuritySettings.tsx — this component only enforces.
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  // Whether this device exposes a platform authenticator (Face ID / Touch ID).
  const [biometricSupported, setBiometricSupported] = useState(false);
  // True while a WebAuthn ceremony is running.
  const [biometricBusy, setBiometricBusy] = useState(false);
  // Set when the lock-status lookup itself failed (offline / server down).
  const [statusUnavailable, setStatusUnavailable] = useState(false);

  // Ask the server for lock status — { hasPasscode, hasBiometric }. The code
  // itself never leaves the server; verification is done via
  // POST /api/passcode/verify. `ok` is false when the server is unreachable so
  // callers can avoid bypassing the lock while offline.
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

  const resolveLockState = async () => {
    setStatusUnavailable(false);
    const status = await fetchLockStatus();
    if (!status.ok) {
      // Fail closed. We cannot verify a passcode without the server, so
      // treating "unknown" as "unlocked" would let anyone past the lock by
      // pulling the network cable.
      setStatusUnavailable(true);
      setLockState('locked');
      return;
    }
    setLockState(status.hasPasscode ? 'locked' : 'unlocked');
  };

  useEffect(() => {
    setIsMounted(true);

    // One-time cleanup: older builds cached the raw passcode here.
    localStorage.removeItem('semma_flow_habits_passcode');
    localStorage.removeItem('productivity_master_active_app');

    // Does this device have a platform authenticator (Face ID / Touch ID)?
    if (typeof window !== 'undefined' && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }

    if (sessionStorage.getItem(UNLOCK_KEY) === '1') {
      setLockState('unlocked');
      return;
    }

    resolveLockState();
  }, []);

  const unlock = () => {
    sessionStorage.setItem(UNLOCK_KEY, '1');
    setPasscode('');
    setPasscodeError(null);
    setLockState('unlocked');
  };

  const handleVerifyPasscode = async () => {
    if (!passcode.trim()) {
      setPasscodeError('Enter your passcode.');
      return;
    }
    // Verify against the server-side hash — the code is never stored locally.
    try {
      const res = await fetch('/api/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json();
      if (res.ok && json?.data?.verified) {
        unlock();
      } else if (res.ok) {
        setPasscodeError('Incorrect passcode. Please try again.');
      } else {
        setPasscodeError('Could not verify passcode. Please try again.');
      }
    } catch {
      setPasscodeError('Could not verify passcode. Check your connection.');
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
        unlock();
      } else {
        setPasscodeError('Face ID failed. Try your passcode.');
      }
    } catch (e) {
      // NotAllowedError = user dismissed the OS prompt; stay quiet.
      if ((e as Error)?.name !== 'NotAllowedError') {
        setPasscodeError('Face ID failed. Try your passcode.');
      }
    } finally {
      setBiometricBusy(false);
    }
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

  // Render a bare background rather than null so there is no flash of habit
  // data before the lock decision is made.
  if (!isMounted || lockState === 'checking') {
    return <div className="min-h-[100dvh] bg-bg-primary" />;
  }

  if (lockState === 'locked') {
    const canUseFaceId = hasBiometric && biometricSupported && !statusUnavailable;

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-primary p-6 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="box-border w-full max-w-[390px] rounded-[28px] border border-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] bg-bg-secondary p-[34px_26px_24px] text-center shadow-[0_22px_70px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <div
            className={`mb-[22px] inline-flex items-center justify-center border border-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] text-text-primary ${
              canUseFaceId
                ? 'w-[104px] h-[104px] rounded-[30px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--text-primary)_12%,transparent),color-mix(in_srgb,var(--text-primary)_4%,transparent))] shadow-[0_14px_34px_rgba(0,0,0,0.18)]'
                : 'w-[70px] h-[70px] rounded-full bg-[color-mix(in_srgb,var(--text-primary)_9%,transparent)] shadow-none'
            }`}
          >
            {canUseFaceId ? <FaceIdGlyph size={70} /> : <Unlock size={28} />}
          </div>

          <h2 className="m-0 text-2xl font-[760] tracking-normal text-text-primary">
            {canUseFaceId ? 'Face ID' : 'Habits Locked'}
          </h2>
          <p className="m-0 mb-6 mt-2 text-sm leading-[1.45] text-text-secondary">
            {statusUnavailable
              ? 'Could not reach the server to check your lock. Reconnect and try again.'
              : canUseFaceId
                ? 'Use Face ID to unlock Habit Tracker.'
                : 'Enter your passcode to unlock Habit Tracker.'}
          </p>

          {statusUnavailable ? (
            <div className="mt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={resolveLockState}
                className="w-full cursor-pointer rounded-2xl border-none bg-text-primary py-[13px] text-[15px] font-[760] text-bg-primary transition-all duration-150 ease-[ease]"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full cursor-pointer rounded-2xl border border-[color-mix(in_srgb,var(--text-primary)_9%,transparent)] bg-transparent py-3 text-sm font-semibold text-text-secondary transition-all duration-150 ease-[ease]"
              >
                Sign out
              </button>
            </div>
          ) : (
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
                    className={`flex w-full items-center justify-center gap-[9px] rounded-2xl border-none bg-text-primary py-3.5 text-[15px] font-[760] text-bg-primary shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-[transform,filter,opacity] duration-150 ease-[ease] disabled:cursor-wait ${
                      biometricBusy ? 'cursor-wait opacity-[0.72]' : 'cursor-pointer opacity-100'
                    }`}
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

              {passcodeError && (
                <p className="m-0 text-[13px] font-semibold text-[#6a6a6a]">
                  {passcodeError}
                </p>
              )}

              <div className="mt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  className={`w-full cursor-pointer rounded-2xl border-none py-[13px] text-[15px] font-[760] transition-all duration-150 ease-[ease] ${
                    canUseFaceId
                      ? 'bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] text-text-primary'
                      : 'bg-text-primary text-bg-primary'
                  }`}
                >
                  {canUseFaceId ? 'Unlock with Passcode' : 'Unlock'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full cursor-pointer rounded-2xl border border-[color-mix(in_srgb,var(--text-primary)_9%,transparent)] bg-transparent py-3 text-sm font-semibold text-text-secondary transition-all duration-150 ease-[ease]"
                >
                  Sign out
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <FitnessSummary
      stats={stats}
      habits={habits}
      weekData={weekData}
      displayName={formattedName}
      initials={initials}
      email={email}
    />
  );
}

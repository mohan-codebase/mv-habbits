'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Fingerprint, Eye, EyeOff, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Set passcode state
  const [showSetForm, setShowSetForm] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscodeText, setShowPasscodeText] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingPasscode, setSavingPasscode] = useState(false);

  // Remove passcode state
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [removePasscode, setRemovePasscode] = useState('');
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingPasscode, setRemovingPasscode] = useState(false);

  // Change Account Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    setPasswordError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      alert('Password updated successfully!');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Fetch lock status
  const fetchLockStatus = async () => {
    try {
      const res = await fetch('/api/passcode');
      const json = await res.json();
      if (res.ok && json?.data) {
        setHasPasscode(Boolean(json.data.hasPasscode));
        setHasBiometric(Boolean(json.data.hasBiometric));
      }
    } catch (e) {
      console.error('Failed to load lock status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLockStatus();

    // Check biometric availability
    if (typeof window !== 'undefined' && window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }
  }, []);

  const handleSavePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('Passcode cannot be empty.');
      return;
    }
    if (passcode !== confirmPasscode) {
      setErrorMsg('Passcodes do not match.');
      return;
    }

    setSavingPasscode(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/passcode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save passcode');
      }

      setHasPasscode(true);
      setShowSetForm(false);
      setPasscode('');
      setConfirmPasscode('');
      alert('Passcode set successfully! Habits will now be protected.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save passcode');
    } finally {
      setSavingPasscode(false);
    }
  };

  const handleRemovePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removePasscode.trim()) {
      setRemoveError('Please enter your current passcode.');
      return;
    }

    setRemovingPasscode(true);
    setRemoveError(null);
    try {
      // 1. Verify passcode first
      const verifyRes = await fetch('/api/passcode/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: removePasscode }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson?.data?.verified) {
        setRemoveError('Incorrect passcode. Please try again.');
        setRemovingPasscode(false);
        return;
      }

      // 2. Remove passcode and biometrics
      const deleteRes = await fetch('/api/passcode', { method: 'DELETE' });
      if (!deleteRes.ok) {
        throw new Error('Failed to remove passcode');
      }

      setHasPasscode(false);
      setHasBiometric(false);
      setShowRemoveForm(false);
      setRemovePasscode('');
      alert('Habits passcode and biometric lock removed.');
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove lock');
    } finally {
      setRemovingPasscode(false);
    }
  };

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
        alert('Face ID / Touch ID unlock is now enabled.');
      } else {
        alert(verJson?.error || 'Could not enable biometric unlock.');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'NotAllowedError') {
        alert('Biometric setup was cancelled or is unavailable on this device.');
      }
    } finally {
      setBiometricBusy(false);
    }
  };

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
      alert('Biometric unlock disabled.');
    } catch {
      alert('Could not disable biometric unlock. Check your connection.');
    } finally {
      setBiometricBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3.5 rounded-xl border border-border-subtle bg-bg-card p-[16px_18px]">
        <Loader2 size={18} className="animate-spin" color="var(--text-muted)" />
        <span className="text-[13px] text-text-muted">Loading security settings...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Security Status Card */}
      <div className="relative flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card p-[16px_18px]">
        <div
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle"
          style={{
            background: hasPasscode ? 'var(--surface-tint)' : 'rgba(255,255,255,0.04)',
            color: hasPasscode ? 'var(--accent-primary)' : 'var(--text-muted)',
          }}
        >
          {hasPasscode ? <Lock size={18} /> : <Unlock size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
            Habits Passcode Lock
          </p>
          <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
            {hasPasscode
              ? 'Protect habit logs with a passcode required on new sessions.'
              : 'Secure your habit tracker entries from unauthorized device access.'}
          </p>

          <AnimatePresence mode="wait">
            {!showSetForm && !showRemoveForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-2"
              >
                {!hasPasscode ? (
                  <button
                    onClick={() => { setShowSetForm(true); setErrorMsg(null); }}
                    className="cursor-pointer rounded-lg border-none bg-accent-primary p-[7px_14px] text-[13px] font-semibold text-accent-on-primary [font-family:inherit]"
                  >
                    Enable passcode
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowRemoveForm(true); setRemoveError(null); }}
                    className="cursor-pointer rounded-lg border border-border-default bg-transparent p-[7px_14px] text-[13px] font-semibold text-danger [font-family:inherit]"
                  >
                    Remove passcode
                  </button>
                )}
              </motion.div>
            )}

            {/* Set Passcode Form */}
            {showSetForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSavePasscode}
                className="mt-1 flex w-full max-w-[320px] flex-col gap-3"
              >
                <div className="relative w-full">
                  <input
                    type={showPasscodeText ? 'text' : 'password'}
                    placeholder="Enter new passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    className="w-full rounded-[10px] border border-border-default bg-bg-tertiary p-[10px_42px_10px_12px] text-[14px] text-text-primary outline-none [font-family:inherit]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscodeText(!showPasscodeText)}
                    className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center border-none bg-none p-1 text-text-muted cursor-pointer"
                  >
                    {showPasscodeText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <input
                  type={showPasscodeText ? 'text' : 'password'}
                  placeholder="Confirm new passcode"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  required
                  className="w-full rounded-[10px] border border-border-default bg-bg-tertiary p-[10px_12px] text-[14px] text-text-primary outline-none [font-family:inherit]"
                />

                {errorMsg && (
                  <p className="m-0 text-xs font-semibold text-danger">{errorMsg}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingPasscode}
                    className="rounded-lg border-none bg-text-primary p-[8px_14px] text-[13px] font-bold text-bg-primary [font-family:inherit]"
                    style={{ cursor: savingPasscode ? 'wait' : 'pointer' }}
                  >
                    {savingPasscode ? 'Saving...' : 'Save Lock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSetForm(false); setPasscode(''); setConfirmPasscode(''); }}
                    className="cursor-pointer rounded-lg border border-border-default bg-transparent p-[8px_14px] text-[13px] font-semibold text-text-secondary [font-family:inherit]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            {/* Remove Passcode Form */}
            {showRemoveForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleRemovePasscode}
                className="mt-1 flex w-full max-w-[320px] flex-col gap-3"
              >
                <input
                  type="password"
                  placeholder="Enter current passcode to disable"
                  value={removePasscode}
                  onChange={(e) => setRemovePasscode(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-[10px] border border-border-default bg-bg-tertiary p-[10px_12px] text-[14px] text-text-primary outline-none [font-family:inherit]"
                />

                {removeError && (
                  <p className="m-0 text-xs font-semibold text-danger">{removeError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={removingPasscode}
                    className="rounded-lg border-none bg-danger p-[8px_14px] text-[13px] font-bold text-accent-on-primary [font-family:inherit]"
                    style={{ cursor: removingPasscode ? 'wait' : 'pointer' }}
                  >
                    {removingPasscode ? 'Removing...' : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRemoveForm(false); setRemovePasscode(''); }}
                    className="cursor-pointer rounded-lg border border-border-default bg-transparent p-[8px_14px] text-[13px] font-semibold text-text-secondary [font-family:inherit]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Biometric setup card (visible only if passcode lock is active and biometrics are supported) */}
      {hasPasscode && biometricSupported && (
        <div className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card p-[16px_18px]">
          <div
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle"
            style={{
              background: hasBiometric ? 'var(--surface-tint)' : 'rgba(255,255,255,0.04)',
              color: hasBiometric ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
          >
            <Fingerprint size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
              Face ID / Touch ID Unlock
            </p>
            <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
              Use your device platform authenticator to quickly unlock the Habit Tracker without typing.
            </p>

            <button
              disabled={biometricBusy}
              onClick={hasBiometric ? handleDisableBiometric : handleEnrollBiometric}
              className="rounded-lg p-[7px_14px] text-[13px] font-semibold [font-family:inherit]"
              style={{
                background: hasBiometric ? 'transparent' : 'var(--accent-primary)',
                color: hasBiometric ? 'var(--text-secondary)' : 'var(--accent-on-primary)',
                border: hasBiometric ? '1px solid var(--border-default)' : 'none',
                cursor: biometricBusy ? 'wait' : 'pointer',
              }}
            >
              {biometricBusy
                ? 'Processing...'
                : hasBiometric
                  ? 'Disable biometrics'
                  : 'Enable biometrics'}
            </button>
          </div>
        </div>
      )}

      {/* Account Password Card */}
      <div className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card p-[16px_18px]">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle bg-[rgba(255,255,255,0.04)] text-text-muted">
          <KeyRound size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
            Account Password
          </p>
          <p className="m-0 mb-3 text-[12.5px] leading-[1.5] text-text-muted">
            Update your account login password.
          </p>

          <AnimatePresence mode="wait">
            {!showPasswordForm ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  onClick={() => { setShowPasswordForm(true); setPasswordError(null); }}
                  className="cursor-pointer rounded-lg border-none bg-accent-primary p-[7px_14px] text-[13px] font-semibold text-accent-on-primary [font-family:inherit]"
                >
                  Change password
                </button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleUpdatePassword}
                className="flex w-full max-w-[320px] flex-col gap-3"
              >
                <div className="relative w-full">
                  <input
                    type={showNewPasswordText ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full rounded-[10px] border border-border-default bg-bg-tertiary p-[10px_42px_10px_12px] text-[14px] text-text-primary outline-none [font-family:inherit]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                    className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center border-none bg-none p-1 text-text-muted cursor-pointer"
                  >
                    {showNewPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <input
                  type={showNewPasswordText ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-[10px] border border-border-default bg-bg-tertiary p-[10px_12px] text-[14px] text-text-primary outline-none [font-family:inherit]"
                />

                {passwordError && (
                  <p className="m-0 text-xs font-semibold text-danger">{passwordError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="rounded-lg border-none bg-text-primary p-[8px_14px] text-[13px] font-bold text-bg-primary [font-family:inherit]"
                    style={{ cursor: updatingPassword ? 'wait' : 'pointer' }}
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}
                    className="cursor-pointer rounded-lg border border-border-default bg-transparent p-[8px_14px] text-[13px] font-semibold text-text-secondary [font-family:inherit]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

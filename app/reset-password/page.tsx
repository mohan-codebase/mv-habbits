'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        await supabase.auth.signOut();
        setTimeout(() => {
          router.push('/login?error=Password reset successfully! Please sign in with your new password.');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center overflow-y-auto bg-[#07090E] text-white font-['Inter'] p-3.5 sm:p-6 py-6 sm:py-8 selection:bg-indigo-500 selection:text-white">
      {/* Background Radial Orbs & Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-indigo-600/35 via-purple-600/25 to-pink-500/20 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-10 right-10 w-[22rem] h-[22rem] rounded-full bg-gradient-to-br from-blue-600/20 via-teal-500/15 to-purple-600/20 blur-[90px] pointer-events-none"
      />

      {/* Modern Grid Lines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px] rounded-2xl sm:rounded-3xl bg-[#11141F]/95 backdrop-blur-2xl border border-white/15 p-4.5 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.75),0_2px_8px_rgba(255,255,255,0.06)_inset]"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-3.5 sm:mb-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20 mb-2">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-white">
            Set New Password
          </h1>
          <p className="text-[11.5px] sm:text-xs text-white/60 mt-0.5">
            Choose a strong password with at least 8 characters
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10"
          >
            <div className="w-10 h-10 rounded-full inline-flex items-center justify-center mb-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-white mb-1 font-['Outfit'] tracking-tight">
              Password Updated!
            </h3>
            <p className="text-[12px] text-white/60">
              Redirecting to sign in page…
            </p>
          </motion.div>
        ) : (
          <>
            {/* Error Alert */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: error ? 1 : 0, height: error ? 'auto' : 0 }}
              className="overflow-hidden"
            >
              {error && (
                <div
                  className="mb-3 p-2.5 rounded-xl flex items-start gap-2 text-xs font-medium bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.3)] text-[#fb7185]"
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="flex flex-col gap-2.5 sm:gap-3">
              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] sm:text-[12.5px] font-semibold text-white/90 px-0.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3 z-10 text-white/50 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full py-2 sm:py-2.5 pl-[38px] pr-[38px] bg-white/[0.07] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/15 focus:border-indigo-500 rounded-xl text-white text-[13px] placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 z-10 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] sm:text-[12.5px] font-semibold text-white/90 px-0.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3 z-10 text-white/50 pointer-events-none" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full py-2 sm:py-2.5 pl-[38px] pr-[38px] bg-white/[0.07] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/15 focus:border-indigo-500 rounded-xl text-white text-[13px] placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 z-10 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                    aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-full text-white font-semibold text-[13px] sm:text-[13.5px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border border-white/20 shadow-[0_4px_16px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.5)] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Zap size={14} className="animate-spin" /> Updating Password…
                  </span>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Security Badge */}
        <div className="mt-3.5 sm:mt-4 pt-2.5 border-t border-white/12 flex items-center justify-center gap-3 text-white/40 text-[10.5px] sm:text-[11px]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" /> 256-bit Encrypted
          </span>
          <span>•</span>
          <span>Privacy Guaranteed</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

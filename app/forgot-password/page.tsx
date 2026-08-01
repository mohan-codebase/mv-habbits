'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/utils/url';

function ForgotPasswordContent() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col justify-center items-center relative overflow-hidden bg-[#07090E] text-white font-['Inter'] p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      {/* Background Radial Orbs & Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-500/15 blur-[100px] pointer-events-none"
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
        className="relative z-10 w-full max-w-[400px] sm:max-w-[420px] rounded-3xl bg-[#11141F]/90 backdrop-blur-2xl border border-white/[0.12] p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.08)_inset]"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-11 h-11 mb-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-white/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight text-white">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            We&apos;ll send a secure reset link to your email
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 px-4 rounded-2xl bg-white/[0.03] border border-white/10"
          >
            <div className="w-12 h-12 rounded-full inline-flex items-center justify-center mb-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-white mb-1 font-['Outfit'] tracking-tight">
              Reset Link Sent!
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Check your inbox at <strong className="text-white">{email}</strong> for instructions.
            </p>
            <Link
              href="/login"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
            >
              Back to Sign In &rarr;
            </Link>
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
                  className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.25)] text-[#fb7185]"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>

            {/* Form */}
            <form onSubmit={handleResetRequest} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-300 px-0.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 z-10 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full h-11 sm:h-12 pl-10 pr-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.09] border border-white/10 focus:border-indigo-500/80 rounded-xl text-white text-xs sm:text-sm placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl text-white font-semibold text-xs sm:text-sm bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border border-white/20 shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.5)] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Zap size={15} className="animate-spin" /> Sending Link…
                  </span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-4 text-xs text-slate-400">
              Remember your password?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* Security Badge */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-center gap-3 text-slate-400 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" /> 256-bit Encrypted
          </span>
          <span>•</span>
          <span>Privacy Guaranteed</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

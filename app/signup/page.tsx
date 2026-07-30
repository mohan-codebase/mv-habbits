'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SocialAuth from '@/components/auth/SocialAuth';
import { getSiteUrl } from '@/lib/utils/url';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') || '');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  // Password strength calculation
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[A-Z]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwStrength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${getSiteUrl()}/dashboard`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1800);
      }
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
        className="relative z-10 w-full max-w-[420px] rounded-2xl sm:rounded-[24px] bg-[#11141F] border border-white/10 p-6 sm:p-8"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-3.5 sm:mb-5">
          <div className="w-10 h-10 mb-2 relative">
            <Image src="/logo/logo-dark.png" alt="Productivity Master" fill style={{ objectFit: 'contain' }} priority sizes="40px" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight text-white">
            Productivity Master
          </h1>
          <p className="text-sm sm:text-[15px] text-white/60 mt-1">
            Start tracking habits and building streak momentum
          </p>
        </div>

        {/* Tab Switcher (Sign In / Create Account) */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.06] border border-white/12 mb-4 sm:mb-5">
          <Link
            href="/login"
            className="flex-1 py-2 sm:py-2.5 text-[14px] sm:text-[15px] font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04] transition-all text-center"
          >
            Sign In
          </Link>
          <button
            type="button"
            className="flex-1 py-2 sm:py-2.5 text-[14px] sm:text-[15px] font-semibold rounded-lg bg-indigo-600 text-white transition-all cursor-default text-center"
          >
            Create Account
          </button>
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
              Account Created!
            </h3>
            <p className="text-[12px] text-white/60">
              Redirecting to your habit dashboard…
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
                  className="mb-3 p-2.5 rounded-xl flex items-start gap-2 text-xs font-medium"
                  style={{
                    background: error.includes('already registered')
                      ? 'rgba(79, 70, 229, 0.15)'
                      : 'rgba(244, 63, 94, 0.15)',
                    border: `1px solid ${
                      error.includes('already registered')
                        ? 'rgba(79, 70, 229, 0.3)'
                        : 'rgba(244, 63, 94, 0.3)'
                    }`,
                    color: error.includes('already registered') ? '#818cf8' : '#fb7185',
                  }}
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5 leading-relaxed">
                    <span>{error}</span>
                    {error.includes('already registered') && (
                      <Link
                        href="/login"
                        className="text-white font-semibold underline underline-offset-2 hover:text-indigo-300 transition-colors"
                      >
                        Account exists. Log in here &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSignup} className="flex flex-col gap-2.5 sm:gap-3">
              {/* Full Name Field */}
              <div className="flex flex-col gap-1">
                <label className="text-sm sm:text-[14.5px] font-semibold text-white/90 px-0.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User size={15} className="absolute left-3 z-10 text-white/50 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    required
                    style={{ paddingLeft: '38px', paddingRight: '14px' }}
                    className="w-full py-3 sm:py-3.5 bg-white/[0.07] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/15 focus:border-indigo-500 rounded-xl text-white text-[14.5px] sm:text-[15px] placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1">
                <label className="text-sm sm:text-[14.5px] font-semibold text-white/90 px-0.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3 z-10 text-white/50 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    autoComplete="email"
                    required
                    style={{ paddingLeft: '38px', paddingRight: '14px' }}
                    className="w-full py-3 sm:py-3.5 bg-white/[0.07] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/15 focus:border-indigo-500 rounded-xl text-white text-[14.5px] sm:text-[15px] placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label className="text-sm sm:text-[14.5px] font-semibold text-white/90 px-0.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3 z-10 text-white/50 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    className="w-full py-3 sm:py-3.5 bg-white/[0.07] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/15 focus:border-indigo-500 rounded-xl text-white text-[14.5px] sm:text-[15px] placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-0.5 px-0.5 space-y-0.5">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-white/40">Password Strength:</span>
                      <span className="font-semibold text-white/90">{pwStrength.label}</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwStrength.score >= 1 ? pwStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwStrength.score >= 2 ? pwStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwStrength.score >= 3 ? pwStrength.color : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-xl text-white font-semibold text-[15px] sm:text-[15.5px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border border-white/20 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Zap size={14} className="animate-spin" /> Creating Account…
                  </span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3 sm:my-3.5">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-wider text-white/50 font-semibold">
                Or signup with
              </span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* Google OAuth Button */}
            <SocialAuth loading={loading} setLoading={setLoading} />

            {/* Terms Disclaimer */}
            <p className="text-center mt-3 text-[10.5px] text-white/40 leading-relaxed max-w-[260px] mx-auto">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </>
        )}

        {/* Security Badge */}
        <div className="mt-3.5 sm:mt-4 pt-2.5 border-t border-white/12 flex items-center justify-center gap-3 text-white/40 text-[10.5px] sm:text-[11px]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" /> Free Forever Plan
          </span>
          <span>•</span>
          <span>No Credit Card Required</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <SignupContent />
    </Suspense>
  );
}

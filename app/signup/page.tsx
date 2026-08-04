'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SocialAuth from '@/components/auth/SocialAuth';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTabSwitcher from '@/components/auth/AuthTabSwitcher';
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
    <AuthLayout activeTab="signup">
      {/* Tab Switcher */}
      <AuthTabSwitcher activeTab="signup" />

      {/* Form Header */}
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold font-['Outfit'] text-[var(--text-primary)] tracking-tight">
          Create your account
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Start tracking habits and building streak momentum today
        </p>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 px-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-default)]"
        >
          <div className="w-12 h-12 rounded-full inline-flex items-center justify-center mb-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-['Outfit'] tracking-tight">
            Account Created!
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
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
                className="mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium"
                style={{
                  background: error.includes('already registered')
                    ? 'rgba(79, 70, 229, 0.12)'
                    : 'rgba(244, 63, 94, 0.12)',
                  border: `1px solid ${
                    error.includes('already registered')
                      ? 'rgba(79, 70, 229, 0.25)'
                      : 'rgba(244, 63, 94, 0.25)'
                  }`,
                  color: error.includes('already registered') ? '#818cf8' : '#fb7185',
                }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1 leading-relaxed">
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
          <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
            {/* Full Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-300 px-0.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User size={17} className="absolute left-3.5 z-10 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                  className="auth-input w-full h-12 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] border border-[var(--input-border)] focus:border-indigo-500/80 rounded-2xl text-[var(--text-primary)] text-xs sm:text-sm placeholder:text-[var(--text-muted)] outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-300 px-0.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={17} className="absolute left-3.5 z-10 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  required
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                  className="auth-input w-full h-12 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] border border-[var(--input-border)] focus:border-indigo-500/80 rounded-2xl text-[var(--text-primary)] text-xs sm:text-sm placeholder:text-[var(--text-muted)] outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-300 px-0.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock size={17} className="absolute left-3.5 z-10 text-slate-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  style={{ paddingLeft: '48px', paddingRight: '48px' }}
                  className="auth-input-pw w-full h-12 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] border border-[var(--input-border)] focus:border-indigo-500/80 rounded-2xl text-[var(--text-primary)] text-xs sm:text-sm placeholder:text-[var(--text-muted)] outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 z-10 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-1 px-0.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-semibold text-white">{pwStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
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
              className="auth-card-btn mt-1 w-full h-12 flex items-center justify-center gap-2 rounded-2xl text-white font-semibold text-xs sm:text-sm bg-[#8B5CF6] hover:bg-[#7C3AED] border border-white/20 shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_24px_rgba(139,92,246,0.5)] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Zap size={16} className="animate-spin" /> Creating Account…
                </span>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--border-default)]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Or signup with
            </span>
            <div className="flex-1 h-px bg-[var(--border-default)]" />
          </div>

          {/* Social OAuth Buttons */}
          <SocialAuth loading={loading} setLoading={setLoading} />

          {/* Terms Disclaimer */}
          <p className="text-center mt-3.5 text-[11px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </>
      )}

      {/* Security Badge */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)] flex items-center justify-center gap-3 text-[var(--text-muted)] text-[11px] sm:text-xs">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400" /> Free Forever Plan
        </span>
        <span>•</span>
        <span>No Credit Card Required</span>
      </div>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <SignupContent />
    </Suspense>
  );
}

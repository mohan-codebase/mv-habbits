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
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SocialAuth from '@/components/auth/SocialAuth';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTabSwitcher from '@/components/auth/AuthTabSwitcher';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') || '');

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout activeTab="login">
      {/* Tab Switcher */}
      <AuthTabSwitcher activeTab="login" />

      {/* Form Header */}
      <div className="mb-5 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[var(--text-primary)] tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Enter your credentials to access your habit dashboard
        </p>
      </div>

      {/* Error / Success Alert */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: error ? 1 : 0, height: error ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        {error && (
          <div
            className="mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium"
            style={{
              background: error.includes('successfully')
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${
                error.includes('successfully') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'
              }`,
              color: error.includes('successfully') ? '#34d399' : '#fb7185',
            }}
          >
            {error.includes('successfully') ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <div className="flex flex-col gap-1 leading-relaxed">
              <span>{error}</span>
              {!error.includes('successfully') && (
                <Link
                  href="/signup"
                  className="text-white font-semibold underline underline-offset-2 hover:text-indigo-300 transition-colors"
                >
                  Create a new account &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-[13px] font-semibold text-[var(--text-secondary)] px-0.5">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail size={17} className="absolute left-3.5 z-10 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full h-12 pl-11 pr-4 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] border border-[var(--input-border)] focus:border-indigo-500/80 rounded-2xl text-[var(--text-primary)] text-xs sm:text-sm placeholder:text-[var(--text-muted)] outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-xs sm:text-[13px] font-semibold text-[var(--text-secondary)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock size={17} className="absolute left-3.5 z-10 text-[var(--text-muted)] pointer-events-none" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full h-12 pl-11 pr-11 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] border border-[var(--input-border)] focus:border-indigo-500/80 rounded-2xl text-[var(--text-primary)] text-xs sm:text-sm placeholder:text-[var(--text-muted)] outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
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
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full h-12 flex items-center justify-center gap-2 rounded-2xl text-white font-semibold text-xs sm:text-sm bg-[#8B5CF6] hover:bg-[#7C3AED] border border-white/20 shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_24px_rgba(139,92,246,0.5)] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Zap size={16} className="animate-spin" /> Signing in…
            </span>
          ) : (
            <>
              <span>Sign in to Dashboard</span>
              <ArrowRight size={17} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--border-default)]" />
        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
          Or continue with
        </span>
        <div className="flex-1 h-px bg-[var(--border-default)]" />
      </div>

      {/* Social OAuth Buttons */}
      <SocialAuth loading={loading} setLoading={setLoading} />

      {/* Security & Privacy Footer */}
      <div className="mt-5 pt-3.5 border-t border-[var(--border-default)] flex items-center justify-center gap-3 text-[var(--text-muted)] text-[11px] sm:text-xs">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400" /> 256-bit Encrypted
        </span>
        <span>•</span>
        <span>Privacy Guaranteed</span>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]" />}>
      <LoginContent />
    </Suspense>
  );
}

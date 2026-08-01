'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/utils/url';
import { Provider } from '@supabase/supabase-js';

interface SocialAuthProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function SocialAuth({ loading, setLoading }: SocialAuthProps) {
  const supabase = createClient();

  const handleOAuth = async (provider: Provider) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?from=${window.location.pathname}`,
          ...(provider === 'google' ? {
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            }
          } : {})
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(`${provider} OAuth error:`, err);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={loading}
        className="auth-social-btn group relative flex items-center justify-center gap-2.5 h-11 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs sm:text-sm border border-[var(--border-default)] hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 transition-transform duration-200 group-hover:scale-110">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span>Google</span>
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={() => handleOAuth('apple')}
        disabled={loading}
        className="auth-social-btn group relative flex items-center justify-center gap-2.5 h-11 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs sm:text-sm border border-[var(--border-default)] hover:border-slate-400/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 transition-transform duration-200 group-hover:scale-110 text-white">
          <path fill="currentColor" d="M16.365 21.439c-1.396.942-2.894 1.905-4.437 1.905s-3.056-.991-4.485-1.928c-4.453-2.903-7.443-8.875-7.443-13.626 0-3.328 2.115-5.32 4.494-5.32 1.487 0 2.879 1.056 4.316 1.056 1.547 0 3.013-1.127 4.549-1.127 1.636 0 3.323.754 4.354 2.174-3.791 2.22-3.13 7.842.822 9.388-.934 2.826-2.585 5.565-4.479 7.477h-.002zm-3.238-16.142c-.201 2.226-2.025 4.093-4.185 4.22-.243-2.316 1.831-4.22 4.041-4.423.048-.004.097-.006.144-.006.275 0 .534.053.778.148z"/>
        </svg>
        <span>Apple</span>
      </button>

      {/* X / Twitter */}
      <button
        type="button"
        onClick={() => handleOAuth('twitter')}
        disabled={loading}
        className="auth-social-btn group relative flex items-center justify-center gap-2.5 h-11 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs sm:text-sm border border-[var(--border-default)] hover:border-sky-500/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" className="shrink-0 transition-transform duration-200 group-hover:scale-110 text-sky-400">
          <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span>X / Twitter</span>
      </button>

      {/* Instagram */}
      <button
        type="button"
        onClick={() => handleOAuth('instagram' as any)}
        disabled={loading}
        className="auth-social-btn group relative flex items-center justify-center gap-2.5 h-11 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs sm:text-sm border border-[var(--border-default)] hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.15)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" className="shrink-0 transition-transform duration-200 group-hover:scale-110 text-pink-400">
          <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
        </svg>
        <span>Instagram</span>
      </button>
    </div>
  );
}

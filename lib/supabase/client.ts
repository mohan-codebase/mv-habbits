'use client';

import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(
    url &&
      anonKey &&
      !url.includes('placeholder.supabase.co') &&
      url.startsWith('http')
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase environment variables are missing. Connectivity will be limited.');
    }
    // Return a dummy client or one with placeholders, but ensure it doesn't throw on creation
    try {
      return createBrowserClient(
        url || 'https://placeholder.supabase.co',
        anonKey || 'placeholder'
      );
    } catch (e) {
      console.error('Failed to initialize Supabase browser client:', e);
      return createBrowserClient('https://placeholder.supabase.co', 'placeholder');
    }
  }

  return createBrowserClient(url, anonKey);
}

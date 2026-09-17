'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  lightAccent: string;
  darkAccent: string;
  setLightAccent: (c: string) => void;
  setDarkAccent: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'mv_habits_theme';

function hexToRgbComponents(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  return `${parseInt(full.slice(0, 2), 16)}, ${parseInt(full.slice(2, 4), 16)}, ${parseInt(full.slice(4, 6), 16)}`;
}

function readAppliedTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  // The pre-paint script in layout.tsx has already resolved and applied the
  // theme to <html data-theme>. Trust that as the single source of truth so
  // the toggle's icon/state can never disagree with what's actually painted.
  const applied = document.documentElement.dataset.theme;
  if (applied === 'light' || applied === 'dark') return applied;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  // The favicon no longer swaps per theme: the gold key mark is transparent and
  // reads on both light and dark tab strips. app/icon.png is served by Next.
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [lightAccent, setLightAccentState] = useState('#8B5CF6');
  const [darkAccent, setDarkAccentState] = useState('#8B5CF6');

  useEffect(() => {
    const initial = readAppliedTheme();
    applyTheme(initial);
    setThemeState(initial);

    // Follow the OS appearance live. An actual OS change always wins and also
    // clears any manual pin — so the toggle overrides the theme until the next
    // time you change your system appearance, and you can never get stuck.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = (e: MediaQueryListEvent) => {
      const next: Theme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setThemeState(next);
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  // Sync active accent color to the document root element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const activeAccent = theme === 'light' ? lightAccent : darkAccent;
    document.documentElement.style.setProperty('--accent-primary', activeAccent);
    document.documentElement.style.setProperty('--accent-primary-rgb', hexToRgbComponents(activeAccent));
  }, [theme, lightAccent, darkAccent]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setLightAccent = useCallback((color: string) => {
    setLightAccentState(color);
    try {
      window.localStorage.setItem('mv_habits_light_accent', color);
    } catch {
      /* ignore */
    }
  }, []);

  const setDarkAccent = useCallback((color: string) => {
    setDarkAccentState(color);
    try {
      window.localStorage.setItem('mv_habits_dark_accent', color);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggle,
      lightAccent,
      darkAccent,
      setLightAccent,
      setDarkAccent,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>.');
  return ctx;
}

/** Returns the resolved hex for the current theme's accent color. Use this
 *  anywhere you need a literal hex (SVG presentation attributes, rgba()). */
export function useAccentColor(): string {
  const { theme, lightAccent, darkAccent } = useTheme();
  return theme === 'light' ? lightAccent : darkAccent;
}

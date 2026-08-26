'use client';

import React, { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  Target,
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  Trophy,
  NotebookPen,
  Settings,
  Compass,
  type LucideIcon,
} from 'lucide-react';

interface PreloaderConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  statuses: { text: string; icon: LucideIcon }[];
}

const ROUTE_CONFIG: Record<string, PreloaderConfig> = {
  '/dashboard': {
    title: 'Command Center',
    subtitle: 'Daily Habit Matrix',
    icon: LayoutDashboard,
    statuses: [
      { text: 'Aligning daily objectives...', icon: Target },
      { text: 'Syncing routine matrix...', icon: Zap },
      { text: 'Igniting streak momentum...', icon: Flame },
      { text: 'Command center ready.', icon: Sparkles },
    ],
  },
  '/dashboard/habits': {
    title: 'Habit Matrix',
    subtitle: 'Routine Engine',
    icon: CalendarCheck,
    statuses: [
      { text: 'Loading habit registry...', icon: Target },
      { text: 'Calibrating schedules...', icon: Zap },
      { text: 'Calculating completion streaks...', icon: Flame },
      { text: 'Habits synced and ready.', icon: Sparkles },
    ],
  },
  '/dashboard/analytics': {
    title: 'Analytics Engine',
    subtitle: 'Performance & Trends',
    icon: BarChart3,
    statuses: [
      { text: 'Querying historical logs...', icon: BarChart3 },
      { text: 'Generating completion heatmaps...', icon: Zap },
      { text: 'Synthesizing trend curves...', icon: Flame },
      { text: 'Metrics compiled.', icon: Sparkles },
    ],
  },
  '/dashboard/achievements': {
    title: 'Achievement Vault',
    subtitle: 'Milestones & Badges',
    icon: Trophy,
    statuses: [
      { text: 'Scanning unlocked badges...', icon: Trophy },
      { text: 'Verifying streak records...', icon: Zap },
      { text: 'Calculating mastery tier...', icon: Flame },
      { text: 'Trophies loaded.', icon: Sparkles },
    ],
  },
  '/dashboard/quotes': {
    title: 'Daily Inspiration',
    subtitle: 'Mindset & Clarity',
    icon: Sparkles,
    statuses: [
      { text: 'Channeling mindset wisdom...', icon: Sparkles },
      { text: 'Filtering inspirational gems...', icon: Zap },
      { text: 'Priming motivation...', icon: Flame },
      { text: 'Inspiration unlocked.', icon: Sparkles },
    ],
  },
  '/dashboard/notes': {
    title: 'Neural Notes',
    subtitle: 'Thoughts & Reflections',
    icon: NotebookPen,
    statuses: [
      { text: 'Decrypting journal logs...', icon: NotebookPen },
      { text: 'Structuring reflections...', icon: Zap },
      { text: 'Syncing note stream...', icon: Flame },
      { text: 'Notebook ready.', icon: Sparkles },
    ],
  },
  '/dashboard/settings': {
    title: 'System Preferences',
    subtitle: 'Security & Profile',
    icon: Settings,
    statuses: [
      { text: 'Reading configuration...', icon: Settings },
      { text: 'Verifying security status...', icon: ShieldCheck },
      { text: 'Applying preferences...', icon: Zap },
      { text: 'Config loaded.', icon: Sparkles },
    ],
  },
  '/dashboard/year-in-review': {
    title: 'Year In Review',
    subtitle: 'Annual Retrospective',
    icon: Sparkles,
    statuses: [
      { text: 'Aggregating annual logs...', icon: Sparkles },
      { text: 'Computing yearly completion rates...', icon: BarChart3 },
      { text: 'Compiling annual milestones...', icon: Flame },
      { text: 'Year in review ready.', icon: Sparkles },
    ],
  },
  '/login': {
    title: 'Auth Portal',
    subtitle: 'Secure Access',
    icon: ShieldCheck,
    statuses: [
      { text: 'Initializing security handshake...', icon: ShieldCheck },
      { text: 'Preparing auth credentials...', icon: Zap },
      { text: 'Access portal ready.', icon: Sparkles },
    ],
  },
  '/signup': {
    title: 'Join Productivity Master',
    subtitle: 'Start Your Journey',
    icon: Sparkles,
    statuses: [
      { text: 'Allocating user workspace...', icon: Target },
      { text: 'Configuring daily templates...', icon: Zap },
      { text: 'Ready to build excellence.', icon: Sparkles },
    ],
  },
};

const DEFAULT_CONFIG: PreloaderConfig = {
  title: 'Productivity Master',
  subtitle: 'Daily Excellence Engine',
  icon: Compass,
  statuses: [
    { text: 'Calibrating daily focus...', icon: Target },
    { text: 'Syncing habit matrix...', icon: Zap },
    { text: 'Igniting streak momentum...', icon: Flame },
    { text: 'Securing your daily flow...', icon: ShieldCheck },
    { text: 'Ready to master your day.', icon: Sparkles },
  ],
};

function getRouteConfig(path: string): PreloaderConfig {
  if (ROUTE_CONFIG[path]) return ROUTE_CONFIG[path];
  for (const [key, value] of Object.entries(ROUTE_CONFIG)) {
    if (path.startsWith(key) && key !== '/dashboard') {
      return value;
    }
  }
  const clean = path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Productivity Master';
  return {
    title: clean.toUpperCase(),
    subtitle: 'Productivity Master',
    icon: Compass,
    statuses: DEFAULT_CONFIG.statuses,
  };
}

const emptySubscribe = () => () => {};

export default function AppPreloader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Preloader State
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentConfig, setCurrentConfig] = useState(DEFAULT_CONFIG);

  const prevPathRef = useRef(pathname);
  const isFirstLoadRef = useRef(true);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close preloader with cinematic exit animation
  const closePreloader = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setProgress(0);
    }, 550);
  }, []);

  // Quick skip with Escape or Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible && !isClosing && (e.key === 'Escape' || e.key === ' ')) {
        closePreloader();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isClosing, closePreloader]);

  // Full-view preloader sequence runner
  const startPreloader = useCallback(
    (targetPath?: string, customTitle?: string, isInitial = false) => {
      // Check reduced motion
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIsVisible(false);
        return;
      }

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      const resolvedPath = targetPath || pathname;
      let cfg = getRouteConfig(resolvedPath);
      if (customTitle) {
        cfg = {
          title: customTitle,
          subtitle: 'Productivity Master',
          icon: Sparkles,
          statuses: DEFAULT_CONFIG.statuses,
        };
      }

      setCurrentConfig(cfg);
      setIsClosing(false);
      setIsVisible(true);
      setProgress(0);

      // Duration: at least 2 seconds (2200ms on initial load, 2000ms on tab switches)
      const duration = isInitial ? 2200 : 2000;
      const intervalTime = 25;
      const totalSteps = duration / intervalTime;
      const increment = 100 / totalSteps;
      let currentProgress = 0;

      progressTimerRef.current = setInterval(() => {
        currentProgress += increment + (Math.random() * 1.6 - 0.3);
        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);

          dismissTimerRef.current = setTimeout(() => {
            closePreloader();
          }, 260);
        } else {
          setProgress(Math.min(99, Math.floor(currentProgress)));
        }
      }, intervalTime);
    },
    [pathname, closePreloader]
  );

  // 1. Trigger on initial app mount
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      startPreloader(pathname, undefined, true);
    }
  }, [pathname, startPreloader]);

  // 2. Trigger on Next.js route change (tab change)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      startPreloader(pathname, undefined, false);
    }
  }, [pathname, searchParams, startPreloader]);

  // 3. Instant trigger on clicking any navigation tab / link
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target || !target.href) return;

      try {
        const targetUrl = new URL(target.href, window.location.origin);
        if (targetUrl.origin === window.location.origin && targetUrl.pathname !== window.location.pathname) {
          startPreloader(targetUrl.pathname, undefined, false);
        }
      } catch {
        // Ignore invalid URL
      }
    };

    window.addEventListener('click', handleAnchorClick, true);
    return () => window.removeEventListener('click', handleAnchorClick, true);
  }, [startPreloader]);

  // 4. Trigger on browser tab focus / visibility switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isFirstLoadRef.current) {
        startPreloader(pathname, 'Focus Restored', false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname, startPreloader]);

  // 5. Custom programmatic tab switch event
  useEffect(() => {
    const handleCustomTab = (e: Event) => {
      const custom = e as CustomEvent<{ title?: string; path?: string }>;
      startPreloader(custom.detail?.path, custom.detail?.title, false);
    };

    window.addEventListener('productivity-master:tab-change', handleCustomTab);
    return () => window.removeEventListener('productivity-master:tab-change', handleCustomTab);
  }, [startPreloader]);

  if (!isClient) return null;

  // Derive active status message index
  const statusList = currentConfig.statuses || DEFAULT_CONFIG.statuses;
  const statusIndex = Math.min(
    statusList.length - 1,
    Math.floor((progress / 100) * statusList.length)
  );
  const CurrentStatus = statusList[statusIndex] || statusList[0];
  const CurrentStatusIcon = CurrentStatus.icon;
  const TabIcon = currentConfig.icon || Sparkles;

  return (
    <AnimatePresence>
      {isVisible && !isClosing && (
        <motion.div
          key="full-view-preloader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: 'blur(16px)',
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#07060d] text-white select-none overflow-hidden"
          style={{ willChange: 'opacity, transform, filter' }}
        >
          {/* Top Laser Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-[3.5px] z-30 pointer-events-none">
            <div className="absolute inset-0 bg-purple-500/20 blur-sm" />
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-300 relative shadow-[0_0_14px_rgba(168,85,247,0.9)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.1 }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#ffffff,0_0_20px_#c084fc]" />
            </motion.div>
          </div>

          {/* Ambient Glow Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Multi-tier Neon Halos */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.6, 0.35],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-gradient-to-tr from-purple-600/35 via-indigo-500/25 to-amber-400/25 rounded-full blur-[130px]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,6,13,0.85)_75%,#07060d_100%)]" />

            {/* Cyber Grid Backdrop */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
              }}
            />
          </div>

          {/* Core Visual Display */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            {/* Centerpiece: Orbital Tech Rings & Brand Emblem */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Dashed Orbit Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-purple-500/30"
              />

              {/* Counter-rotating Tech Ring with Neon Nodes */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2.5 rounded-full border border-indigo-400/25"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              </motion.div>

              {/* Pulsing Energy Halo */}
              <motion.div
                animate={{
                  scale: [0.92, 1.1, 0.92],
                  opacity: [0.45, 0.85, 0.45],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-600/35 to-amber-500/25 blur-lg"
              />

              {/* Center Glass Card Shield */}
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-22 h-22 rounded-2xl bg-gradient-to-b from-[#1d1830] to-[#0f0d1b] border border-purple-500/40 shadow-[0_12px_44px_rgba(139,92,246,0.45)] flex items-center justify-center p-3.5 overflow-hidden backdrop-blur-xl"
              >
                {/* Metallic Gleam / Light Sweep Effect */}
                <motion.div
                  animate={{
                    x: ['-150%', '220%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: 'easeInOut',
                    repeatDelay: 0.7,
                  }}
                  className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
                />

                {/* Key Mark or Active Tab Icon */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Image
                    src="/logo/key-gold-128.png"
                    alt="Productivity Master"
                    fill
                    sizes="48px"
                    className="object-contain drop-shadow-[0_4px_16px_rgba(251,191,36,0.5)]"
                    priority
                  />
                </div>
              </motion.div>
            </div>

            {/* Active Tab Title & Subtitle Badge */}
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="flex flex-col items-center gap-2 mb-6"
            >
              <div className="flex items-center gap-2">
                <TabIcon size={18} className="text-amber-400 animate-pulse" />
                <h1 className="text-xl font-bold tracking-[0.22em] uppercase font-mono bg-gradient-to-r from-white via-purple-100 to-amber-200 bg-clip-text text-transparent">
                  {currentConfig.title}
                </h1>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10.5px] font-mono tracking-widest text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_6px_#34d399]" />
                {currentConfig.subtitle.toUpperCase()}
              </div>
            </motion.div>

            {/* Futuristic Glowing Progress Bar */}
            <div className="w-full max-w-[280px] flex flex-col gap-2.5 mb-5">
              <div className="relative w-full h-[6px] bg-white/[0.07] rounded-full overflow-hidden p-[1px] border border-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] relative"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.08 }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
                </motion.div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-0.5">
                <span className="text-[11px] text-zinc-500 tracking-wider uppercase">SYNCHRONIZING</span>
                <span className="font-semibold text-purple-300 tabular-nums">{progress}%</span>
              </div>
            </div>

            {/* Dynamic Status Milestone Ticker */}
            <div className="h-8 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={statusIndex}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg"
                >
                  <CurrentStatusIcon className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
                  <span className="truncate">{CurrentStatus.text}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Skip Control */}
          <button
            type="button"
            onClick={closePreloader}
            className="absolute bottom-6 right-6 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider px-2.5 py-1 rounded-md hover:bg-white/5 cursor-pointer z-30"
          >
            Skip [Esc]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

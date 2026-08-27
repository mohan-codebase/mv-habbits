'use client';

import React, { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppLogo from '@/components/ui/AppLogo';

const emptySubscribe = () => () => {};

export default function AppPreloader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Initial splash preloader (only on first app load)
  const [showSplash, setShowSplash] = useState(true);

  // Top progress bar (for route transitions)
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const isFirstMount = useRef(true);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial splash loader - quick and smooth (dismisses after ~500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 550);

    return () => clearTimeout(timer);
  }, []);

  // Sleek top progress bar on route changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsNavigating(true);
      setNavProgress(35);

      if (timerRef.current) clearTimeout(timerRef.current);

      const t1 = setTimeout(() => setNavProgress(80), 80);
      const t2 = setTimeout(() => {
        setNavProgress(100);
        setTimeout(() => {
          setIsNavigating(false);
          setNavProgress(0);
        }, 200);
      }, 220);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [pathname, searchParams]);

  if (!isClient) return null;

  return (
    <>
      {/* ── 1. Minimal Initial Splash Screen (first load only) ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="minimal-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4"
            >
              {/* Clean App Logo with subtle glow */}
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-2 bg-purple-500/20 rounded-2xl blur-lg" />
                <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] shadow-xl flex items-center justify-center">
                  <AppLogo width={36} height={36} />
                </div>
              </div>

              {/* Minimal Brand Title */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)] font-sans">
                  Productivity Master
                </span>
              </div>

              {/* Slim Progress Indicator */}
              <div className="w-24 h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden mt-1">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.85,
                    ease: 'easeInOut',
                  }}
                  className="w-1/2 h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Top Slim Route Loading Bar (on page changes) ── */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99998] pointer-events-none">
          <motion.div
            className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899] shadow-[0_0_8px_rgba(139,92,246,0.8)]"
            initial={{ width: '0%' }}
            animate={{ width: `${navProgress}%` }}
            transition={{ ease: 'easeOut', duration: 0.15 }}
          />
        </div>
      )}
    </>
  );
}

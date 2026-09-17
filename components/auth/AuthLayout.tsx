'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Trophy, TrendingUp, Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: 'login' | 'signup';
}

export default function AuthLayout({ children, activeTab }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Inter'] p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[40rem] h-[30rem] sm:h-[40rem] rounded-full bg-[#8B5CF6]/10 blur-[130px] pointer-events-none"
      />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Centered Auth Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-6 my-auto py-6">
        
        {/* Centered Brand Header */}
        <Link href="/" className="inline-flex items-center gap-3 mx-auto group w-fit">
          <div className="w-10 h-10 sm:w-11 sm:h-11 relative flex items-center justify-center p-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
            <Image
              src="/logo/key-gold-128.png"
              alt="MV Habits Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              MV Habits
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                Pro
              </span>
            </span>
          </div>
        </Link>

        {/* Auth Form Container Card */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="relative z-10 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-default)] p-6 sm:p-8">
            {children}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

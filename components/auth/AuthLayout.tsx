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
    <div className="min-h-dvh w-full flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Inter'] p-4 sm:p-6 md:p-8 selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[36rem] sm:w-[48rem] h-[36rem] sm:h-[48rem] rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute bottom-10 right-10 w-[24rem] sm:w-[32rem] h-[24rem] sm:h-[32rem] rounded-full bg-gradient-to-br from-blue-600/20 via-emerald-500/15 to-purple-600/20 blur-[120px] pointer-events-none"
      />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Main Container Grid */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center my-auto py-4">
        
        {/* Left Side: Interactive Showcase Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col gap-4 lg:gap-6 text-left"
        >
          {/* Brand Header */}
          <Link href="/" className="inline-flex items-center gap-3 group w-fit mx-auto lg:mx-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-white/15 to-white/5 border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
              <Image
                src="/logo/logo-dark.png"
                alt="Productivity Master Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
                Productivity Master
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Pro
                </span>
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">Habit & Goal Engine</span>
            </div>
          </Link>

          {/* Headline (Compact on Mobile, Full on Desktop) */}
          <div className="space-y-2 lg:space-y-3 text-center lg:text-left">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-['Outfit'] leading-[1.15] tracking-tight text-[var(--text-primary)]">
              Build daily habits that{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                actually stick
              </span>
            </h1>
            <p className="text-xs sm:text-base text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Track streaks, measure consistency, and unlock peak daily performance with smart habit loops and gamified insights.
            </p>
          </div>

          {/* Interactive Feature Preview Card (Shown on Desktop, hidden on mobile for clean form layout) */}
          <div className="hidden lg:flex flex-col relative rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 shadow-2xl overflow-hidden space-y-4">
            {/* Card glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl pointer-events-none rounded-full" />

            {/* Live Streak Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Active Momentum</div>
                  <div className="text-base font-bold text-white font-['Outfit']">42 Day Streak 🔥</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <TrendingUp size={14} /> +18% vs last week
              </div>
            </div>

            {/* Habit Items Preview */}
            <div className="space-y-2.5">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">Morning Meditation (15 min)</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Done • 7:30 AM</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Zap size={15} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">Deep Focus Sprint (90 min)</span>
                </div>
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">Done • 10:00 AM</span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Trophy size={15} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">Read 20 Pages of Non-fiction</span>
                </div>
                <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md">Evening Target</span>
              </div>
            </div>

            {/* Weekly Activity Mini Heatmap */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-400">Weekly Target:</span>
              <div className="flex items-center gap-1.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-6 sm:w-7 h-7 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        i < 5
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 text-white shadow-sm'
                          : i === 5
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-500 text-white shadow-sm'
                          : 'bg-white/10 text-slate-400 border border-white/10'
                      }`}
                    >
                      {i < 6 ? '✓' : ''}
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Proof Footer Pill (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 pt-1 text-slate-400 text-xs">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[var(--bg-primary)] bg-gradient-to-tr from-indigo-500 to-purple-500 text-[10px] font-bold flex items-center justify-center text-white">AM</div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[var(--bg-primary)] bg-gradient-to-tr from-emerald-500 to-teal-500 text-[10px] font-bold flex items-center justify-center text-white">JS</div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-[var(--bg-primary)] bg-gradient-to-tr from-pink-500 to-rose-500 text-[10px] font-bold flex items-center justify-center text-white">RK</div>
            </div>
            <span>Join <strong>15,000+</strong> high achievers building better habits daily.</span>
          </div>
        </motion.div>

        {/* Right Side: Auth Form Container Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="relative z-10 rounded-3xl bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-default)] p-5 sm:p-8 shadow-[var(--shadow-lg)]">
            {children}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

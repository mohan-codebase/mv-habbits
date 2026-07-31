'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthTabSwitcherProps {
  activeTab: 'login' | 'signup';
}

export default function AuthTabSwitcher({ activeTab }: AuthTabSwitcherProps) {
  return (
    <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 mb-6 relative">
      {/* Login Tab */}
      {activeTab === 'login' ? (
        <div className="relative py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white text-center flex items-center justify-center cursor-default z-10">
          <motion.div
            layoutId="activeAuthTab"
            className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <span className="relative z-10">Sign In</span>
        </div>
      ) : (
        <Link
          href="/login"
          className="relative py-2.5 text-xs sm:text-sm font-medium rounded-xl text-slate-400 hover:text-white transition-colors text-center flex items-center justify-center z-10 hover:bg-white/[0.03]"
        >
          Sign In
        </Link>
      )}

      {/* Signup Tab */}
      {activeTab === 'signup' ? (
        <div className="relative py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white text-center flex items-center justify-center cursor-default z-10">
          <motion.div
            layoutId="activeAuthTab"
            className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <span className="relative z-10">Create Account</span>
        </div>
      ) : (
        <Link
          href="/signup"
          className="relative py-2.5 text-xs sm:text-sm font-medium rounded-xl text-slate-400 hover:text-white transition-colors text-center flex items-center justify-center z-10 hover:bg-white/[0.03]"
        >
          Create Account
        </Link>
      )}
    </div>
  );
}

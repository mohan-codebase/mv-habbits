'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthTabSwitcherProps {
  activeTab: 'login' | 'signup';
}

export default function AuthTabSwitcher({ activeTab }: AuthTabSwitcherProps) {
  return (
    <div className="grid grid-cols-2 p-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] mb-6 relative">
      {/* Login Tab */}
      {activeTab === 'login' ? (
        <div className="relative py-2.5 text-xs sm:text-sm font-semibold rounded-full text-white text-center flex items-center justify-center cursor-default z-10">
          <motion.div
            layoutId="activeAuthTab"
            className="absolute inset-0 bg-[#8B5CF6] rounded-full border border-white/20"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <span className="relative z-10">Sign In</span>
        </div>
      ) : (
        <Link
          href="/login"
          className="relative py-2.5 text-xs sm:text-sm font-medium rounded-full text-[var(--text-secondary)] text-center flex items-center justify-center z-10"
        >
          Sign In
        </Link>
      )}

      {/* Signup Tab */}
      {activeTab === 'signup' ? (
        <div className="relative py-2.5 text-xs sm:text-sm font-semibold rounded-full text-white text-center flex items-center justify-center cursor-default z-10">
          <motion.div
            layoutId="activeAuthTab"
            className="absolute inset-0 bg-[#8B5CF6] rounded-full border border-white/20"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <span className="relative z-10">Create Account</span>
        </div>
      ) : (
        <Link
          href="/signup"
          className="relative py-2.5 text-xs sm:text-sm font-medium rounded-full text-[var(--text-secondary)] text-center flex items-center justify-center z-10"
        >
          Create Account
        </Link>
      )}
    </div>
  );
}

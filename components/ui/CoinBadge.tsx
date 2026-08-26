'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoins, type CoinTransaction } from '@/lib/hooks/useCoins';

// ─── Coin Icon SVG ───
function CoinIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="url(#coinGrad)" stroke="#B8860B" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#DAA520" strokeWidth="0.75" opacity="0.6" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="#8B6914"
        fontFamily="system-ui, sans-serif"
      >
        ₵
      </text>
      <defs>
        <linearGradient id="coinGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD700" />
          <stop offset="0.5" stopColor="#FFC107" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Floating +N animation ───
function CoinPop({ amount, id }: { amount: number; id: string }) {
  return (
    <motion.span
      key={id}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -28, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-extrabold whitespace-nowrap z-50"
      style={{ color: amount > 0 ? '#22C55E' : '#EF4444' }}
    >
      {amount > 0 ? `+${amount}` : amount}
    </motion.span>
  );
}

// ─── Transaction Row ───
function TxnRow({ txn }: { txn: CoinTransaction }) {
  const isPositive = txn.amount > 0;
  const labels: Record<string, string> = {
    habit_complete: 'Habit completed',
    habit_uncomplete: 'Habit uncompleted',
    streak_bonus: `Streak bonus (${(txn.metadata?.streak as number) ?? '?'} days)`,
    all_done_bonus: 'All habits done!',
  };
  const label = labels[txn.reason] ?? txn.reason;
  const time = new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date(txn.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center gap-2.5 py-2 px-1">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: isPositive ? '#22C55E' : '#EF4444',
        }}
      >
        {isPositive ? '+' : '−'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-xs font-semibold text-[var(--text-primary)] truncate">{label}</p>
        <p className="m-0 text-[10px] text-[var(--text-muted)]">{date} · {time}</p>
      </div>
      <span
        className="text-xs font-extrabold shrink-0"
        style={{ color: isPositive ? '#22C55E' : '#EF4444' }}
      >
        {isPositive ? `+${txn.amount}` : txn.amount}
      </span>
    </div>
  );
}

// ─── Main CoinBadge Component ───
interface CoinBadgeProps {
  /** Compact mode for tight spaces (just icon + number) */
  compact?: boolean;
  className?: string;
}

export default function CoinBadge({ compact = false, className = '' }: CoinBadgeProps) {
  const { coins, transactions, loading, refresh } = useCoins();
  const [showDropdown, setShowDropdown] = useState(false);
  const [pops, setPops] = useState<{ id: string; amount: number }[]>([]);
  const prevCoinsRef = useRef(coins);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Floating +N animation when coins change
  useEffect(() => {
    if (loading) return;
    const diff = coins - prevCoinsRef.current;
    if (diff !== 0) {
      const id = `pop-${Date.now()}`;
      setPops((p) => [...p, { id, amount: diff }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 900);
    }
    prevCoinsRef.current = coins;
  }, [coins, loading]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  // Refresh on open
  useEffect(() => {
    if (showDropdown) refresh();
  }, [showDropdown, refresh]);

  if (compact) {
    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
        <CoinIcon size={18} />
        <span className="text-sm font-extrabold text-amber-500 tabular-nums">
          {loading ? '—' : coins.toLocaleString()}
        </span>
        <AnimatePresence>
          {pops.map((p) => (
            <CoinPop key={p.id} {...p} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/8 hover:bg-amber-500/15 cursor-pointer transition-all"
        title="Your coins"
      >
        <CoinIcon size={20} />
        <span className="text-sm font-extrabold text-amber-500 tabular-nums">
          {loading ? '—' : coins.toLocaleString()}
        </span>
        <AnimatePresence>
          {pops.map((p) => (
            <CoinPop key={p.id} {...p} />
          ))}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+8px)] w-[280px] max-h-[360px] overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl z-[200] p-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <CoinIcon size={32} />
              <div>
                <p className="m-0 text-lg font-extrabold text-amber-500 tabular-nums">
                  {coins.toLocaleString()}
                </p>
                <p className="m-0 text-[11px] text-[var(--text-muted)] font-medium">Total Coins</p>
              </div>
            </div>

            {/* Reward info */}
            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
              <p className="m-0 text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">How to earn</p>
              <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
                <p className="m-0">✦ Complete a habit: <span className="font-bold text-green-500">+10</span></p>
                <p className="m-0">✦ All habits done today: <span className="font-bold text-green-500">+25</span></p>
                <p className="m-0">✦ Streak milestones: <span className="font-bold text-green-500">+5 to +1000</span></p>
              </div>
            </div>

            {/* Recent transactions */}
            <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Recent Activity
            </p>
            {transactions.length === 0 ? (
              <p className="m-0 text-xs text-[var(--text-muted)] py-4 text-center">
                Complete habits to earn coins!
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {transactions.slice(0, 10).map((txn) => (
                  <TxnRow key={txn.id} txn={txn} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { CoinIcon };

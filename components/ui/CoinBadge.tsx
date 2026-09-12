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
  const [showModal, setShowModal] = useState(false);
  const [pops, setPops] = useState<{ id: string; amount: number }[]>([]);
  const prevCoinsRef = useRef(coins);

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

  // Close on Escape key
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showModal]);

  // Refresh on open
  useEffect(() => {
    if (showModal) refresh();
  }, [showModal, refresh]);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-extrabold cursor-pointer transition-all ${className}`}
          title="View your coins & activity"
        >
          <CoinIcon size={18} />
          <span className="text-sm font-extrabold text-amber-500 tabular-nums">
            {loading ? '—' : coins.toLocaleString()}
          </span>
          <AnimatePresence>
            {pops.map((p) => (
              <CoinPop key={p.id} {...p} />
            ))}
          </AnimatePresence>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 cursor-pointer transition-all ${className}`}
          title="View your coins & activity"
        >
          <div className="flex items-center gap-2">
            <CoinIcon size={20} />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Total Coins</span>
          </div>
          <span className="text-sm font-extrabold text-amber-500 tabular-nums">
            {loading ? '—' : coins.toLocaleString()}
          </span>
          <AnimatePresence>
            {pops.map((p) => (
              <CoinPop key={p.id} {...p} />
            ))}
          </AnimatePresence>
        </button>
      )}

      {/* Modal Dialog */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-3xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-2xl p-5 z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <CoinIcon size={26} />
                  </div>
                  <div>
                    <p className="m-0 text-xl font-extrabold text-amber-500 tabular-nums leading-tight">
                      {coins.toLocaleString()}
                    </p>
                    <p className="m-0 text-xs text-[var(--text-muted)] font-medium">Total Coins</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Reward info */}
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="m-0 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">How to earn</p>
                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <p className="m-0 flex items-center justify-between">
                    <span>Complete a habit</span>
                    <span className="font-bold text-green-500">+10</span>
                  </p>
                  <p className="m-0 flex items-center justify-between">
                    <span>All habits done today</span>
                    <span className="font-bold text-green-500">+25</span>
                  </p>
                  <p className="m-0 flex items-center justify-between">
                    <span>Streak milestones</span>
                    <span className="font-bold text-green-500">+5 to +1000</span>
                  </p>
                </div>
              </div>

              {/* Recent transactions */}
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
                Recent Activity
              </p>
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-tertiary)]">
                  Complete habits to start earning coins!
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)] rounded-2xl bg-[var(--bg-tertiary)] px-3">
                  {transactions.slice(0, 15).map((txn) => (
                    <TxnRow key={txn.id} txn={txn} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export { CoinIcon };

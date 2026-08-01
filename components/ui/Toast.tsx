'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ──────────────────────────────────────────────────────────────────

const DISMISS_AFTER_MS = 4000;

const typeConfig: Record<
  ToastType,
  {
    icon: React.ReactNode;
    textClass: string;
    chipBgClass: string;
    borderClass: string;
    barClass: string;
  }
> = {
  success: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    textClass: 'text-accent-primary',
    chipBgClass: 'bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]',
    borderClass: 'border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)]',
    barClass: 'bg-accent-primary',
  },
  error: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    textClass: 'text-accent-primary',
    chipBgClass: 'bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]',
    borderClass: 'border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)]',
    barClass: 'bg-accent-primary',
  },
  info: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.75" fill="currentColor" />
      </svg>
    ),
    textClass: 'text-[#9c9c9c]',
    chipBgClass: 'bg-[rgba(150,150,150,0.1)]',
    borderClass: 'border-[rgba(150,150,150,0.25)]',
    barClass: 'bg-[#9c9c9c]',
  },
  warning: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
    ),
    textClass: 'text-[#a6a6a6]',
    chipBgClass: 'bg-[rgba(166,166,166,0.1)]',
    borderClass: 'border-[rgba(166,166,166,0.25)]',
    barClass: 'bg-[#a6a6a6]',
  },
};

// ─── Single Toast Card ────────────────────────────────────────────────────────

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const cfg = typeConfig[item.type];
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / DISMISS_AFTER_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      role="alert"
      aria-live="polite"
      className={`min-w-[280px] max-w-[360px] overflow-hidden rounded-[12px] border bg-bg-secondary shadow-none [pointer-events:all] ${cfg.borderClass}`}
    >
      {/* Content row */}
      <div className="flex items-start gap-2.5 py-3 px-3.5">
        {/* Icon */}
        <span
          className={`mt-px flex shrink-0 items-center rounded-[6px] p-1 ${cfg.textClass} ${cfg.chipBgClass}`}
        >
          {cfg.icon}
        </span>

        {/* Message */}
        <p className="m-0 flex-1 pt-0.5 text-[13px] leading-[1.5] text-text-primary">
          {item.message}
        </p>

        {/* Close */}
        <button
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
          className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-none bg-transparent text-text-muted transition-colors duration-100 cursor-pointer hover:text-text-primary"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-border-subtle">
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${cfg.barClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;

  // ToastContainer renders via the provider's internal state
  return null;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, createdAt: Date.now() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Portal-like fixed container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed top-5 right-5 z-[9999] flex flex-col gap-2.5"
      >
        <AnimatePresence mode="sync">
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return ctx;
}

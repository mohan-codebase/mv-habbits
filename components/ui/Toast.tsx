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
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  success: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'var(--accent-primary)',
    bg: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
    border: 'color-mix(in srgb, var(--accent-primary) 25%, transparent)',
  },
  error: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    color: 'var(--accent-primary)',
    bg: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
    border: 'color-mix(in srgb, var(--accent-primary) 25%, transparent)',
  },
  info: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.75" fill="currentColor" />
      </svg>
    ),
    color: '#9c9c9c',
    bg: 'rgba(150, 150, 150,0.1)',
    border: 'rgba(150, 150, 150,0.25)',
  },
  warning: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
    ),
    color: '#a6a6a6',
    bg: 'rgba(166, 166, 166,0.1)',
    border: 'rgba(166, 166, 166,0.25)',
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
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        boxShadow: 'none',
        overflow: 'hidden',
        minWidth: '280px',
        maxWidth: '360px',
        pointerEvents: 'all',
      }}
    >
      {/* Content row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px',
        }}
      >
        {/* Icon */}
        <span
          style={{
            color: cfg.color,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            marginTop: '1px',
            background: cfg.bg,
            borderRadius: '6px',
            padding: '4px',
          }}
        >
          {cfg.icon}
        </span>

        {/* Message */}
        <p
          style={{
            margin: 0,
            flex: 1,
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            paddingTop: '2px',
          }}
        >
          {item.message}
        </p>

        {/* Close */}
        <button
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: '4px',
            marginTop: '1px',
            transition: 'color 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '2px',
          background: 'var(--border-subtle)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: cfg.color,
            transition: 'width 0.1s linear',
          }}
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
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
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

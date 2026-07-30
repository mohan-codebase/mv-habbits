'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
  className?: string;
}

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin" aria-hidden>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
    <path d="M12.5 7a5.5 5.5 0 0 0-5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* Liquid-glass button variants:
   - primary: solid purple accent
   - secondary: frosted glass
   - ghost: fully transparent with soft hover fill
   - danger: tinted red glass */
const base: Record<ButtonVariant, { bg: string; color: string; border: string; shadow?: string }> = {
  primary: {
    bg: 'var(--accent-primary)',
    color: 'var(--accent-on-primary)',
    border: '1px solid rgba(255, 255, 255,0.14)',
    shadow: 'none',
  },
  secondary: {
    bg: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    shadow: 'none',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    bg: 'rgba(142, 142, 142,0.12)',
    color: 'var(--danger)',
    border: '1px solid rgba(142, 142, 142,0.30)',
    shadow: 'none',
  },
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 13px', fontSize: 12.5, borderRadius: 9999, gap: 6 },
  md: { padding: '9px 18px', fontSize: 13.5, borderRadius: 9999, gap: 7 },
  lg: { padding: '12px 24px', fontSize: 14.5, borderRadius: 9999, gap: 8 },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  onClick,
  type = 'button',
  children,
  className = '',
}: ButtonProps) {
  const off = disabled || loading;
  const v = base[variant];

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    letterSpacing: '-0.1px',
    cursor: off ? 'not-allowed' : 'pointer',
    opacity: off ? 0.45 : 1,
    transition: 'transform 0.15s ease, filter 0.15s ease, background 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
    width: fullWidth ? '100%' : undefined,
    outline: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: v.bg,
    color: v.color,
    border: v.border,
    boxShadow: 'none',
    ...sizes[size],
  };

  const onEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (off) return;
    const el = e.currentTarget;
    if (variant === 'primary') {
      el.style.filter = 'brightness(1.06)';
      el.style.transform = 'translateY(-1px)';
      el.style.boxShadow = 'none';
    } else if (variant === 'secondary') {
      el.style.background = 'rgba(255, 255, 255,0.10)';
      el.style.borderColor = 'var(--border-medium)';
    } else if (variant === 'ghost') {
      el.style.background = 'rgba(255, 255, 255,0.06)';
      el.style.color = 'var(--text-primary)';
    } else if (variant === 'danger') {
      el.style.background = 'rgba(142, 142, 142,0.20)';
    }
  };

  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (off) return;
    const el = e.currentTarget;
    el.style.filter = '';
    el.style.transform = '';
    el.style.background = v.bg;
    el.style.borderColor = '';
    el.style.boxShadow = 'none';
    el.style.color = v.color;
  };

  const onDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!off) e.currentTarget.style.transform = 'scale(0.97)';
  };

  const onUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!off) e.currentTarget.style.transform = variant === 'primary' ? 'translateY(-1px)' : '';
  };

  return (
    <button
      type={type}
      disabled={off}
      onClick={off ? undefined : onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onUp}
      style={style}
      className={className}
    >
      {loading ? <Spinner /> : icon ? <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span> : null}
      {children && <span>{children}</span>}
    </button>
  );
}

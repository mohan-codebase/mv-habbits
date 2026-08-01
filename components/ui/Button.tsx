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
  style?: React.CSSProperties;
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
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-primary text-accent-on-primary border border-white/[0.14] shadow-none hover:filter hover:brightness-[1.06] hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
  secondary:
    'bg-bg-tertiary text-text-primary border border-border-default shadow-none hover:bg-white/10 hover:border-border-medium active:scale-[0.97]',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:bg-white/[0.06] hover:text-text-primary active:scale-[0.97]',
  danger:
    'bg-[rgba(142,142,142,0.12)] text-[var(--danger)] border border-[rgba(142,142,142,0.30)] shadow-none hover:bg-[rgba(142,142,142,0.20)] active:scale-[0.97]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-[13px] text-[12.5px] rounded-full gap-1.5',
  md: 'py-[9px] px-[18px] text-[13.5px] rounded-full gap-[7px]',
  lg: 'py-3 px-6 text-[14.5px] rounded-full gap-2',
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
  style: customStyle,
}: ButtonProps) {
  const off = disabled || loading;

  return (
    <button
      type={type}
      disabled={off}
      onClick={off ? undefined : onClick}
      style={customStyle}
      className={`inline-flex items-center justify-center font-bold tracking-[-0.1px] outline-none select-none whitespace-nowrap transition-[transform,filter,background,opacity,border-color] duration-150 ${off ? 'cursor-not-allowed opacity-45' : 'cursor-pointer opacity-100'} ${fullWidth ? 'w-full' : ''} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? <Spinner /> : icon ? <span className="flex items-center">{icon}</span> : null}
      {children && <span>{children}</span>}
    </button>
  );
}

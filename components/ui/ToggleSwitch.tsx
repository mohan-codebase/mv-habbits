'use client';

import React from 'react';
import { DynamicIcon } from '@/lib/icons';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  /** Accessible name, e.g. "Switch to dark mode". */
  ariaLabel: string;
  /** Optional icon names (from lib/icons) shown inside the thumb per state. */
  onIcon?: string;
  offIcon?: string;
  onIconColor?: string;
  offIconColor?: string;
}

/**
 * Liquid-glass pill toggle. Mobile-safe by construction: the visual 58×32 pill
 * lives in an inner element so the global `button { min-height: 44px }` rule
 * inflates only the (invisible) tap target, never the track — and the thumb is
 * symmetric in both states. Use this everywhere instead of hand-rolling a
 * sliding switch.
 */
export default function ToggleSwitch({
  checked, onChange, ariaLabel,
  onIcon, offIcon, onIconColor = '#555555', offIconColor = '#a6a6a6',
}: ToggleSwitchProps) {
  const icon = checked ? onIcon : offIcon;
  const iconColor = checked ? onIconColor : offIconColor;

  return (
    <button
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      className="m-0 inline-flex shrink-0 items-center justify-center border-none bg-transparent p-0 cursor-pointer"
    >
      <span
        className="relative block h-8 w-[58px] rounded-full transition-all duration-300"
        style={{
          background: checked
            ? 'linear-gradient(135deg, rgba(85, 85, 85,0.55) 0%, rgba(114, 114, 114,0.35) 100%)'
            : 'linear-gradient(135deg, rgba(188, 188, 188,0.45) 0%, rgba(218, 218, 218,0.30) 100%)',
          boxShadow: checked
            ? '0 0 0 1px rgba(114, 114, 114,0.5), inset 0 1px 0 rgba(255, 255, 255,0.18), 0 4px 16px rgba(85, 85, 85,0.45)'
            : '0 0 0 1px rgba(188, 188, 188,0.6), inset 0 1px 0 rgba(255, 255, 255,0.55), 0 2px 8px rgba(85, 85, 85,0.15)',
        }}
      >
        <span
          className="absolute top-1 flex h-6 w-6 items-center justify-center rounded-full transition-[left] duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: checked ? 30 : 4,
            background: checked
              ? 'linear-gradient(145deg, rgba(255, 255, 255,0.95) 0%, rgba(235, 235, 235,0.85) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255,0.98) 0%, rgba(255, 255, 255,0.80) 100%)',
            boxShadow: checked
              ? '0 0 0 1px rgba(255, 255, 255,0.25), 0 2px 8px rgba(85, 85, 85,0.5), inset 0 1px 0 rgba(255, 255, 255,0.9)'
              : '0 0 0 1px rgba(188, 188, 188,0.4), 0 2px 6px rgba(0, 0, 0,0.12), inset 0 1px 0 rgba(255, 255, 255,1)',
          }}
        >
          {icon && <DynamicIcon name={icon} size={12} color={iconColor} />}
        </span>
      </span>
    </button>
  );
}

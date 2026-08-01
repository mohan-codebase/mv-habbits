'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HabitCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
  size?: number;
  disabled?: boolean;
}

interface Particle {
  tx: string;
  ty: string;
  rot: string;
  color: string;
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex === 'var(--accent-primary)') return `color-mix(in srgb, var(--accent-primary) ${alpha * 100}%, transparent)`;
  if (hex === 'var(--accent-light)') return `color-mix(in srgb, var(--accent-light) ${alpha * 100}%, transparent)`;
  if (!hex?.startsWith('#')) return `color-mix(in srgb, var(--accent-primary) ${alpha * 100}%, transparent)`;
  const sanitized = hex.replace('#', '');
  const full =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PARTICLES: Particle[] = [
  { tx: '-28px', ty: '-28px', rot: '-45deg', color: 'color1' },
  { tx: '28px',  ty: '-24px', rot: '30deg',  color: 'color2' },
  { tx: '24px',  ty: '28px',  rot: '60deg',  color: 'color3' },
  { tx: '-24px', ty: '24px',  rot: '-60deg', color: 'color4' },
];

export default function HabitCheckbox({
  checked,
  onChange,
  color = 'var(--accent-primary)',
  size = 40,
  disabled = false,
}: HabitCheckboxProps) {
  const prevChecked = useRef(checked);
  const [burst, setBurst] = React.useState(false);

  useEffect(() => {
    if (!prevChecked.current && checked) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 700);
      return () => clearTimeout(t);
    }
    prevChecked.current = checked;
  }, [checked]);

  const handleClick = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const strokeWidth = Math.max(1.5, size * 0.05);
  const checkInset = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - strokeWidth;

  // Particle colors derived from habit color with variation
  const particleColors = [color, '#a6a6a6', '#ffffff', color];

  return (
    <button
      type="button"
      aria-checked={checked}
      role="checkbox"
      disabled={disabled}
      onClick={handleClick}
      className={`relative flex shrink-0 items-center justify-center border-none bg-none p-0 outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
      style={{ width: size, height: size }}
    >
      {/* Confetti particles */}
      {burst &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 rounded-[2px] [animation:habit-confetti_0.6s_ease-out_forwards]"
            style={
              {
                width: Math.max(4, size * 0.1),
                height: Math.max(4, size * 0.1),
                background: particleColors[i],
                '--tx': p.tx,
                '--ty': p.ty,
                '--rot': p.rot,
                marginTop: -(Math.max(4, size * 0.1)) / 2,
                marginLeft: -(Math.max(4, size * 0.1)) / 2,
              } as React.CSSProperties
            }
          />
        ))}

      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
        animate={
          !disabled && checked
            ? { scale: [1, 1.3, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Background circle */}
        <AnimatePresence initial={false}>
          {checked ? (
            <motion.circle
              key="filled"
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          ) : (
            <motion.circle
              key="outline"
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={hexToRgba(color, 0.4)}
              strokeWidth={strokeWidth}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Checkmark */}
        <AnimatePresence>
          {checked && (
            <motion.path
              key="check"
              d={`M ${checkInset} ${cy} L ${cx - size * 0.04} ${size - checkInset - size * 0.04} L ${size - checkInset} ${checkInset + size * 0.04}`}
              stroke="white"
              strokeWidth={strokeWidth * 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </motion.svg>

      <style>{`
        @keyframes habit-confetti {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}

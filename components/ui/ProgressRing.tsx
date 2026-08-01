'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export default function ProgressRing({
  percentage,
  size = 60,
  strokeWidth = 5,
  color = 'var(--accent-primary)',
  label,
}: ProgressRingProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPct / 100) * circumference;
  const center = size / 2;
  const fontSize = size < 50 ? 10 : size < 80 ? 12 : 14;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${clampedPct}% progress`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="origin-center -rotate-90"
      />
      {/* Center label */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize={fontSize}
        fontWeight={600}
        fontFamily="'Outfit', sans-serif"
      >
        {label ?? `${Math.round(clampedPct)}%`}
      </text>
    </svg>
  );
}

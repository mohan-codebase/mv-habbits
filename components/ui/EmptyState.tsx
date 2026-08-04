'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface EmptyStateProps {
  /** Icon illustration — pass a Lucide icon element */
  icon: React.ReactNode;
  /** Bold headline */
  title: string;
  /** Softer explanation text — 1–2 sentences */
  description: string;
  /** Optional primary CTA */
  cta?: React.ReactNode;
  /** Optional secondary link / text below CTA */
  hint?: React.ReactNode;
  /** Accent colour used for the glow ring (default: var(--accent-primary)) */
  accentColor?: string;
  /** Compact variant — less vertical padding */
  compact?: boolean;
}

/**
 * Reusable premium empty state.
 * Animates in from below on first render.
 */
export default function EmptyState({
  icon,
  title,
  description,
  cta,
  hint,
  accentColor = 'var(--accent-primary)',
  compact = false,
}: EmptyStateProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'gap-3 py-9' : 'gap-4 py-16'}`}
    >
      {/* Emoji illustration with glow ring */}
      <div className={`relative ${compact ? 'mb-0.5' : 'mb-1.5'}`}>
        {/* Outer glow ring */}
        <div
          className="pointer-events-none absolute -inset-2 rounded-full"
          style={{ background: `${accentColor}18` }}
        />

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`relative flex items-center justify-center shadow-none ${compact ? 'h-[52px] w-[52px] rounded-[16px]' : 'h-[72px] w-[72px] rounded-[20px]'}`}
          style={{
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          {icon}
        </motion.div>
      </div>

      {/* Text */}
      <div className={`flex max-w-[300px] flex-col ${compact ? 'gap-[5px]' : 'gap-2'}`}>
        <h3 className={`m-0 font-bold tracking-[-0.02em] text-text-primary ${compact ? 'text-lg' : 'text-[18px]'}`}>
          {title}
        </h3>
        <p className={`m-0 leading-[1.65] text-text-muted ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
          {description}
        </p>
      </div>

      {/* CTA */}
      {cta && (
        <div className={compact ? 'mt-1' : 'mt-2'}>
          {cta}
        </div>
      )}

      {/* Hint text */}
      {hint && (
        <p className="m-0 max-w-[260px] text-[12px] leading-normal text-text-dimmed">
          {hint}
        </p>
      )}
    </motion.div>
  );
}

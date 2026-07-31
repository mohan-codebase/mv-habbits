import React from 'react';

type SkeletonVariant = 'text' | 'rect' | 'circle';

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  style?: React.CSSProperties;
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<SkeletonVariant, React.CSSProperties> = {
  text: {
    height: '14px',
    borderRadius: '4px',
    width: '100%',
  },
  rect: {
    height: '80px',
    borderRadius: '12px',
    width: '100%',
  },
  circle: {
    height: '40px',
    width: '40px',
    borderRadius: 'var(--r-pill)',
  },
};

export default function Skeleton({ className = '', variant = 'text', style: customStyle }: SkeletonProps) {
  return (
    <div
      className={`shimmer ${className}`}
      style={{ ...variantStyles[variant], ...customStyle }}
      aria-hidden="true"
    />
  );
}

export function SkeletonGroup({ children, className = '' }: SkeletonGroupProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
}

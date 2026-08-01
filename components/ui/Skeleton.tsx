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

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-[14px] w-full rounded-[4px]',
  rect: 'h-[80px] w-full rounded-[12px]',
  circle: 'h-10 w-10 rounded-full',
};

export default function Skeleton({ className = '', variant = 'text', style: customStyle }: SkeletonProps) {
  return (
    <div
      className={`shimmer ${variantClasses[variant]} ${className}`}
      style={customStyle}
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

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Check } from 'lucide-react';

interface SwipeToCompleteProps {
  completed: boolean;
  onToggle: (completed: boolean) => void;
  color?: string;
  label?: string;
  completedLabel?: string;
  disabled?: boolean;
  height?: number;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function SwipeToComplete({
  completed,
  onToggle,
  color = '#22c55e',
  label = 'slide to complete',
  completedLabel = 'completed',
  disabled = false,
  height = 52,
  icon,
  className,
  style,
}: SwipeToCompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  const padding = 5;
  const thumbSize = height - padding * 2;

  const updateMaxDrag = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const available = rect.width - thumbSize - padding * 2;
      setMaxDrag(Math.max(0, available));
    }
  }, [thumbSize]);

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, [updateMaxDrag]);

  // Snap x to the correct position when completed state changes
  useEffect(() => {
    if (completed && maxDrag > 0) {
      animate(x, maxDrag, { type: 'spring', stiffness: 380, damping: 28 });
    } else if (!completed) {
      animate(x, 0, { type: 'spring', stiffness: 380, damping: 28 });
    }
  }, [completed, maxDrag, x]);

  // Fade out shimmer text as thumb is dragged right
  const textOpacity = useTransform(x, [0, (maxDrag || 1) * 0.45], [1, 0]);
  // Track fill width — must be at top level (Rules of Hooks)
  const fillWidth = useTransform(x, (val) => `${val + thumbSize + padding * 2}px`);

  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled) return;
    setIsDragging(false);
    const currentX = x.get();
    const threshold = maxDrag * 0.58;

    if (!completed && (currentX >= threshold || info.velocity.x > 250)) {
      onToggle(true);
    } else if (completed && (currentX <= maxDrag - threshold || info.velocity.x < -250)) {
      onToggle(false);
    } else {
      animate(x, completed ? maxDrag : 0, { type: 'spring', stiffness: 450, damping: 28 });
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isDragging) return;
    onToggle(!completed);
  };

  // Resolve icon color for thumb (for CSS vars, default to green)
  const iconColor = color.startsWith('#') || color.startsWith('rgb') ? color : '#22c55e';

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 9999,
        background: completed
          ? `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 72%, #000) 100%)`
          : 'rgba(50, 48, 45, 0.58)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: completed
          ? `1.5px solid rgba(255,255,255,0.28)`
          : '1.5px solid rgba(255, 255, 255, 0.18)',
        boxShadow: completed
          ? `0 6px 20px ${iconColor}55, inset 0 1px 1px rgba(255,255,255,0.35)`
          : 'inset 0 1.5px 3px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.35s ease, border 0.35s ease, box-shadow 0.35s ease',
        ...style,
      }}
    >
      {/* Swipe progress glow fill */}
      {!completed && (
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: fillWidth,
            background: `linear-gradient(90deg, rgba(255,255,255,0.04) 0%, ${iconColor}66 100%)`,
            borderRadius: 9999,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Shimmer text (uncompleted state) — uses CSS class for keyframes */}
      {!completed && (
        <motion.span
          className="ios-shimmer-text"
          style={{
            opacity: textOpacity,
            paddingLeft: thumbSize * 0.5,
          }}
        >
          {label}
        </motion.span>
      )}

      {/* Completed label */}
      {completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            fontSize: 15,
            fontWeight: 700,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            color: '#ffffff',
            pointerEvents: 'none',
            letterSpacing: '-0.01em',
            textTransform: 'lowercase',
          }}
        >
          <span>{completedLabel}</span>
          <Check size={18} strokeWidth={3} />
        </motion.div>
      )}

      {/* White circular knob (Apple iPhone style) */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          x,
          position: 'absolute',
          left: padding,
          top: padding,
          width: thumbSize,
          height: thumbSize,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow:
            '0 4px 14px rgba(0,0,0,0.38), inset 0 -1px 2px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          zIndex: 10,
          touchAction: 'none',
          flexShrink: 0,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        {icon ?? (
          <Check
            size={Math.round(thumbSize * 0.52)}
            style={{ color: iconColor }}
            strokeWidth={3}
          />
        )}
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  style,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const activeOption = opts.find((o) => o.value === value);
  const activeLabel = activeOption ? activeOption.label : (placeholder || value);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Backdrop overlay to close when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[49] cursor-default bg-transparent"
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-full bg-bg-tertiary py-[9px] pr-2.5 pl-3 text-left text-[13.5px] text-text-primary shadow-none outline-none transition-[border-color,box-shadow] duration-150 cursor-pointer"
        style={{ border: `1px solid ${isOpen ? 'var(--border-active)' : 'var(--border-subtle)'}`, ...style }}
      >
        <span className="truncate">
          {activeLabel}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1.5 inline-flex shrink-0 items-center text-text-muted"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-[calc(100%_+_6px)] left-0 right-0 z-50 max-h-[220px] overflow-y-auto rounded-[12px] border border-border-medium bg-bg-glass-strong p-1.5 shadow-none [backdrop-filter:none] [-webkit-backdrop-filter:none]"
          >
            {opts.map((o) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-sm border-none py-2 px-3 text-left text-[13px] cursor-pointer transition-colors duration-150 ${isSelected ? 'font-semibold' : 'font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
                  style={isSelected ? { background: 'var(--accent-glow-md)', color: 'var(--accent-light)' } : undefined}
                >
                  <span>{o.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

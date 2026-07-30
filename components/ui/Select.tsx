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

const controlBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13.5,
  color: 'var(--text-primary)',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 9999,
  outline: 'none',
};

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
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      {/* Backdrop overlay to close when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 49,
            cursor: 'default',
            background: 'transparent',
          }}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...controlBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          paddingRight: '10px',
          borderColor: isOpen ? 'var(--border-active)' : 'var(--border-subtle)',
          boxShadow: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeLabel}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
            marginLeft: 6,
            flexShrink: 0,
          }}
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
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 50,
              background: 'var(--bg-glass-strong)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1px solid var(--border-medium)',
              borderRadius: 12,
              boxShadow: 'none',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '6px',
            }}
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
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    textAlign: 'left',
                    borderRadius: 8,
                    border: 'none',
                    background: isSelected ? 'var(--accent-glow-md)' : 'transparent',
                    color: isSelected ? 'var(--accent-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
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

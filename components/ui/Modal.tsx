'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnOutsideClick?: boolean;
}

const sizeMap: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
};

const CloseIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M4 4l10 10M14 4L4 14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOutsideClick = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap and ESC key dismiss
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => !el.closest('[aria-hidden="true"]'));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', trapFocus);

    // Focus first focusable element inside modal
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(focusableSelectors);
      if (first) {
        first.focus();
      } else {
        panel.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', trapFocus);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeOnOutsideClick ? onClose : undefined}
          className="hf-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            key="modal-panel"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`hf-modal-panel w-full max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--glass-bg)] shadow-none outline-none ${sizeMap[size]}`}
          >
            {/* Header */}
            {(title !== undefined) && (
              <div className="flex items-center justify-between border-b border-border-subtle pt-5 px-6 pb-4">
                <h2 id="modal-title" className="m-0 text-[17px] font-semibold text-text-primary">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-none bg-transparent text-text-muted transition-colors duration-150 cursor-pointer hover:bg-bg-tertiary hover:text-text-primary"
                >
                  <CloseIcon />
                </button>
              </div>
            )}

            {/* Body */}
            <div className={title !== undefined ? 'pt-5 px-6 pb-6' : 'p-6'}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

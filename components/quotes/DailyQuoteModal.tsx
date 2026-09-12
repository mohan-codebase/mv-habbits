'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkCheck, Copy, Check, ArrowRight, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import {
  Quote,
  getTodayQuote,
  hasModalBeenShownToday,
  markModalShownToday,
  isQuoteSaved,
  toggleSaveQuote,
} from '@/lib/quotes';
import { showToast } from '@/components/ui/Toast';

interface DailyQuoteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoShowOnDailyVisit?: boolean;
}

export default function DailyQuoteModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  autoShowOnDailyVisit = true,
}: DailyQuoteModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [todayQuote, setTodayQuote] = useState<Quote | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const q = getTodayQuote();
    setTodayQuote(q);
    setSaved(isQuoteSaved(q.id));

    if (autoShowOnDailyVisit && !hasModalBeenShownToday()) {
      const timer = setTimeout(() => {
        setInternalIsOpen(true);
        markModalShownToday();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoShowOnDailyVisit]);

  useEffect(() => {
    const handleGlobalTrigger = () => {
      const q = getTodayQuote();
      setTodayQuote(q);
      setSaved(isQuoteSaved(q.id));
      setInternalIsOpen(true);
    };

    window.addEventListener('productivity-master:open-daily-quote', handleGlobalTrigger);
    return () => {
      window.removeEventListener('productivity-master:open-daily-quote', handleGlobalTrigger);
    };
  }, []);

  useEffect(() => {
    const handleQuotesUpdated = () => {
      if (todayQuote) {
        setSaved(isQuoteSaved(todayQuote.id));
      }
    };
    window.addEventListener('productivity-master:quotes-updated', handleQuotesUpdated);
    return () => {
      window.removeEventListener('productivity-master:quotes-updated', handleQuotesUpdated);
    };
  }, [todayQuote]);

  const modalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleToggleSave = () => {
    if (!todayQuote) return;
    const nowSaved = toggleSaveQuote(todayQuote.id);
    setSaved(nowSaved);
    if (nowSaved) {
      showToast('Saved quote to your Quotes tab', 'success');
    } else {
      showToast('Removed from saved quotes', 'info');
    }
  };

  const handleCopy = () => {
    if (!todayQuote) return;
    const textToCopy = `"${todayQuote.quote}" — ${todayQuote.author}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Quote copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!todayQuote) return null;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <AnimatePresence>
      {modalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Minimal Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur-xl p-6"
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Daily Quote • {formattedDate}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer border-0"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Clean Quote Text */}
            <div className="my-3">
              <p className="text-lg font-normal leading-relaxed text-slate-100 tracking-tight">
                &ldquo;{todayQuote.quote}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300">— {todayQuote.author}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium capitalize">
                  {todayQuote.category}
                </span>
              </div>
            </div>

            {/* Clean Action Toolbar */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 ${
                    saved
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {saved ? <BookmarkCheck size={14} className="text-purple-400 fill-purple-400" /> : <Bookmark size={14} />}
                  <span>{saved ? 'Saved' : 'Save for later'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium transition-colors cursor-pointer border-0"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <Link
                href="/dashboard/quotes"
                onClick={handleClose}
                className="flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors no-underline"
              >
                <span>All quotes</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

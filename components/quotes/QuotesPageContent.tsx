'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Search,
  History,
  BookOpen,
  Share2,
  Filter,
} from 'lucide-react';
import {
  Quote,
  MOTIVATIONAL_QUOTES,
  getTodayQuote,
  getSavedQuoteIds,
  getDailyQuoteHistory,
  toggleSaveQuote,
} from '@/lib/quotes';
import { showToast } from '@/components/ui/Toast';

type TabType = 'today' | 'saved' | 'history' | 'library';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'motivation', label: 'Motivation' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'mindset', label: 'Mindset' },
  { id: 'success', label: 'Success' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'focus', label: 'Focus' },
  { id: 'mindfulness', label: 'Mindfulness' },
];

export default function QuotesPageContent() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [todayQuote, setTodayQuote] = useState<Quote | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ date: string; quote: Quote }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setTodayQuote(getTodayQuote());
    setSavedIds(getSavedQuoteIds());
    setHistory(getDailyQuoteHistory());
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setSavedIds(getSavedQuoteIds());
      setHistory(getDailyQuoteHistory());
    };
    window.addEventListener('productivity-master:quotes-updated', handleSync);
    return () => {
      window.removeEventListener('productivity-master:quotes-updated', handleSync);
    };
  }, []);

  const handleToggleSave = (id: string) => {
    const isSaved = toggleSaveQuote(id);
    setSavedIds(getSavedQuoteIds());
    if (isSaved) {
      showToast('Saved quote for later', 'success');
    } else {
      showToast('Removed from saved quotes', 'info');
    }
  };

  const handleCopy = (quote: Quote) => {
    const text = `"${quote.quote}" — ${quote.author}`;
    navigator.clipboard.writeText(text);
    setCopiedId(quote.id);
    showToast('Quote copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (quote: Quote) => {
    const text = `"${quote.quote}" — ${quote.author}`;
    if (navigator.share) {
      navigator.share({ title: 'Quote', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast('Quote copied to clipboard', 'success');
    }
  };

  const handleOpenModal = () => {
    window.dispatchEvent(new CustomEvent('productivity-master:open-daily-quote'));
  };

  const filteredQuotes = useMemo(() => {
    let list: Quote[] = [];

    if (activeTab === 'today') {
      list = todayQuote ? [todayQuote] : [];
    } else if (activeTab === 'saved') {
      list = MOTIVATIONAL_QUOTES.filter((q) => savedIds.includes(q.id));
    } else if (activeTab === 'history') {
      list = history.map((item) => item.quote);
    } else {
      list = MOTIVATIONAL_QUOTES;
    }

    if (selectedCategory !== 'all') {
      list = list.filter((q) => q.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      list = list.filter(
        (q) =>
          q.quote.toLowerCase().includes(qLower) ||
          q.author.toLowerCase().includes(qLower) ||
          q.category.toLowerCase().includes(qLower)
      );
    }

    return list;
  }, [activeTab, todayQuote, savedIds, history, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Minimal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] m-0">
              Quotes & Wisdom
            </h1>
            <p className="text-xs text-[var(--text-muted)] m-0 mt-1">
              Daily motivation & saved inspiration stored for later.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Open Daily Pop-up</span>
          </button>
        </div>

        {/* Minimal Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 ${
                activeTab === 'today'
                  ? 'bg-purple-600/20 text-purple-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Sparkles size={14} />
              <span>Today</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 ${
                activeTab === 'saved'
                  ? 'bg-purple-600/20 text-purple-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Bookmark size={14} />
              <span>Saved ({savedIds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 ${
                activeTab === 'history'
                  ? 'bg-purple-600/20 text-purple-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <History size={14} />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 ${
                activeTab === 'library'
                  ? 'bg-purple-600/20 text-purple-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <BookOpen size={14} />
              <span>Library</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Minimal Category Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <Filter size={13} className="text-[var(--text-muted)] shrink-0 ml-0.5" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-purple-500/15 text-purple-400 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Minimal Card Grid */}
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)]">
            <Bookmark size={24} className="text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)] m-0">
              {activeTab === 'saved' ? 'No saved quotes yet.' : 'No matching quotes found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuotes.map((quote) => {
              const saved = savedIds.includes(quote.id);
              const copied = copiedId === quote.id;

              return (
                <motion.div
                  key={quote.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--border-medium)] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {quote.category}
                      </span>
                      <button
                        onClick={() => handleToggleSave(quote.id)}
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-purple-400 transition-colors cursor-pointer border-0 bg-transparent"
                        title={saved ? 'Remove from saved' : 'Save for later'}
                      >
                        {saved ? <BookmarkCheck size={16} className="text-purple-400 fill-purple-400" /> : <Bookmark size={16} />}
                      </button>
                    </div>

                    <p className="text-sm font-normal leading-relaxed text-[var(--text-primary)] m-0">
                      &ldquo;{quote.quote}&rdquo;
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-400">— {quote.author}</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(quote)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-0 bg-transparent"
                        title="Copy quote"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => handleShare(quote)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border-0 bg-transparent"
                        title="Share quote"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

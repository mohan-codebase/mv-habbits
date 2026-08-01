'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, CheckSquare, BarChart2, Trophy, Settings, Plus, X, Target, NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface HabitHit {
  id: string;
  name: string;
  color: string | null;
}

export default function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [habits, setHabits] = useState<HabitHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/habits');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && Array.isArray(json?.data)) {
          setHabits(
            (json.data as { id: string; name: string; color: string | null }[]).map((h) => ({
              id: h.id,
              name: h.name,
              color: h.color,
            }))
          );
        }
      } catch {
        /* silently ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  const habitCommands: Command[] = habits.map((h) => ({
    id: `habit-${h.id}`,
    label: h.name,
    description: 'Open habit details',
    icon: (
      <Target
        size={16}
        color={h.color ?? 'var(--accent-primary)'}
      />
    ),
    action: () => navigate(`/dashboard/habits/${h.id}`),
    keywords: ['habit', h.name.toLowerCase()],
  }));

  const commands: Command[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Go to your main dashboard',
      icon: <LayoutDashboard size={16} />,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'overview'],
    },
    {
      id: 'notes',
      label: 'Notes & Journal',
      description: 'View and manage all habit notes',
      icon: <NotebookPen size={16} />,
      action: () => navigate('/dashboard/notes'),
      keywords: ['notes', 'journal', 'log', 'entries'],
    },
    {
      id: 'habits',
      label: 'My Habits',
      description: 'Manage all your habits',
      icon: <CheckSquare size={16} />,
      action: () => navigate('/dashboard/habits'),
      keywords: ['manage', 'list', 'all'],
    },
    {
      id: 'new-habit',
      label: 'New Habit',
      description: 'Create a new habit',
      icon: <Plus size={16} />,
      action: () => {
        // Signal TodayHabits to open form — it picks this up on mount / focus
        localStorage.setItem('productivity_master_open_form', '1');
        navigate('/dashboard');
      },
      keywords: ['add', 'create', 'track'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View your habit analytics',
      icon: <BarChart2 size={16} />,
      action: () => navigate('/dashboard/analytics'),
      keywords: ['charts', 'stats', 'insights', 'data'],
    },
    {
      id: 'achievements',
      label: 'Achievements',
      description: 'View your badges and milestones',
      icon: <Trophy size={16} />,
      action: () => navigate('/dashboard/achievements'),
      keywords: ['badges', 'milestones', 'awards'],
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Manage your preferences',
      icon: <Settings size={16} />,
      action: () => navigate('/dashboard/settings'),
      keywords: ['preferences', 'profile', 'account', 'export'],
    },
  ];

  const allCommands = [...commands, ...habitCommands];

  const filtered = query.trim()
    ? allCommands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selected]?.action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selected, onClose]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-[100]"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-[16vh] left-1/2 -translate-x-1/2 w-full max-w-[560px] px-4 z-[101]"
          >
            <div className="bg-bg-secondary border border-border-subtle rounded-2xl shadow-none overflow-hidden">
              {/* Search bar */}
              <div className="flex items-center gap-3 px-4 py-[14px] border-b border-border-subtle">
                <Search size={17} color="var(--text-muted)" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands or navigate..."
                  className="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary font-['IBM_Plex_Sans',sans-serif]"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-transparent border-none cursor-pointer text-text-muted flex p-0.5"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Commands list */}
              <div ref={listRef} className="max-h-[340px] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-[13px] text-text-muted py-6 px-0 m-0">
                    No commands found
                  </p>
                ) : (
                  filtered.map((cmd, idx) => {
                    const isSelected = idx === selected;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        data-idx={idx}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={cmd.action}
                        className={`w-full flex items-center gap-3 px-3 py-[10px] rounded-md border-none cursor-pointer text-left transition-colors duration-100 ${
                          isSelected ? 'bg-bg-tertiary' : 'bg-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border transition-all duration-100 ${
                            isSelected
                              ? 'bg-[var(--accent-glow)] border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)] text-accent-primary'
                              : 'bg-bg-tertiary border-border-subtle text-text-muted'
                          }`}
                        >
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`mt-0 mx-0 mb-px text-[13px] font-semibold ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p className="m-0 text-xs text-text-muted">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <kbd className="text-[10px] text-text-muted bg-bg-secondary border border-border-subtle rounded px-[6px] py-0.5 shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border-subtle flex gap-3">
                {[
                  { key: '↑↓', label: 'navigate' },
                  { key: '↵', label: 'select' },
                  { key: 'esc', label: 'close' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1">
                    <kbd className="text-[10px] text-text-muted bg-bg-tertiary border border-border-subtle rounded px-[5px] py-px">
                      {key}
                    </kbd>
                    <span className="text-xs text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0,0.6)',
              zIndex: 100,
            }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: '16vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 560,
              padding: '0 16px',
              zIndex: 101,
            }}
          >
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                boxShadow: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Search bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Search size={17} color="var(--text-muted)" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands or navigate..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 15,
                    color: 'var(--text-primary)',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    padding: 2,
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Commands list */}
              <div ref={listRef} style={{ maxHeight: 340, overflowY: 'auto', padding: 8 }}>
                {filtered.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '24px 0', margin: 0 }}>
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
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: 'none',
                          background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: isSelected ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                            border: isSelected ? '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' : '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                            flexShrink: 0,
                            transition: 'all 0.1s ease',
                          }}
                        >
                          {cmd.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <kbd
                            style={{
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 4,
                              padding: '2px 6px',
                              flexShrink: 0,
                            }}
                          >
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '8px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: 12,
                }}
              >
                {[
                  { key: '↑↓', label: 'navigate' },
                  { key: '↵', label: 'select' },
                  { key: 'esc', label: 'close' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        padding: '1px 5px',
                      }}
                    >
                      {key}
                    </kbd>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
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

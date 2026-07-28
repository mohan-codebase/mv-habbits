'use client';

import React, { useState, useCallback, useEffect, useTransition } from 'react';
import { Plus, CalendarClock, Zap, ChevronDown, ChevronUp, Ban } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { HabitWithEntry, Habit, HabitEntry, Category } from '@/types/habit';
import HabitList from '@/components/habits/HabitList';
import HabitForm from '@/components/habits/HabitForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { todayString } from '@/lib/utils/dates';
import { useRealtimeEntries } from '@/lib/hooks/useRealtimeEntries';
import { createClient } from '@/lib/supabase/client';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import EmptyState from '@/components/ui/EmptyState';

const ONBOARDING_KEY = 'hf_onboarding_done';

interface TodayHabitsProps {
  habits: HabitWithEntry[];
  loading: boolean;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return format(d, 'yyyy-MM-dd');
}

interface BackfillRow {
  habit_id: string;
  is_completed: boolean;
  notes: string;
  initial_completed: boolean;
  initial_notes: string;
}

export default function TodayHabits({ habits: initialHabits, loading }: TodayHabitsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [habits, setHabits] = useState<HabitWithEntry[]>(initialHabits);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Backfill modal state — log/edit habits for a past day
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillDate, setBackfillDate] = useState<string>(yesterdayString());
  const [backfillRows, setBackfillRows] = useState<BackfillRow[]>([]);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillSaving, setBackfillSaving] = useState(false);
  const todayStr = todayString();

  // Resolve signed-in user + check if onboarding should show
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setUserId(user?.id ?? null);
      // Extract display name from metadata
      const name =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0];
      setUserName(name);
    });
  }, []);

  // Auto-open onboarding for brand-new users (no habits + flag not set)
  useEffect(() => {
    if (loading) return;
    if (initialHabits.length > 0) return;
    try {
      if (localStorage.getItem(ONBOARDING_KEY) !== '1') {
        setOnboardingOpen(true);
      }
    } catch {
      // localStorage blocked (private mode, etc.) — skip silently
    }
  }, [loading, initialHabits.length]);

  // Realtime: patch local state when a habit_entry for today changes upstream
  const rtStatus = useRealtimeEntries({
    userId,
    entryDate: todayString(),
    onEntryChange: (entry) => {
      setHabits((prev) =>
        prev.map((h) => (h.id === entry.habit_id ? { ...h, todayEntry: entry } : h))
      );
      // Background refresh to update stats cards
      startTransition(() => {
        router.refresh();
      });
    },
  });

  // Listen for global add-habit signal from Topbar / Command Palette
  useEffect(() => {
    const open = () => {
      setEditingHabit(null);
      setFormOpen(true);
    };
    const checkStorage = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('productivity_master_open_form') === '1') {
        localStorage.removeItem('productivity_master_open_form');
        open();
      }
    };
    checkStorage();
    window.addEventListener('productivity-master:open-add', open);
    window.addEventListener('focus', checkStorage);
    return () => {
      window.removeEventListener('productivity-master:open-add', open);
      window.removeEventListener('focus', checkStorage);
    };
  }, []);

  // Sync prop changes
  useEffect(() => {
    setHabits(initialHabits);
  }, [initialHabits]);

  // Fetch categories for the form
  const loadCategories = useCallback(async () => {
    try {
      setCategoryError(false);
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        setCategories(json.data as Category[]);
      }
    } catch {
      setCategoryError(true);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleToggle = useCallback(async (habitId: string, completed: boolean) => {
    const today = todayString();

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              todayEntry: h.todayEntry
                ? { ...h.todayEntry, is_completed: completed }
                : ({
                    id: `temp-${habitId}`,
                    habit_id: habitId,
                    user_id: '',
                    entry_date: today,
                    is_completed: completed,
                    value: null,
                    notes: null,
                    video_path: null,
                    completed_at: completed ? new Date().toISOString() : null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  } satisfies HabitEntry),
            }
          : h
      )
    );

    try {
      const res = await fetch('/api/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habitId,
          entry_date: today,
          is_completed: completed,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  todayEntry: h.todayEntry
                    ? { ...h.todayEntry, is_completed: !completed }
                    : null,
                }
              : h
          )
        );
      } else {
        const json = await res.json();
        const updated = json.data as HabitEntry;
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, todayEntry: updated } : h))
        );
        // Background refresh to update dashboard stats/charts
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      // Revert on network error
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                todayEntry: h.todayEntry
                  ? { ...h.todayEntry, is_completed: !completed }
                  : null,
              }
            : h
        )
      );
    }
  }, [router]);

  const handleEdit = useCallback((habit: HabitWithEntry) => {
    setEditingHabit(habit);
    setFormOpen(true);
  }, []);

  // Load entries for chosen backfill date and prefill rows
  useEffect(() => {
    if (!backfillOpen) return;
    let cancelled = false;
    (async () => {
      setBackfillLoading(true);
      try {
        const res = await fetch(`/api/entries?date=${backfillDate}`);
        const json = await res.json();
        const existing = (json?.data ?? []) as HabitEntry[];
        if (cancelled) return;
        const byHabit = new Map(existing.map((e) => [e.habit_id, e]));
        setBackfillRows(
          habits.map((h) => {
            const e = byHabit.get(h.id);
            return {
              habit_id: h.id,
              is_completed: e?.is_completed ?? false,
              notes: e?.notes ?? '',
              initial_completed: e?.is_completed ?? false,
              initial_notes: e?.notes ?? '',
            };
          })
        );
      } catch {
        if (!cancelled) {
          setBackfillRows(
            habits.map((h) => ({
              habit_id: h.id,
              is_completed: false,
              notes: '',
              initial_completed: false,
              initial_notes: '',
            }))
          );
        }
      } finally {
        if (!cancelled) setBackfillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backfillOpen, backfillDate, habits]);

  const openBackfill = () => {
    setBackfillDate(yesterdayString());
    setBackfillOpen(true);
  };

  const closeBackfill = () => {
    if (backfillSaving) return;
    setBackfillOpen(false);
  };

  const setBackfillRow = (habitId: string, patch: Partial<BackfillRow>) => {
    setBackfillRows((prev) =>
      prev.map((r) => (r.habit_id === habitId ? { ...r, ...patch } : r))
    );
  };

  const saveBackfill = async () => {
    const changed = backfillRows.filter(
      (r) => r.is_completed !== r.initial_completed || r.notes !== r.initial_notes
    );
    if (changed.length === 0) {
      setBackfillOpen(false);
      return;
    }
    setBackfillSaving(true);
    try {
      const results = await Promise.all(
        changed.map((r) =>
          fetch('/api/entries', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              habit_id: r.habit_id,
              entry_date: backfillDate,
              is_completed: r.is_completed,
              notes: r.notes.trim() || null,
            }),
          }).then((res) => res.ok)
        )
      );
      const failed = results.filter((ok) => !ok).length;
      if (failed > 0) {
        toast(`${failed} entr${failed === 1 ? 'y' : 'ies'} failed to save`, 'error');
      } else {
        toast(`Saved ${changed.length} entr${changed.length === 1 ? 'y' : 'ies'}`, 'success');
      }
      setBackfillOpen(false);
      window.dispatchEvent(new Event('productivity-master:habit-mutated'));
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast('Failed to save backfill', 'error');
    } finally {
      setBackfillSaving(false);
    }
  };

  const handleArchive = useCallback(async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    await fetch(`/api/habits/${habitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: true }),
    });
    window.dispatchEvent(new Event('productivity-master:habit-mutated'));
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const handleDelete = useCallback((habitId: string) => {
    setDeleteTarget(habitId);
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/habits/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        setHabits((prev) => prev.filter((h) => h.id !== deleteTarget));
        window.dispatchEvent(new Event('productivity-master:habit-mutated'));
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      /* silently ignore */
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = (savedHabit: Habit) => {
    setHabits((prev) => {
      const exists = prev.some((h) => h.id === savedHabit.id);
      if (exists) {
        return prev.map((h) =>
          h.id === savedHabit.id ? { ...h, ...savedHabit } : h
        );
      }
      return [
        ...prev,
        { ...savedHabit, todayEntry: null, completionRate: 0 },
      ];
    });
    setFormOpen(false);
    setEditingHabit(null);
    window.dispatchEvent(new Event('productivity-master:habit-mutated'));
    startTransition(() => {
      router.refresh();
    });
  };

  // ── Onboarding handlers ──────────────────────────────────────
  const dismissOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    setOnboardingOpen(false);
  };

  const handleOnboardingComplete = (newHabit: Habit) => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    setOnboardingOpen(false);
    // Inject the new habit into local state immediately (no server round-trip wait)
    setHabits((prev) => [
      ...prev,
      { ...newHabit, todayEntry: null, completionRate: 0 },
    ]);
    window.dispatchEvent(new Event('productivity-master:habit-mutated'));
    router.refresh();
  };

  const goodHabits = habits.filter((h) => !h.is_bad_habit);
  const badHabits  = habits.filter((h) => h.is_bad_habit);
  const completedCount = goodHabits.filter((h) => h.todayEntry?.is_completed).length;
  const avoidedCount   = badHabits.filter((h) => h.todayEntry?.is_completed).length;
  const today = format(new Date(), 'EEEE, MMMM d');

  const deleteHabitName = habits.find((h) => h.id === deleteTarget)?.name;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Onboarding wizard — auto-shows for first-time users */}
      {onboardingOpen && (
        <OnboardingWizard
          userName={userName}
          onComplete={handleOnboardingComplete}
          onDismiss={dismissOnboarding}
        />
      )}
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Today&apos;s Habits
          </h2>

          {/* Count badge */}
          {!loading && (
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--accent-glow)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {completedCount} / {goodHabits.length}
            </span>
          )}
          {!loading && badHabits.length > 0 && (
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 'var(--r-pill)',
                background: 'rgba(104, 104, 104,0.10)',
                border: '1px solid rgba(104, 104, 104,0.25)',
                color: '#8e8e8e',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ban size={12} style={{ display: 'inline', marginRight: 2 }} /> {avoidedCount}/{badHabits.length} avoided
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LiveIndicator status={rtStatus} />

          <span
            className="hidden sm:inline"
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {today}
          </span>

          <Button
            variant="ghost"
            size="sm"
            icon={<CalendarClock size={14} />}
            onClick={openBackfill}
            disabled={habits.length === 0}
          >
            <span className="hidden sm:inline">Past day</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              setEditingHabit(null);
              setFormOpen(true);
            }}
          >
            <span className="hidden sm:inline">Add Habit</span>
          </Button>
        </div>
      </div>

      {/* Completion progress bar */}
      {!loading && habits.length > 0 && (
        <div style={{
          width: '100%',
          height: 5,
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--r-pill)',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0}%`,
              background: completedCount === habits.length
                ? 'linear-gradient(90deg, var(--accent-primary), var(--accent-light))'
                : 'var(--accent-primary)',
              borderRadius: 'var(--r-pill)',
              transition: 'width 0.5s ease, background 0.3s ease',
              boxShadow: completedCount === habits.length ? '0 0 8px var(--accent-primary)' : 'none',
            }}
          />
        </div>
      )}

      {/* Habit list */}
      {!loading && habits.length === 0 ? (
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
        }}>
          <EmptyState
            icon={<Zap size={34} color="var(--accent-primary)" />}
            title="No habits tracked today"
            description="You don't have any habits set up yet. Build your first routine — even one habit changes everything."
            accentColor="var(--accent-primary)"
            cta={
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingHabit(null);
                  setFormOpen(true);
                }}
              >
                Create first habit
              </Button>
            }
            hint="Tip: Start small. A 5-minute habit is infinitely better than no habit."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <HabitList
            habits={showAllHabits ? habits : habits.slice(0, 2)}
            loading={loading}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
          {habits.length > 2 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAllHabits(!showAllHabits)}
              fullWidth
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {showAllHabits ? 'Show less' : `Show all habits (${habits.length})`}
                {showAllHabits ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </Button>
          )}
        </div>
      )}

      {/* HabitForm modal */}
      {formOpen && (
        <HabitForm
          habit={editingHabit ?? undefined}
          categories={categories}
          categoryError={categoryError}
          onRetryCategories={loadCategories}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setFormOpen(false);
            setEditingHabit(null);
          }}
        />
      )}

      {/* Backfill past day modal */}
      <Modal
        isOpen={backfillOpen}
        onClose={closeBackfill}
        title={
          backfillDate
            ? `Log past day · ${format(parseISO(backfillDate), 'EEE, MMM d yyyy')}`
            : 'Log past day'
        }
        size="md"
        closeOnOutsideClick={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Date
            </label>
            <input
              type="date"
              value={backfillDate}
              max={todayStr}
              onChange={(e) => setBackfillDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 360,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {backfillLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '12px 0' }}>
                Loading entries…
              </p>
            ) : backfillRows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '12px 0' }}>
                No habits to log.
              </p>
            ) : (
              backfillRows.map((row) => {
                const habit = habits.find((h) => h.id === row.habit_id);
                if (!habit) return null;
                return (
                  <div
                    key={row.habit_id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: '12px 14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={row.is_completed}
                        onChange={(e) =>
                          setBackfillRow(row.habit_id, { is_completed: e.target.checked })
                        }
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: habit.color ?? 'var(--accent-primary)',
                        }}
                      />
                      {habit.name}
                    </label>
                    <input
                      type="text"
                      value={row.notes}
                      maxLength={1000}
                      onChange={(e) => setBackfillRow(row.habit_id, { notes: e.target.value })}
                      placeholder="Notes (optional)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        color: 'var(--text-secondary)',
                        fontSize: 12.5,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={closeBackfill} disabled={backfillSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={backfillSaving}
              disabled={backfillLoading}
              onClick={saveBackfill}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Habit"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {deleteHabitName}
            </strong>
            ? This will remove all its history and cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function LiveIndicator({ status }: { status: 'connecting' | 'live' | 'offline' }) {
  const color =
    status === 'live' ? 'var(--accent-primary)'
    : status === 'connecting' ? 'var(--warm)'
    : 'var(--text-dimmed)';
  const label =
    status === 'live' ? 'Live'
    : status === 'connecting' ? 'Sync'
    : 'Offline';
  return (
    <span
      title={`Realtime: ${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-default)',
        fontSize: 10.5,
        fontWeight: 600,
        color: 'var(--text-muted)',
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '0.04em',
      }}
    >
      <span
        className={status === 'live' ? 'glow-pulse' : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: status === 'live' ? `0 0 6px ${color}` : 'none',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

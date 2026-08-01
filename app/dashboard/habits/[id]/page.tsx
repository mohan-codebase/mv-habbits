'use client';

import React, { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, CheckCircle2, Target, Calendar, TrendingUp, Clock, Video, Check } from 'lucide-react';
import { DynamicIcon } from '@/lib/icons';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import CalendarHeatmap from '@/components/analytics/CalendarHeatmap';
import CompletionChart from '@/components/analytics/CompletionChart';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Habit } from '@/types/habit';
import type { HabitEntry } from '@/types/entry';
import type { HeatmapCell, DailyTrend } from '@/types/analytics';
import { createClient } from '@/lib/supabase/client';

interface HabitDetailData extends Omit<Habit, 'category'> {
  entries: HabitEntry[];
  category?: { id?: string; name: string; color: string; user_id?: string; icon?: string; sort_order?: number; created_at?: string } | null;
}


function hexToRgba(hex: string, alpha: number): string {
  if (hex === 'var(--accent-primary)') return `color-mix(in srgb, var(--accent-primary) ${alpha * 100}%, transparent)`;
  if (hex === 'var(--accent-light)') return `color-mix(in srgb, var(--accent-light) ${alpha * 100}%, transparent)`;
  if (!hex?.startsWith('#')) return `color-mix(in srgb, var(--accent-primary) ${alpha * 100}%, transparent)`;
  const s = hex.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-border-subtle bg-bg-glass p-4">
      <div style={{ color: color ?? 'var(--accent-primary)' }}>{icon}</div>
      <p className="m-0 text-[22px] font-bold text-text-primary [font-family:'Outfit']">
        {value}
      </p>
      <p className="m-0 text-[12px] text-text-muted">{label}</p>
    </div>
  );
}

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [habit, setHabit] = useState<HabitDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(30);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit modal state for past entries
  const [editEntry, setEditEntry] = useState<HabitEntry | null>(null);
  const [editCompleted, setEditCompleted] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Fetch user ID
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const openEditModal = (entry: HabitEntry) => {
    setEditEntry(entry);
    setEditCompleted(entry.is_completed);
    setEditNotes(entry.notes ?? '');
  };

  const closeEditModal = () => {
    if (editSaving) return;
    setEditEntry(null);
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: editEntry.habit_id,
          entry_date: editEntry.entry_date,
          is_completed: editCompleted,
          notes: editNotes.trim() || null,
          video_path: editEntry.video_path ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast(json?.error ?? 'Failed to save entry', 'error');
        return;
      }
      const { data: updated } = (await res.json()) as { data: HabitEntry };
      setHabit((prev) => {
        if (!prev) return prev;
        const entries = prev.entries.map((e) => (e.id === editEntry.id ? updated : e));
        return { ...prev, entries };
      });
      // Refresh heatmap so cell colors update
      try {
        const hres = await fetch(`/api/analytics/heatmap?months=12&habit_id=${id}`);
        if (hres.ok) {
          const { data } = (await hres.json()) as { data: HeatmapCell[] };
          setHeatmap(data ?? []);
        }
      } catch {
        // ignore
      }
      toast('Entry updated', 'success');
      setEditEntry(null);
    } catch {
      toast('Failed to save entry', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [habitRes, heatmapRes] = await Promise.all([
          fetch(`/api/habits/${id}`),
          fetch(`/api/analytics/heatmap?months=12&habit_id=${id}`),
        ]);

        if (habitRes.ok) {
          const { data } = await habitRes.json() as { data: HabitDetailData };
          setHabit(data);
        }
        if (heatmapRes.ok) {
          const { data } = await heatmapRes.json() as { data: HeatmapCell[] };
          setHeatmap(data ?? []);
        }
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  useEffect(() => {
    async function loadTrends() {
      try {
        const res = await fetch(`/api/analytics/trends?days=${trendDays}`);
        if (res.ok) {
          const { data } = await res.json() as { data: DailyTrend[] };
          // Filter to this habit's data by cross-referencing entries
          setTrends(data ?? []);
        }
      } catch {
        // silently ignore
      }
    }
    void loadTrends();
  }, [trendDays]);

  // Derive heatmap cells from entries - MOVED HOOKS BEFORE EARLY RETURNS!
  const entryHeatmap = React.useMemo<HeatmapCell[]>(
    () => (habit?.entries ?? []).map((e) => ({
      date: e.entry_date,
      count: e.is_completed ? 1 : 0,
      percentage: e.is_completed ? 100 : 0,
    })),
    [habit?.entries]
  );

  // Use the fetched heatmap (habit-specific) if available, otherwise derive from entries
  const heatmapData = React.useMemo<HeatmapCell[]>(
    () => (heatmap.length > 0 ? heatmap : entryHeatmap),
    [heatmap, entryHeatmap]
  );

  // Calculate per-habit trend from entries
  const entriesMap = new Map((habit?.entries ?? []).map((e) => [e.entry_date, e]));
  const habitTrends: DailyTrend[] = trends.map((t) => {
    const entry = entriesMap.get(t.date);
    const completed = entry?.is_completed ? 1 : 0;
    return { date: t.date, completed, total: 1, percentage: completed * 100 };
  });

  // Stats
  const totalEntries = (habit?.entries ?? []).length;
  const totalCompleted = (habit?.entries ?? []).filter((e) => e.is_completed).length;
  const completionRate = totalEntries > 0 ? Math.round((totalCompleted / totalEntries) * 100) : 0;

  const frequencyLabel = (() => {
    if (!habit) return '';
    const f = habit.frequency;
    if (f.type === 'daily') return 'Daily';
    if (f.type === 'weekly') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return (f.days ?? []).map((d) => dayNames[d]).join(', ') || 'Weekly';
    }
    if (f.type === 'x_per_week') return `${f.count ?? 1}× per week`;
    if (f.type === 'x_per_month') return `${f.count ?? 1}× per month`;
    return '';
  })();

  if (loading) {
    return (
      <div className="hf-page flex flex-col gap-5">
        <Skeleton variant="text" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[14px] border border-border-subtle bg-bg-glass p-4">
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </div>
          ))}
        </div>
        <Skeleton variant="rect" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="p-6 pt-20 text-center text-text-muted">
        <p>Habit not found.</p>
        <Link href="/dashboard/habits" className="text-[14px] text-accent-primary no-underline">
          ← Back to habits
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hf-page flex flex-col gap-6"
    >
      {/* Back button */}
      <Link
        href="/dashboard/habits"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-text-muted no-underline hover:text-text-secondary"
      >
        <ArrowLeft size={14} />
        All Habits
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          style={{
            background: hexToRgba(habit.color, 0.12),
            border: `1px solid ${hexToRgba(habit.color, 0.25)}`,
          }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-none"
        >
          <DynamicIcon name={habit.icon} size={26} color={habit.color} />
        </div>
        <div>
          <h1 className="mb-1 text-[22px] font-bold text-text-primary [font-family:'Outfit']">
            {habit.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {habit.category && (
              <span
                style={{
                  background: `${habit.category.color}20`,
                  border: `1px solid ${habit.category.color}40`,
                  color: habit.category.color,
                }}
                className="rounded-[20px] px-2 py-0.5 text-[12px] font-semibold"
              >
                {habit.category.name}
              </span>
            )}
            <span className="text-[12px] text-text-muted">{frequencyLabel}</span>
            <span className="text-[12px] text-text-muted">
              Since {format(parseISO(habit.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {habit.description && (
        <p className="m-0 text-[14px] leading-[1.7] text-text-secondary">
          {habit.description}
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        <StatCard
          label="Current Streak"
          value={`${habit.current_streak}d`}
          icon={<Flame size={18} />}
          color="#a6a6a6"
        />
        <StatCard
          label="Longest Streak"
          value={`${habit.longest_streak}d`}
          icon={<TrendingUp size={18} />}
          color="var(--accent-secondary)"
        />
        <StatCard
          label="Total Completions"
          value={habit.total_completions.toLocaleString()}
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={<Target size={18} />}
          color={completionRate >= 70 ? 'var(--accent-primary)' : 'var(--accent-warm)'}
        />
      </div>

      {/* Calendar heatmap */}
      <div className="rounded-2xl border border-border-subtle bg-bg-glass p-5">
        <div className="mb-5 flex items-center gap-2">
          <Calendar size={18} color="var(--accent-primary)" />
          <h2 className="m-0 text-[16px] font-semibold text-text-primary [font-family:'Outfit']">
            History
          </h2>
        </div>
        <CalendarHeatmap data={heatmapData} />
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border border-border-subtle bg-bg-glass p-5">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp size={18} color="var(--accent-primary)" />
          <h2 className="m-0 text-[16px] font-semibold text-text-primary [font-family:'Outfit']">
            Completion Trend
          </h2>
        </div>
        <CompletionChart
          data={habitTrends}
          currentRange={trendDays}
          onRangeChange={setTrendDays}
        />
      </div>

      {/* Recent entries log */}
      <div className="rounded-2xl border border-border-subtle bg-bg-glass p-5">
        <div className="mb-5 flex items-center gap-2">
          <Clock size={18} color="var(--accent-primary)" />
          <h2 className="m-0 text-[16px] font-semibold text-text-primary [font-family:'Outfit']">
            Recent Entries
          </h2>
        </div>
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {(habit.entries ?? []).slice(0, showAllEntries ? undefined : 20).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openEditModal(entry)}
              className="flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-border-subtle bg-bg-tertiary p-[10px_14px] text-left transition-colors duration-150 ease-in-out hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,transparent)]"
              title="Click to edit"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  style={{ background: entry.is_completed ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  className="h-2 w-2 shrink-0 rounded-full"
                />
                <span className="text-[13px] text-text-secondary">
                  {format(parseISO(entry.entry_date), 'EEE, MMM d yyyy')}
                </span>
                {entry.notes && (
                  <span className="truncate text-[12px] italic text-text-muted">
                    &ldquo;{entry.notes}&rdquo;
                  </span>
                )}
                {entry.video_path && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded bg-accent-glow px-1.5 py-0.5 text-[11px] font-semibold text-accent-primary">
                    <Video size={12} /> Video Proof
                  </span>
                )}
              </div>
              <span
                style={{ color: entry.is_completed ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                className="shrink-0 text-[12px] font-semibold [font-family:'IBM_Plex_Mono']"
              >
                {entry.is_completed ? <Check size={14} className="inline align-middle" /> : '—'}
                {entry.value != null ? ` ${entry.value}` : ''}
              </span>
            </button>
          ))}
          {(habit.entries ?? []).length === 0 && (
            <p className="py-6 text-center text-[14px] text-text-muted">
              No entries yet.
            </p>
          )}
          {!showAllEntries && (habit.entries ?? []).length > 20 && (
            <button
              type="button"
              onClick={() => setShowAllEntries(true)}
              className="mt-1 cursor-pointer border-none bg-transparent py-2 text-[13px] font-semibold text-accent-primary"
            >
              Show all {(habit.entries ?? []).length} entries
            </button>
          )}
        </div>
      </div>

      {/* Edit past entry modal */}
      <Modal
        isOpen={Boolean(editEntry)}
        onClose={closeEditModal}
        title={editEntry ? `Edit · ${format(parseISO(editEntry.entry_date), 'EEE, MMM d yyyy')}` : 'Edit'}
        size="sm"
        closeOnOutsideClick={false}
      >
        {editEntry && (
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-text-primary">
              <input
                type="checkbox"
                checked={editCompleted}
                onChange={(e) => setEditCompleted(e.target.checked)}
                className="h-[18px] w-[18px] accent-accent-primary"
              />
              Mark as completed
            </label>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-secondary">
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes for this day"
                rows={3}
                maxLength={1000}
                className="w-full resize-y rounded-[10px] border border-border-subtle bg-bg-tertiary p-[10px_12px] text-[13.5px] text-text-primary outline-none [font-family:inherit]"
              />
            </div>



            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" onClick={closeEditModal} disabled={editSaving}>
                Cancel
              </Button>
              <Button variant="primary" loading={editSaving} onClick={saveEdit}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

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
    <div
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ color: color ?? 'var(--accent-primary)' }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
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
      <div className="hf-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton variant="text" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16 }}>
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
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', paddingTop: 80 }}>
        <p>Habit not found.</p>
        <Link href="/dashboard/habits" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: 14 }}>
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
      className="hf-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Back button */}
      <Link
        href="/dashboard/habits"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: 'var(--text-muted)',
          textDecoration: 'none',
          width: 'fit-content',
        }}
        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        <ArrowLeft size={14} />
        All Habits
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: hexToRgba(habit.color, 0.12),
            border: `1px solid ${hexToRgba(habit.color, 0.25)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'none',
          }}
        >
          <DynamicIcon name={habit.icon} size={26} color={habit.color} />
        </div>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
            {habit.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {habit.category && (
              <span
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: `${habit.category.color}20`,
                  border: `1px solid ${habit.category.color}40`,
                  color: habit.category.color,
                  fontWeight: 600,
                }}
              >
                {habit.category.name}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{frequencyLabel}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Since {format(parseISO(habit.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {habit.description && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {habit.description}
        </p>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
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
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Calendar size={18} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
            History
          </h2>
        </div>
        <CalendarHeatmap data={heatmapData} />
      </div>

      {/* Trend chart */}
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
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
      <div
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Clock size={18} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
            Recent Entries
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {(habit.entries ?? []).slice(0, showAllEntries ? undefined : 20).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openEditModal(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-tertiary)',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 40%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
              title="Click to edit"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: entry.is_completed ? 'var(--accent-primary)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {format(parseISO(entry.entry_date), 'EEE, MMM d yyyy')}
                </span>
                {entry.notes && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    &ldquo;{entry.notes}&rdquo;
                  </span>
                )}
                {entry.video_path && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--accent-primary)',
                      background: 'var(--accent-glow)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Video size={12} /> Video Proof
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: entry.is_completed ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontFamily: "'IBM Plex Mono'",
                  flexShrink: 0,
                }}
              >
                {entry.is_completed ? <Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> : '—'}
                {entry.value != null ? ` ${entry.value}` : ''}
              </span>
            </button>
          ))}
          {(habit.entries ?? []).length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '24px 0' }}>
              No entries yet.
            </p>
          )}
          {!showAllEntries && (habit.entries ?? []).length > 20 && (
            <button
              type="button"
              onClick={() => setShowAllEntries(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 0',
                marginTop: '4px',
              }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={editCompleted}
                onChange={(e) => setEditCompleted(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
              />
              Mark as completed
            </label>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes for this day"
                rows={3}
                maxLength={1000}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  fontSize: 13.5,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>



            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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

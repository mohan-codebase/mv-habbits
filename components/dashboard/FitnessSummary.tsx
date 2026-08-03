'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Plus, LayoutDashboard, BarChart3, Trophy, Sparkles,
  CalendarCheck, Compass, Settings, Flame, CheckCircle2, TrendingUp,
  Target, Sun, Moon, ArrowLeft, Wallet, Receipt, MapPin, ExternalLink,
  Luggage, Coins, ChevronDown, ChevronUp, Ban, Download,
} from 'lucide-react';
import { DynamicIcon, HABIT_ICON_NAMES } from '@/lib/icons';
import DevicesModal from '@/components/settings/DevicesModal';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import WeeklyReportChart from '@/components/dashboard/WeeklyReportChart';
import CompletionChart from '@/components/analytics/CompletionChart';
import { useAccentColor } from '@/components/ui/ThemeProvider';
import type { OverviewStats, DailyTrend } from '@/types/analytics';
import type { HabitWithEntry, Habit } from '@/types/habit';
import { todayString, isHabitActiveOnDate } from '@/lib/utils/dates';
import { generateHabitReport } from '@/lib/utils/pdf';
import { createClient } from '@/lib/supabase/client';
import type { HabitEntry } from '@/types/entry';
import { useToast } from '@/components/ui/Toast';
import SwipeToComplete from '@/components/ui/SwipeToComplete';

interface FitnessSummaryProps {
  stats: OverviewStats | null;
  habits: HabitWithEntry[];
  weekData: { date: string; percentage: number; isToday: boolean }[];
  displayName?: string;
  initials?: string;
  email?: string;
  onBackToHub?: () => void;
}

const PURPLE = 'var(--accent-primary)';
const TEXT_DARK = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
// Raw hex needed only for SVG attributes and rgba() calls
const BLUE_HEX = '#8B5CF6';

// Bad-habit theming — red accents, kept consistent with HabitCard/HabitList
const RED = '#F87171';
const RED_SOFT = '#FCA5A5';
const RED_LIGHT = 'rgba(248, 113, 113, 0.12)';

// Liquid glass helpers (inline style objects)
const GLASS_SM: React.CSSProperties = {
  background: 'var(--glass-bg)',
  boxShadow: 'var(--glass-shadow-sm)',
};
const GLASS_PURPLE: React.CSSProperties = {
  background: 'var(--glass-bg-purple)',
  boxShadow: 'var(--glass-shadow-purple)',
};
const GLASS_NESTED: React.CSSProperties = {
  background: 'var(--glass-bg)',
  boxShadow: 'var(--glass-shadow-sm)',
};
const GLASS_NESTED_PURPLE: React.CSSProperties = {
  background: 'var(--glass-bg-purple)',
  boxShadow: 'var(--glass-shadow-purple)',
};

const RADIUS = 100;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const accentHex = useAccentColor();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const size = (RADIUS + STROKE) * 2;

  return (
    <DashCard
      title="Today's Progress"
      action={
        <div
          className="rounded-full px-3 py-1"
          style={{
            background: `color-mix(in srgb, ${accentHex} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accentHex} 30%, transparent)`,
          }}
        >
          <span className="text-[13px] font-extrabold" style={{ color: accentHex }}>{pct}%</span>
        </div>
      }
    >
      <div className="flex w-full flex-col items-center">
        <div className="mb-4 flex w-full items-baseline gap-1.5">
          <span className="font-[Outfit] text-2xl font-[850] tracking-[-0.03em] text-text-primary">
            {completed} of {total}
          </span>
          <span className="text-sm font-semibold text-text-muted">
            habits completed
          </span>
        </div>

        {/* Ring */}
        <div className="relative my-2 mb-4 h-[218px] w-[218px]">
          <svg width={size} height={size} className="-rotate-90">
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={RADIUS}
              fill="none"
              style={{ stroke: `color-mix(in srgb, ${accentHex} 16%, transparent)` }}
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={RADIUS}
              fill="none"
              stroke={accentHex}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            />
          </svg>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="font-[Outfit] text-[38px] font-[850] leading-none tracking-[-0.04em] text-text-primary">
              {pct}%
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-text-muted">
              complete
            </span>
          </div>
        </div>

        {/* Per-habit dots */}
        {total > 0 && (
          <div className="mt-3 flex w-full flex-wrap justify-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + i * 0.04 }}
                className="h-[11px] w-[11px] rounded-full shadow-none"
                style={{
                  background: i < completed ? accentHex : 'transparent',
                  border: `2px solid ${i < completed ? accentHex : `color-mix(in srgb, ${accentHex} 35%, transparent)`}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </DashCard>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 9.5L7.5 13L14 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HabitRow({
  habit,
  index,
  onToggle,
  onOpen,
  bad = false,
}: {
  habit: HabitWithEntry;
  index: number;
  onToggle: (id: string, completed: boolean) => void;
  onOpen: (id: string) => void;
  bad?: boolean;
}) {
  const done = habit.todayEntry?.is_completed ?? false;
  const icon = habit.icon ?? (bad ? 'ban' : 'circle-check');
  const streak = habit.current_streak ?? 0;

  const accentHex = bad ? '#F87171' : BLUE_HEX;
  const accentLight = bad ? RED_LIGHT : `color-mix(in srgb, ${accentHex} 15%, transparent)`;

  const subtitle = bad
    ? (done ? 'Avoided today' : 'Avoid this habit')
    : habit.description
      ? habit.description.slice(0, 40) + (habit.description.length > 40 ? '…' : '')
      : habit.frequency?.type === 'daily'
        ? 'Daily habit'
        : 'Habit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="relative box-border flex w-full cursor-pointer flex-col gap-2.5 overflow-hidden rounded-xl p-[14px_16px] shadow-none transition-all duration-[220ms] ease-in-out"
      style={{
        background: done
          ? (bad
              ? 'rgba(248, 113, 113, 0.07)'
              : `color-mix(in srgb, ${accentHex} 8%, var(--bg-card))`)
          : 'var(--bg-card)',
        border: `1px solid ${
          done
            ? (bad ? 'rgba(248, 113, 113, 0.3)' : `color-mix(in srgb, ${accentHex} 30%, transparent)`)
            : 'var(--border-default)'
        }`,
      }}
      onClick={() => onOpen(habit.id)}
    >
      {/* Top Row: Icon + Name + Streak */}
      <div className="flex items-center gap-3">
        {/* Icon Circle */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-in-out"
          style={{
            background: done ? accentHex : accentLight,
            color: done ? '#FFFFFF' : accentHex,
          }}
        >
          <DynamicIcon name={icon} size={19} color={done ? '#FFFFFF' : accentHex} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[7px]">
            <p
              className={`m-0 truncate text-[14.5px] font-bold tracking-[-0.01em] text-text-primary ${done && !bad ? 'line-through opacity-75' : 'no-underline opacity-100'}`}
            >
              {habit.name}
            </p>
            {streak > 0 && (
              <span className="inline-flex shrink-0 items-center gap-[3px] rounded-full bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.28)] p-[2px_6px] text-[10.5px] font-[750] leading-none text-[#f59e0b]">
                <Flame size={11} className="inline mr-px" />{streak}d
              </span>
            )}
          </div>
          <p className="m-0 mt-0.5 truncate text-[11.5px] font-medium text-text-muted">
            {subtitle}
          </p>
        </div>
      </div>

      {/* iOS Swipe Slider */}
      <div onClick={(e) => e.stopPropagation()}>
        <SwipeToComplete
          completed={done}
          onToggle={(val) => onToggle(habit.id, !val)}
          color={accentHex}
          label={bad ? 'slide to avoid' : 'slide to complete'}
          completedLabel={bad ? 'avoided' : 'completed'}
          height={44}
        />
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  const c = color || PURPLE;
  let IconComp = Flame;
  if (label.toLowerCase().includes('longest')) IconComp = Trophy;
  else if (label.toLowerCase().includes('rate')) IconComp = Target;
  else if (label.toLowerCase().includes('total')) IconComp = CheckCircle2;

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl p-[14px_20px] shadow-none [backdrop-filter:blur(10px)]"
      style={{
        background: accent
          ? `linear-gradient(135deg, color-mix(in srgb, ${c} 18%, transparent) 0%, color-mix(in srgb, ${c} 6%, transparent) 100%), var(--bg-card)`
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.008) 100%), var(--bg-card)',
        border: accent
          ? `1px solid color-mix(in srgb, ${c} 40%, transparent)`
          : '1px solid var(--border-default)',
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="m-0 truncate pr-1 text-[10.5px] font-[750] uppercase tracking-[0.06em] text-text-muted">
          {label}
        </p>
        <div
          className="flex h-[26px] w-[26px] items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in srgb, ${c} 15%, transparent)`,
            color: c,
          }}
        >
          <IconComp size={14} />
        </div>
      </div>
      <p className="m-0 font-[Outfit] text-2xl font-[850] tracking-[-0.03em]" style={{ color: accent ? c : TEXT_DARK }}>
        {value}
      </p>
    </motion.div>
  );
}

function HabitDetailSheet({
  habit,
  onClose,
  onUpdate,
  onDelete,
}: {
  habit: HabitWithEntry;
  onClose: () => void;
  onUpdate: (updated: Partial<HabitWithEntry> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  // ── Theme the whole sheet with the system accent color ──
  // All habit sheets use the live theme accent — no per-habit overrides.
  const sheetAccentHex = useAccentColor();
  const PURPLE = sheetAccentHex;
  const PURPLE_HEX = PURPLE;
  const PURPLE_LIGHT = `color-mix(in srgb, ${PURPLE} 14%, transparent)`;
  const PURPLE_MID = `color-mix(in srgb, ${PURPLE} 24%, transparent)`;

  const { toast } = useToast();
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit state for habit properties
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editIcon, setEditIcon] = useState(habit.icon ?? 'circle-check');
  const [editColor, setEditColor] = useState(sheetAccentHex);
  const [editNotes, setEditNotes] = useState(habit.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Backfill: which day is currently being saved (for disabling during the request)
  const [savingDay, setSavingDay] = useState<string | null>(null);

  const todayDate = new Date();
  const todayLocal = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  // Log edit details state
  const [activeLogDate, setActiveLogDate] = useState<string>(todayLocal);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const activeEntry = entries.find((e) => e.entry_date === activeLogDate);

  useEffect(() => {
    setNotesInput(activeEntry?.notes ?? '');
  }, [activeLogDate, activeEntry?.notes]);

  // Fetch authenticated user ID on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const saveActiveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habit.id,
          entry_date: activeLogDate,
          is_completed: activeEntry?.is_completed ?? false,
          notes: notesInput.trim() || null,
          video_path: activeEntry?.video_path ?? null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save notes');

      // Update entries list
      setEntries((prev) => {
        const exists = prev.some((e) => e.entry_date === activeLogDate);
        if (exists) {
          return prev.map((e) => e.entry_date === activeLogDate ? { ...e, notes: notesInput.trim() || null } : e);
        } else {
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              habit_id: habit.id,
              user_id: userId || '',
              entry_date: activeLogDate,
              is_completed: false,
              notes: notesInput.trim() || null,
              video_path: null,
              value: null,
              completed_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as HabitEntry,
          ];
        }
      });
      toast('Notes saved', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), icon: editIcon, color: editColor, description: editNotes.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      onUpdate({ id: habit.id, name: editName.trim(), icon: editIcon, color: editColor, description: editNotes.trim() });
      setEditMode(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/habits/${habit.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(habit.id);
        onClose();
      } else {
        setDeleting(false);
      }
    } catch {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/habits/${habit.id}`)
      .then((r) => r.json())
      .then((json) => { setEntries(json.data?.entries ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [habit.id]);

  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month …

  const displayDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + monthOffset, 1);
  const calYear = displayDate.getFullYear();
  const calMonth = displayDate.getMonth();

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();

  const entryMap = new Map(entries.map((e) => [e.entry_date, e.is_completed]));
  const entryVideoMap = new Map(entries.map((e) => [e.entry_date, e.video_path]));

  // Build padded calendar cells
  type CalCell = { date: string; day: number; completed: boolean; isToday: boolean; isFuture: boolean };
  const calCells: (CalCell | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: ds, day, completed: entryMap.get(ds) ?? false, isToday: ds === todayLocal, isFuture: ds > todayLocal };
    }),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  // Tap any past/today cell to backfill (mark/unmark) that day's entry.
  const markDay = async (ds: string, currentlyCompleted: boolean) => {
    if (ds > todayLocal) return;              // never the future
    const next = !currentlyCompleted;
    setSavingDay(ds);
    
    // optimistic update keeping existing properties
    setEntries((prev) => {
      const existing = prev.find((e) => e.entry_date === ds);
      if (existing) {
        return prev.map((e) => e.entry_date === ds ? { ...e, is_completed: next } : e);
      } else {
        return [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            habit_id: habit.id,
            user_id: userId || '',
            entry_date: ds,
            is_completed: next,
            notes: null,
            video_path: null,
            value: null,
            completed_at: next ? new Date().toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as HabitEntry,
        ];
      }
    });

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habit.id,
          entry_date: ds,
          is_completed: next,
          notes: activeEntry?.notes ?? null,
          video_path: activeEntry?.video_path ?? null,
        }),
      });
      if (!res.ok) throw new Error(`save failed ${res.status}`);
      // keep the main dashboard list in sync when today is changed here
      if (ds === todayLocal) {
        onUpdate({
          id: habit.id,
          todayEntry: {
            ...(habit.todayEntry || {}),
            habit_id: habit.id,
            entry_date: ds,
            is_completed: next,
          } as any
        });
      }
    } catch (e) {
      console.error('[markDay] backfill failed, reverting:', e);
      setEntries((prev) => {
        const existing = prev.find((e) => e.entry_date === ds);
        if (existing) {
          return prev.map((e) => e.entry_date === ds ? { ...e, is_completed: currentlyCompleted } : e);
        } else {
          return prev.filter((e) => e.entry_date !== ds);
        }
      });
    } finally {
      setSavingDay(null);
    }
  };

  // Month-level stats for the visible month
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthEntries = entries.filter((e) => e.entry_date.startsWith(monthPrefix));
  const monthDone = monthEntries.filter((e) => e.is_completed).length;
  const isCurrentMon = calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth();
  const daysElapsed = isCurrentMon ? todayDate.getDate() : daysInMonth;
  const monthRate = daysElapsed > 0 ? Math.round((monthDone / daysElapsed) * 100) : 0;
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed); // days left in the month

  // For stat pills — last 30-day rate
  const completedCount = entries.filter((e) => e.is_completed).length;
  const rate = Math.min(100, Math.round((completedCount / 30) * 100));

  // Per-habit weekly report — last 7 days (oldest → today). Single habit is
  // binary per day, so each point is 100% (done) or 0% (not).
  const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - (6 - i));
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: ds, label: WEEK_LABELS[d.getDay()], dayNum: d.getDate(), pct: entryMap.get(ds) ? 100 : 0, isToday: ds === todayLocal };
  });
  const weekChartAvg = Math.round((weekChart.filter((w) => w.pct === 100).length / 7) * 100);

  const canGoBack = monthOffset > -3;
  const canGoForward = monthOffset < 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-[rgba(0,0,0,0.45)]"
      />

      {/* Floating card */}
      <div className="pointer-events-none fixed inset-0 z-[201] flex items-center justify-center p-4">
        <motion.div
          className="hf-modal-panel pointer-events-auto relative w-full max-w-[490px] max-h-[90dvh] overflow-y-auto rounded-2xl p-[26px_22px_34px] shadow-none [font-family:system-ui,-apple-system,sans-serif] bg-bg-card [backdrop-filter:none] [-webkit-backdrop-filter:none]"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            border: `1px solid color-mix(in srgb, ${PURPLE} 35%, transparent)`,
          }}
        >
          {/* Header */}
          <div className="relative z-[1] mt-0 mb-[22px] flex items-center gap-3.5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-none"
              style={{
                background: `linear-gradient(135deg, ${PURPLE} 0%, color-mix(in srgb, ${PURPLE} 75%, black) 100%)`,
              }}
            >
              <DynamicIcon name={editMode ? editIcon : (habit.icon ?? 'circle-check')} size={28} color="#FFFFFF" />
            </motion.div>
            <div className="min-w-0 flex-1">
              {editMode ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="box-border w-full rounded-xl p-[8px_14px] text-lg font-extrabold text-text-primary outline-none font-[Outfit] bg-[var(--input-bg)]"
                  style={{
                    border: `1.5px solid ${PURPLE}`,
                    boxShadow: `0 0 12px color-mix(in srgb, ${PURPLE} 30%, transparent)`,
                  }}
                />
              ) : (
                <>
                  <h2 className="m-0 truncate text-[22px] font-[850] tracking-[-0.025em] text-text-primary font-[Outfit]">
                    {habit.name}
                  </h2>
                  <p className="m-0 mt-[3px] truncate text-[13px] font-medium text-text-muted">
                    {habit.description ?? (habit.frequency?.type === 'daily' ? 'Daily habit' : 'Habit')}
                  </p>
                </>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {!editMode && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => generateHabitReport(habit, rate, monthDone, monthRate)}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                    style={{
                      background: PURPLE_LIGHT,
                      border: `1px solid color-mix(in srgb, ${PURPLE} 25%, transparent)`,
                    }}
                    title="Download PDF Report"
                  >
                    <Download size={16} color={PURPLE} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#555555'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                    style={{
                      background: PURPLE_LIGHT,
                      border: `1px solid color-mix(in srgb, ${PURPLE} 25%, transparent)`,
                    }}
                  >
                    <DynamicIcon name="pencil" size={16} color={PURPLE} />
                  </motion.button>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={editMode ? () => setEditMode(false) : onClose}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-lg font-bold shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                style={{
                  background: PURPLE_MID,
                  border: `1px solid color-mix(in srgb, ${PURPLE} 30%, transparent)`,
                  color: PURPLE,
                }}
              >
                ×
              </motion.button>
            </div>
          </div>

          {/* Edit mode — icon picker + save */}
          {editMode && (
            <div className="mb-4 rounded-xl p-4 bg-[var(--glass-bg-purple)] shadow-[var(--glass-shadow-purple)]">
              <p className="m-0 mb-2.5 text-xs font-bold uppercase tracking-[0.07em] text-text-muted">
                Choose icon
              </p>
              <div className="hf-icon-grid mb-4 grid max-h-[200px] grid-cols-6 gap-2 overflow-y-auto pr-0.5">
                {HABIT_ICONS.map((ic) => {
                  const active = editIcon === ic;
                  return (
                    <button
                      key={ic}
                      onClick={() => setEditIcon(ic)}
                      title={ic}
                      className={`flex aspect-square w-full cursor-pointer items-center justify-center rounded-xl transition-all duration-150 ${active ? 'scale-110' : 'scale-100'}`}
                      style={{
                        border: `2px solid ${active ? PURPLE : 'transparent'}`,
                        background: PURPLE_LIGHT,
                        boxShadow: active ? `0 2px 10px ${PURPLE_LIGHT}` : 'none',
                      }}
                    >
                      <DynamicIcon name={ic} size={20} color={active ? PURPLE : TEXT_MUTED} />
                    </button>
                  );
                })}
              </div>
              <p className="m-0 mb-2.5 text-xs font-bold uppercase tracking-[0.07em] text-text-muted">
                Color
              </p>
              <div className="mb-4">
                <ColorPicker value={editColor} onChange={setEditColor} />
              </div>
              {saveError && <p className="m-0 mb-2.5 text-xs text-[#6a6a6a]">{saveError}</p>}
              <button
                onClick={saveEdit}
                disabled={saving}
                className={`w-full rounded-2xl border-none p-[13px_0] text-[15px] font-bold shadow-none text-[var(--accent-on-primary)] ${saving ? 'cursor-default' : 'cursor-pointer'}`}
                style={{
                  background: saving ? 'var(--accent-light)' : PURPLE,
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Stat pills */}
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <StatPill label="Current Streak" value={`${habit.current_streak}d`} accent color={PURPLE} />
            <StatPill label="Longest Streak" value={`${habit.longest_streak}d`} />
            <StatPill label="30-day Rate" value={`${rate}%`} accent color={PURPLE} />
            <StatPill label="Total Done" value={`${habit.total_completions}`} />
          </div>

          {/* Weekly report — this habit, last 7 days */}
          <div className="mb-3.5 rounded-xl p-[14px_12px_10px] bg-[var(--glass-bg)] shadow-[var(--glass-shadow-sm)]">
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.07em] text-text-muted">
                Weekly report
              </p>
              <span className="text-xs font-bold" style={{ color: PURPLE }}>{weekChartAvg}% avg</span>
            </div>
            {loading
              ? <p className="m-0 p-[24px_0] text-center text-[13px] text-text-muted">Loading…</p>
              : <WeeklyReportChart data={weekChart} avg={weekChartAvg} color={PURPLE} />}
          </div>

          {/* Calendar */}
          <div className="mb-3.5 rounded-xl p-[16px_14px] bg-[var(--glass-bg)] shadow-[var(--glass-shadow-sm)]">
            {/* Month header + navigation */}
            <div className="mb-3.5 flex items-center justify-between">
              <button
                onClick={() => setMonthOffset((o) => o - 1)}
                disabled={!canGoBack}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-none text-lg font-bold ${canGoBack ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  background: canGoBack ? PURPLE_LIGHT : 'transparent',
                  color: canGoBack ? PURPLE : 'var(--drag-handle)',
                }}
              >‹</button>

              <div className="text-center">
                <p className="m-0 text-[15px] font-extrabold tracking-[-0.01em] text-text-primary">
                  {MONTHS[calMonth]} {calYear}
                </p>
                <p className="m-0 mt-0.5 text-[11px] text-text-muted">
                  {monthDone} done · {monthRate}% this month
                </p>
              </div>

              <button
                onClick={() => setMonthOffset((o) => o + 1)}
                disabled={!canGoForward}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-none text-[18px] font-bold ${canGoForward ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  background: canGoForward ? PURPLE_LIGHT : 'transparent',
                  color: canGoForward ? PURPLE : 'var(--drag-handle)',
                }}
              >›</button>
            </div>

            {loading ? (
              <p className="m-0 text-[13px] text-text-muted text-center p-[16px_0]">Loading…</p>
            ) : (() => {
              const weeks = Array.from(
                { length: Math.ceil(calCells.length / 7) },
                (_, wi) => calCells.slice(wi * 7, (wi + 1) * 7)
              );
              return (
                <div className="flex w-full flex-col gap-1">
                  {/* Day-of-week headers */}
                  <div className="flex w-full gap-1">
                    {DOW_LABELS.map((d, i) => (
                      <div key={i} className="flex-1 pb-1 text-center text-[10px] font-bold text-text-muted">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Week rows */}
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex w-full gap-1">
                      {week.map((cell, di) => {
                        if (!cell) {
                          return <div key={di} className="flex-1 h-[clamp(30px,10vw,40px)]" />;
                        }
                        const bg = cell.isFuture
                          ? 'transparent'
                          : cell.completed
                            ? `linear-gradient(135deg, ${PURPLE} 0%, color-mix(in srgb, ${PURPLE} 75%, black) 100%)`
                            : PURPLE_LIGHT;
                        const txtColor = cell.completed ? '#ffffff' : cell.isToday ? PURPLE_HEX : cell.isFuture ? 'var(--drag-handle)' : TEXT_MUTED;
                        const interactive = !cell.isFuture;
                        const isSaving = savingDay === cell.date;
                        const isSelected = cell.date === activeLogDate;
                        const hasVideo = entryVideoMap.get(cell.date);
                        return (
                          <div key={di} className="flex min-w-0 flex-1 justify-center">
                            <motion.div
                              onClick={interactive && !isSaving ? () => setActiveLogDate(cell.date) : undefined}
                              title={interactive ? (cell.completed ? 'Tap to view details/unmark' : 'Tap to view details/mark done') : undefined}
                              className={`flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-[11.5px] shadow-none transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] [-webkit-tap-highlight-color:transparent] ${cell.isToday || isSelected || cell.completed ? 'font-[850]' : 'font-medium'} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${isSaving ? 'opacity-50' : 'opacity-100'}`}
                              style={{
                              background: bg,
                              border: isSelected
                                ? '2px solid #ffffff'
                                : cell.isToday
                                  ? `2px solid ${PURPLE_HEX}`
                                  : '1px solid transparent',
                              color: txtColor,
                              }}
                            >
                              <div className="relative flex h-full w-full flex-col items-center justify-center">
                                <span>{cell.day}</span>
                              {hasVideo && (
                                <div
                                  className="absolute bottom-[3px] h-1 w-1 rounded-full"
                                  style={{ background: cell.completed ? '#fff' : PURPLE }}
                                />
                                )}
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                    {[
                      { bg: PURPLE, label: 'Done', txt: '#fff' },
                      { bg: PURPLE_LIGHT, label: 'Missed', txt: TEXT_MUTED },
                      { bg: 'transparent', label: 'Today', txt: PURPLE_HEX, border: `2px solid ${PURPLE_HEX}` },
                    ].map(({ bg, label, txt, border }) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-tertiary p-[4px_10px]"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ background: bg, border: border ?? 'none' }}
                        />
                        <span className="text-[11.5px] font-[650] text-text-secondary">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Daily Log & Video Proof Card */}
          <div className="mb-3.5 rounded-[20px] p-[18px_16px] bg-[var(--glass-bg)] shadow-[var(--glass-shadow-sm)]">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="m-0 flex items-center gap-[7px] text-sm font-[750] text-text-primary">
                <CalendarCheck size={17} color={PURPLE} />
                Log: {activeLogDate === todayLocal ? 'Today' : activeLogDate}
              </h3>

              {/* Custom Animated Pill Toggle Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={savingDay === activeLogDate}
                onClick={() => markDay(activeLogDate, activeEntry?.is_completed ?? false)}
                className="inline-flex items-center gap-1.5 rounded-full p-[6px_14px] text-[12.5px] font-[750] shadow-none transition-all duration-[180ms] cursor-pointer"
                style={{
                  border: activeEntry?.is_completed
                    ? `1px solid ${PURPLE}`
                    : '1px solid var(--border-default)',
                  background: activeEntry?.is_completed
                    ? `color-mix(in srgb, ${PURPLE} 16%, var(--bg-card))`
                    : 'var(--bg-tertiary)',
                  color: activeEntry?.is_completed ? PURPLE : 'var(--text-muted)',
                }}
              >
                <CheckCircle2 size={15} color={activeEntry?.is_completed ? PURPLE : 'var(--text-muted)'} />
                <span>{activeEntry?.is_completed ? 'Completed' : 'Mark Done'}</span>
              </motion.button>
            </div>

            {/* Notes input */}
            <div className="mb-3.5 flex flex-col gap-1.5">
              <span className="text-[11px] font-[750] uppercase tracking-[0.07em] text-text-muted">
                Entry Notes
              </span>
              <div
                className="flex items-center gap-2 rounded-xl p-[4px_6px_4px_12px] transition-[border-color] duration-150 ease-linear bg-[var(--input-bg)] border border-[var(--input-border)]"
              >
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="What did you achieve today?"
                  className="flex-1 border-none bg-transparent text-[13px] text-text-primary outline-none [font-family:inherit]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void saveActiveNotes();
                    }
                  }}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={saveActiveNotes}
                  disabled={savingNotes || notesInput === (activeEntry?.notes ?? '')}
                  className={`rounded-full border-none p-[7px_14px] text-xs font-bold transition-all duration-150 ease-linear ${notesInput === (activeEntry?.notes ?? '') ? 'text-text-muted cursor-default' : 'text-[var(--accent-on-primary)] cursor-pointer'}`}
                  style={{
                    background: notesInput === (activeEntry?.notes ?? '') ? 'var(--bg-tertiary)' : PURPLE,
                  }}
                >
                  {savingNotes ? 'Saving…' : 'Save'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Completion rate bar */}
          <div className="rounded-xl p-4 bg-[var(--glass-bg)] shadow-[var(--glass-shadow-sm)]">
            <div className="mb-2.5 flex justify-between">
              <p className="m-0 text-[13px] font-bold text-text-primary">
                {MONTHS[calMonth]} Completion
              </p>
              <span className="text-[13px] font-bold" style={{ color: PURPLE }}>{monthRate}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-[5px]" style={{ background: PURPLE_LIGHT }}>
              <motion.div
                key={`${calYear}-${calMonth}`}
                initial={{ width: 0 }}
                animate={{ width: `${monthRate}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-[5px]"
                style={{ background: `linear-gradient(90deg, ${PURPLE}, color-mix(in srgb, ${PURPLE} 65%, #fff))` }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p className="m-0 text-xs text-text-muted">
                <span className="font-bold text-text-primary">{monthDone}</span> of {daysElapsed} days completed
              </p>
              <p className="m-0 whitespace-nowrap text-xs text-text-muted">
                <span className="font-bold text-text-primary">{daysRemaining}</span> {daysRemaining === 1 ? 'day' : 'days'} left
              </p>
            </div>
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="mt-4 w-full rounded-2xl border-none bg-[rgba(239,68,68,0.1)] p-[14px_0] text-sm font-bold text-[#EF4444] cursor-pointer [font-family:inherit]"
            >
              Delete Habit
            </button>
          ) : (
            <div className="mt-4 rounded-2xl bg-[rgba(104,104,104,0.08)] p-4">
              <p className="m-0 mb-3 text-center text-[13px] font-semibold text-[#6a6a6a]">
                Delete &quot;{habit.name}&quot;? This removes all history and cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl border-none bg-[rgba(104,104,104,0.08)] p-[12px_0] text-sm font-bold text-[#6a6a6a] cursor-pointer [font-family:inherit]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`flex-1 rounded-xl border-none bg-[#EF4444] p-[12px_0] text-sm font-bold text-white [font-family:inherit] ${deleting ? 'cursor-default opacity-70' : 'cursor-pointer opacity-100'}`}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

// Single source of truth — same set the standalone IconPicker offers, so habit
// icon choices are identical everywhere (add sheet, edit sheet, HabitForm).
const HABIT_ICONS = HABIT_ICON_NAMES;
// Premium jewel-tone palette — tuned to read well on both the light
// (purple-tinted) and dark surfaces. First entry is the brand violet (default).
const HABIT_COLORS = [
  '#0071e3', // apple blue (brand)
  '#4F46E5', // indigo
  '#2563EB', // sapphire
  '#0891B2', // teal
  '#059669', // emerald
  '#D97706', // gold
  '#DB2777', // rose
  '#E11D48', // fuchsia
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Glossy radial sheen for a color orb.
const orbGloss = (c: string) =>
  `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${c} 72%, #fff) 0%, ${c} 52%, color-mix(in srgb, ${c} 84%, #000) 100%)`;

/* Premium color picker — glossy "orbs" with a radial sheen and a check on the
   selected swatch, plus a custom-color orb (native color wheel) so any color is
   reachable. Shared by the add + edit sheets so they stay identical. */
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const isCustom = !HABIT_COLORS.includes(value);
  const orbBaseClass = "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-none p-0 cursor-pointer transition-[transform,box-shadow] duration-150 ease-linear";
  return (
    <div className="flex flex-wrap gap-3">
      {HABIT_COLORS.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Color ${c}`}
            aria-pressed={active}
            className={`${orbBaseClass} ${active ? 'scale-[1.08]' : 'scale-100'}`}
            style={{
              background: orbGloss(c),
              boxShadow: active
                ? `inset 0 1px 1px rgba(255, 255, 255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${c}`
                : 'inset 0 1px 1px rgba(255, 255, 255,0.45)',
            }}
          >
            {active && <CheckIcon />}
          </button>
        );
      })}

      {/* Custom color — opens the native color wheel */}
      <label
        title="Custom color"
        aria-label="Pick a custom color"
        className={`${orbBaseClass} relative overflow-hidden ${isCustom ? 'scale-[1.08]' : 'scale-100'}`}
        style={{
          background: isCustom
            ? orbGloss(value)
            : 'conic-gradient(from 90deg, #6a6a6a, #a6a6a6, #b2b2b2, #9b9b9b, #939393, #7b7b7b, #707070, #717171, #6a6a6a)',
          boxShadow: isCustom
            ? `inset 0 1px 1px rgba(255, 255, 255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${value}`
            : 'inset 0 1px 1px rgba(255, 255, 255,0.45)',
        }}
      >
        <input
          type="color"
          value={isCustom ? value : '#555555'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer border-none p-0 opacity-0"
        />
        {isCustom ? <CheckIcon /> : <Plus size={18} color="#fff" strokeWidth={2.6} className="[filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.35))]" />}
      </label>
    </div>
  );
}

type FreqType = 'daily' | 'weekly' | 'x_per_week';
type TargetType = 'boolean' | 'duration';

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 rounded-xl p-4 bg-[var(--glass-bg)] shadow-[var(--glass-shadow-sm)]">
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="m-0 mb-2.5 text-xs font-bold uppercase tracking-[0.07em] text-text-muted">{children}</p>;
}

function AddHabitSheet({ onSuccess, onClose, initialBad = false }: { onSuccess: (h: Habit) => void; onClose: () => void; initialBad?: boolean }) {
  const accentHex = useAccentColor();
  const [isBadHabit, setIsBadHabit] = useState(initialBad);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState(initialBad ? 'ban' : 'circle-check');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [color, setColor] = useState(() => initialBad ? RED : accentHex);
  const [freqType, setFreqType] = useState<FreqType>('daily');
  const [days, setDays] = useState<number[]>([]);
  const [perWeek, setPerWeek] = useState(3);
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (d: number) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b));

  const buildFrequency = () => {
    if (freqType === 'weekly') return { type: 'weekly', days };
    if (freqType === 'x_per_week') return { type: 'x_per_week', count: perWeek };
    return { type: 'daily' };
  };

  const submit = async () => {
    if (!name.trim()) { setError('Give your habit a name.'); return; }
    if (freqType === 'weekly' && days.length === 0) { setError('Pick at least one day.'); return; }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(), icon, color,
        frequency: buildFrequency(),
        target_type: targetType,
        target_value: targetType === 'duration' ? duration : 1,
        target_unit: targetType === 'duration' ? 'min' : null,
        is_bad_habit: isBadHabit,
      };
      if (notes.trim()) body.description = notes.trim();

      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      onSuccess(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setLoading(false);
    }
  };

  const freqTabs: { key: FreqType; label: string }[] = [
    { key: 'daily', label: 'Every Day' },
    { key: 'weekly', label: 'Specific Days' },
    { key: 'x_per_week', label: 'Per Week' },
  ];

  const inputClass = "box-border w-full rounded-xl p-[13px_16px] text-base font-semibold text-text-primary outline-none [font-family:inherit] transition-[border-color] duration-150 ease-linear bg-[var(--input-bg)]";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-[rgba(0,0,0,0.45)]"
      />
      <div className="pointer-events-none fixed inset-0 z-[201] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 30, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-[480px] rounded-2xl p-[24px_16px_32px] [font-family:system-ui,-apple-system,sans-serif] shadow-[0_24px_64px_rgba(31,31,31,0.40),inset_0_1px_0_rgba(255,255,255,0.12)] bg-[var(--glass-bg-sheet)] max-h-[90dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="mt-0 mb-4 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] text-text-primary">
                {isBadHabit ? 'Track Bad Habit' : 'New Habit'}
              </h2>
              <p className="m-0 mt-0.5 text-[13px] text-text-muted">
                {isBadHabit ? 'Check off days you successfully avoided it' : 'Build a streak that sticks'}
              </p>
            </div>
            <button onClick={onClose} className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-none text-xl font-bold bg-[var(--surface-tint-mid)] cursor-pointer text-[var(--accent-primary)]">×</button>
          </div>

          {/* Good / Bad toggle */}
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => { setIsBadHabit(false); if (isBadHabit) { setIcon('circle-check'); setColor(accentHex); } }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-none p-[10px_0] text-[13px] transition-all duration-200 cursor-pointer ${!isBadHabit ? 'text-white font-bold' : 'text-text-muted font-medium'}`}
              style={{
                background: !isBadHabit ? accentHex : 'var(--bg-elevated)',
                boxShadow: !isBadHabit ? `0 2px 12px color-mix(in srgb, ${accentHex} 35%, transparent)` : 'none',
              }}
            >
              <CheckCircle2 size={15} />
              Good Habit
            </button>
            <button
              type="button"
              onClick={() => { setIsBadHabit(true); if (!isBadHabit) { setIcon('ban'); setColor(RED); } }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-none p-[10px_0] text-[13px] transition-all duration-200 cursor-pointer ${isBadHabit ? 'bg-[#F87171] text-white font-bold shadow-[0_2px_12px_rgba(248,113,113,0.35)]' : 'bg-[var(--bg-elevated)] text-text-muted font-medium shadow-none'}`}
            >
              <Ban size={15} />
              Bad Habit
            </button>
          </div>

          {/* ── Name ── */}
          <SectionCard>
            <FieldLabel>Habit name</FieldLabel>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g. Morning Run"
              className={`${inputClass} ${error && !name.trim() ? 'border-[1.5px] border-[#6a6a6a]' : 'border-[1.5px] border-[var(--input-border)]'}`}
              onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
            />

            <div className="mt-3.5">
              <FieldLabel>Notes (optional)</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why this matters, how you'll do it…"
                maxLength={500}
                rows={3}
                className={inputClass + " min-h-16 resize-y leading-[1.5] border-[1.5px] border-[var(--input-border)]"}
                onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
              />
            </div>
          </SectionCard>

          {/* ── Icon + Color ── */}
          <SectionCard>
            <FieldLabel>Icon</FieldLabel>
            <div className="hf-icon-grid mb-3 grid grid-cols-6 gap-2">
              {(showAllIcons ? HABIT_ICONS : HABIT_ICONS.slice(0, 6)).map((ic) => {
                const active = icon === ic;
                return (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    title={ic}
                    className={`flex aspect-square w-full items-center justify-center rounded-xl transition-[background,border-color] duration-150 ease-linear cursor-pointer border-[1.5px] ${active ? 'border-[var(--accent-primary)] bg-[var(--surface-tint-mid)]' : 'border-transparent bg-[var(--surface-tint)]'}`}
                  >
                    <DynamicIcon name={ic} size={20} color={active ? PURPLE : TEXT_MUTED} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowAllIcons((v) => !v)}
              className="mb-[18px] border-none bg-transparent p-[2px_0] text-[13px] font-bold cursor-pointer text-[var(--accent-primary)]"
            >
              {showAllIcons ? 'Show less' : `View more (${HABIT_ICONS.length - 6})`}
            </button>
            <FieldLabel>Color</FieldLabel>
            <ColorPicker value={color} onChange={setColor} />
          </SectionCard>

          {/* ── Frequency ── */}
          <SectionCard>
            <FieldLabel>How often</FieldLabel>
            <div className="mb-3.5 flex gap-[3px] rounded-xl bg-[var(--surface-tint)] p-[3px]">
              {freqTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFreqType(key)}
                  className={`flex-1 whitespace-nowrap rounded-[9px] border-none p-[8px_4px] text-xs transition-all duration-150 cursor-pointer ${freqType === key ? 'bg-[var(--accent-primary)] text-white font-bold' : 'bg-transparent text-text-muted font-medium'}`}
                >{label}</button>
              ))}
            </div>

            {freqType === 'weekly' && (
              <div className="flex justify-between">
                {DAY_LABELS.map((label, idx) => {
                  const active = days.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={`h-[38px] w-[38px] rounded-full border-none text-[13px] transition-all duration-150 cursor-pointer ${active ? 'text-white font-bold' : 'text-text-muted font-medium'}`}
                      style={{
                        background: active ? color : 'var(--bg-elevated)',
                        boxShadow: active ? `0 2px 8px color-mix(in srgb, ${color} 30%, transparent)` : 'none',
                      }}
                    >{label}</button>
                  );
                })}
              </div>
            )}

            {freqType === 'x_per_week' && (
              <div className="flex items-center justify-between">
                <p className="m-0 text-sm font-semibold text-text-primary">
                  {perWeek}× per week
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPerWeek((n) => Math.max(1, n - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[var(--surface-tint)] text-[22px] font-bold cursor-pointer text-[var(--accent-primary)]">−</button>
                  <span className="w-7 text-center text-xl font-extrabold text-text-primary">{perWeek}</span>
                  <button onClick={() => setPerWeek((n) => Math.min(7, n + 1))} className="flex h-9 w-9 items-center justify-center rounded-full border-none text-[22px] font-bold text-white cursor-pointer bg-[var(--accent-primary)]">+</button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Target / Timer ── */}
          <SectionCard>
            <FieldLabel>Target type</FieldLabel>
            <div className={`flex gap-2.5 ${targetType === 'duration' ? 'mb-4' : 'mb-0'}`}>
              {(['boolean', 'duration'] as TargetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetType(t)}
                  className={`flex-1 rounded-xl border-none p-[10px_0] text-[13px] transition-all duration-150 cursor-pointer ${targetType === t ? 'text-white font-bold' : 'text-text-muted font-medium'}`}
                  style={{
                    background: targetType === t ? color : 'var(--bg-elevated)',
                    boxShadow: targetType === t ? `0 2px 10px color-mix(in srgb, ${color} 25%, transparent)` : 'none',
                  }}
                >
                  {t === 'boolean' ? 'Check-off' : 'Duration'}
                </button>
              ))}
            </div>

            {targetType === 'duration' && (
              <div className="flex items-center justify-between pt-1">
                <p className="m-0 text-sm font-semibold text-text-primary">{duration} minutes</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setDuration((n) => Math.max(5, n - 5))} className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[var(--surface-tint)] text-[22px] font-bold cursor-pointer text-[var(--accent-primary)]">−</button>
                  <span className="w-10 text-center text-xl font-extrabold text-text-primary">{duration}</span>
                  <button onClick={() => setDuration((n) => Math.min(240, n + 5))} className="flex h-9 w-9 items-center justify-center rounded-full border-none text-[22px] font-bold text-white cursor-pointer bg-[var(--accent-primary)]">+</button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Error */}
          {error && (
            <div className="mb-3.5 rounded-xl bg-[rgba(104,104,104,0.08)] p-[10px_14px] border border-[rgba(104,104,104,0.2)]">
              <p className="m-0 text-[13px] font-semibold text-[#6a6a6a]">{error}</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={submit}
            disabled={loading}
            className={`w-full rounded-full border-none p-[16px_0] text-base font-bold shadow-none transition-all duration-150 text-[var(--accent-on-primary)] ${loading ? 'bg-[var(--accent-light)] cursor-default' : 'bg-accent-primary cursor-pointer'}`}
          >
            {loading ? 'Saving…' : 'Create Habit'}
          </button>
        </motion.div>
      </div>
    </>
  );
}

// ── Admin-dashboard building blocks ──────────────────────────────────────
// KPI stat card — label + icon chip + big number. Pure monochrome (theme vars).
function KpiCard({
  icon, label, value, suffix, sub,
}: {
  icon: React.ReactNode; label: string; value: string | number; suffix?: string; sub?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-border-default bg-bg-card p-[18px_20px]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-muted">
          {label}
        </span>
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-[var(--surface-tint)] text-text-primary">
          {icon}
        </div>
      </div>
      <div className="min-w-0">
        <p className="m-0 text-3xl font-extrabold leading-none tracking-[-0.03em] text-text-primary [font-variant-numeric:tabular-nums]">
          {value}
          {suffix && <span className="ml-0.5 text-[15px] font-semibold text-text-dimmed">{suffix}</span>}
        </p>
        {sub && (
          <p className="m-0 mt-[7px] truncate text-xs text-text-muted">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// Generic widget card — titled panel that wraps charts / lists in the grid.
function DashCard({
  title, action, children, style,
}: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border-default bg-bg-card p-5" style={style}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2.5">
          <h3 className="m-0 text-lg font-extrabold tracking-[-0.02em] text-text-primary">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// Sidebar nav row — filled when active, hover tint otherwise.
function NavItem({
  icon, label, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full border-none p-[11px_14px] text-left text-sm [font-family:inherit] transition-[background,color] duration-150 ease-linear cursor-pointer ${active ? 'bg-accent-primary text-[var(--accent-on-primary)] font-bold' : 'bg-transparent text-text-secondary font-semibold'}`}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-tint)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="flex shrink-0">{icon}</span>
      {label}
    </button>
  );
}

// Expandable white-button group with sub-items
function NavGroup({
  icon, label, expanded, onToggle, children,
}: {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-px">
      {/* White pill header button */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 rounded-full border-none bg-white p-[10px_14px] text-left text-[13.5px] font-bold text-[#1a1a1a] [font-family:inherit] shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition-opacity duration-150 cursor-pointer"
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <span className="flex shrink-0 text-[#1a1a1a]">{icon}</span>
        <span className="flex-1">{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-center"
        >
          <ChevronDown size={15} color="var(--text-muted)" />
        </motion.span>
      </button>

      {/* Sub-items with animated expand */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 mb-1 ml-2.5 flex flex-col gap-0 border-l-2 border-l-[rgba(255,255,255,0.12)] pl-3.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-item inside a NavGroup
function SubNavItem({
  icon, label, active = false, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-full border-none p-[8px_10px] text-left text-[13px] [font-family:inherit] transition-all duration-150 cursor-pointer ${active ? 'bg-[rgba(255,255,255,0.10)] text-text-primary font-semibold' : 'bg-transparent text-text-muted font-normal'}`}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      <span className="flex shrink-0">{icon}</span>
      {label}
    </button>
  );
}

export default function FitnessSummary({
  stats,
  habits,
  weekData,
  displayName = 'User',
  initials = '?',
  onBackToHub,
}: FitnessSummaryProps) {
  const accentHex = useAccentColor();
  const [localHabits, setLocalHabits] = useState<HabitWithEntry[]>(habits);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addBadDefault, setAddBadDefault] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [dateEntries, setDateEntries] = useState<Record<string, boolean>>({});
  const [loadingDate, setLoadingDate] = useState(false);
  const [habitNavOpen, setHabitNavOpen] = useState(true);
  const [tripNavOpen, setTripNavOpen] = useState(false);
  const [showAllGoodHabits, setShowAllGoodHabits] = useState(false);
  const [trendDays, setTrendDays] = useState<number>(30);
  const [trendData, setTrendData] = useState<DailyTrend[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrends() {
      try {
        const res = await fetch(`/api/analytics/trends?days=${trendDays}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) setTrendData(json.data);
        }
      } catch (e) {
        console.error('[fetchTrends] error:', e);
      }
    }
    fetchTrends();
    return () => { isMounted = false; };
  }, [trendDays]);

  // ── Theme (sidebar/topbar quick toggle) ──
  // Reflect the theme actually applied to <html>; re-sync after the profile
  // sheet closes since that sheet can also flip the theme.
  const [isDark, setIsDark] = useState(true);
  useEffect(() => { setIsDark(document.documentElement.dataset.theme !== 'light'); }, []);
  useEffect(() => { if (!menuOpen) setIsDark(document.documentElement.dataset.theme !== 'light'); }, [menuOpen]);
  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('productivity_master_theme', next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  const isViewingToday = selectedDate === todayString();

  const selectDate = async (date: string) => {
    if (date === selectedDate) return;
    setSelectedDate(date);
    if (date === todayString()) { setDateEntries({}); return; }
    setLoadingDate(true);
    try {
      const res = await fetch(`/api/entries?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, boolean> = {};
        (json.data ?? []).forEach((e: { habit_id: string; is_completed: boolean }) => {
          map[e.habit_id] = e.is_completed;
        });
        setDateEntries(map);
      }
    } catch { }
    setLoadingDate(false);
  };

  const handleAddSuccess = (saved: Habit) => {
    setLocalHabits((prev) => [...prev, { ...saved, created_at: saved.created_at || new Date().toISOString(), todayEntry: null, completionRate: 0 } as HabitWithEntry]);
    setAddOpen(false);
  };

  const handleUpdate = (updated: Partial<HabitWithEntry> & { id: string }) => {
    setLocalHabits((prev) => prev.map((h) => h.id === updated.id ? { ...h, ...updated } : h));
  };

  const handleDelete = (id: string) => {
    setLocalHabits((prev) => prev.filter((h) => h.id !== id));
    setSelectedId(null);
  };

  const activeHabitsForSelectedDate = localHabits.filter((h) => isHabitActiveOnDate(h.created_at, selectedDate));
  const goodHabits = activeHabitsForSelectedDate.filter((h) => !h.is_bad_habit);

  // Habits displayed with the selected date's completion state
  const displayHabitsFull = isViewingToday
    ? goodHabits
    : goodHabits.map((h) => ({
      ...h,
      todayEntry: { habit_id: h.id, is_completed: dateEntries[h.id] ?? false } as HabitWithEntry['todayEntry'],
    }));

  const displayHabits = showAllGoodHabits ? displayHabitsFull : displayHabitsFull.slice(0, 5);

  const completedCount = displayHabitsFull.filter((h) => h.todayEntry?.is_completed).length;
  const totalCount = displayHabitsFull.length;
  const todayPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Bad habits — checking one off means it was *avoided* on the selected date.
  const badHabits = activeHabitsForSelectedDate.filter((h) => h.is_bad_habit);
  const displayBadHabits = isViewingToday
    ? badHabits
    : badHabits.map((h) => ({
      ...h,
      todayEntry: { habit_id: h.id, is_completed: dateEntries[h.id] ?? false } as HabitWithEntry['todayEntry'],
    }));
  const avoidedCount = displayBadHabits.filter((h) => h.todayEntry?.is_completed).length;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  // Week date strip — sorted 7 days with actual calendar numbers
  const weekDates = [...weekData]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, percentage }) => {
      const d = new Date(date + 'T00:00:00');
      const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isToday = date === todayString();
      return { date, dayNum: d.getDate(), dayLabel: LABELS[d.getDay()], isToday, pct: percentage };
    });

  // Consistency score bars — same 7 days as the week strip, oldest→today left→right.
  // Override today's pct with the live todayPct so bars update as the user checks habits.
  const weekBars = weekDates.map((wd) =>
    wd.isToday ? { ...wd, pct: todayPct } : wd
  );
  const avgPct = weekBars.length
    ? Math.round(weekBars.reduce((s, b) => s + b.pct, 0) / weekBars.length)
    : 0;

  const handleToggle = async (id: string, currentDone: boolean) => {
    // Optimistic update
    if (isViewingToday) {
      setLocalHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, todayEntry: { ...(h.todayEntry ?? {}), habit_id: id, is_completed: !currentDone } as HabitWithEntry['todayEntry'] }
            : h
        )
      );
    } else {
      setDateEntries((prev) => ({ ...prev, [id]: !currentDone }));
    }
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: id, entry_date: selectedDate, is_completed: !currentDone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[handleToggle] API error', res.status, body);
        throw new Error(`Failed to save entry: ${res.status} ${JSON.stringify(body)}`);
      }
    } catch (err) {
      console.error('[handleToggle] toggle failed, reverting:', err);
      if (isViewingToday) {
        setLocalHabits((prev) =>
          prev.map((h) =>
            h.id === id
              ? { ...h, todayEntry: { ...(h.todayEntry ?? {}), habit_id: id, is_completed: currentDone } as HabitWithEntry['todayEntry'] }
              : h
          )
        );
      } else {
        setDateEntries((prev) => ({ ...prev, [id]: currentDone }));
      }
    }
  };


  return (
    <div
      className="relative min-h-[100dvh] overflow-x-clip [font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] bg-bg-primary"
    >
      {/* Desktop Sidebar is rendered by layout.tsx */}

      {/* ───────────────── Main ───────────────── */}
      <div>
        <div
          className="hf-dashboard-main-container mx-auto flex max-w-[1280px] flex-col p-[clamp(18px,2.5vw,32px)_clamp(16px,2.5vw,32px)_72px] gap-[clamp(16px,2vw,22px)]"
        >
          {/* ── Top Hero Greeting Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl border border-border-default p-[24px_28px] shadow-[0_12px_32px_rgba(0,0,0,0.15)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_12%,var(--bg-card))_0%,var(--bg-card)_100%)]"
          >
            {/* Ambient background glow */}
            <div
              className="pointer-events-none absolute -top-[40%] -right-[10%] h-[300px] w-[300px] rounded-full blur-[30px] bg-[radial-gradient(circle,var(--accent-glow-lg)_0%,transparent_70%)]"
            />

            <div className="z-[1] min-w-0 flex-[1_1_300px]">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
                  {dateStr}
                </span>
                <span className="h-1 w-1 rounded-full bg-[var(--border-medium)]" />
                <span className="text-[13px] font-semibold text-text-secondary">
                  <span className="font-bold text-[var(--accent-primary)]">{completedCount}</span>/{totalCount} Completed Today
                </span>
              </div>
              <h1 className="m-0 text-[clamp(26px,4vw,34px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-text-primary font-[Outfit]">
                {greeting}, {displayName.split(' ')[0]}
              </h1>
              <p className="m-0 mt-2 text-[15px] font-medium text-text-secondary">
                {todayPct === 100
                  ? 'Amazing job! All habits completed for today.'
                  : todayPct >= 50
                  ? `Great progress! You're ${todayPct}% done with today's habits.`
                  : 'Let\'s crush today\'s goals one habit at a time.'}
              </p>
            </div>

            <div className="z-[1] flex items-center gap-3">
              <button
                className="hf-add-habit-btn inline-flex shrink-0 items-center gap-2 rounded-full border-none p-[12px_24px] text-sm font-bold [font-family:inherit] shadow-[0_8px_24px_color-mix(in_srgb,var(--accent-primary)_35%,transparent)] transition-[transform,box-shadow] duration-150 ease-linear cursor-pointer bg-accent-primary text-[var(--accent-on-primary)]"
                onClick={() => setAddOpen(true)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <Plus size={18} strokeWidth={2.6} />
                <span className="hf-dash-btn-label">Add Habit</span>
              </button>
              <Link
                className="hf-profile-link flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[var(--surface-tint)] text-text-primary transition-[background,transform] duration-150 ease-linear cursor-pointer"
                href="/dashboard/settings"
                aria-label="Open profile settings"
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <User size={20} color="var(--text-primary)" />
              </Link>
            </div>
          </motion.div>

          {/* ── 4 Top KPI Metric Cards ── */}
          <div className="hf-kpi-grid">
            {/* Card 1: Today's Completion */}
            <motion.div
              className="hf-kpi-card flex flex-col gap-1.5 rounded-2xl border border-border-subtle bg-bg-card p-[14px_16px] transition-[transform,border-color] duration-150 ease-linear"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-1.5 text-text-muted">
                <Target size={14} color="var(--accent-primary)" />
                <span className="hf-kpi-card-title text-[11px] font-bold uppercase tracking-[0.05em]">Today Progress</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <div className="hf-kpi-card-val text-[22px] font-[850] leading-none tracking-[-0.02em] text-text-primary">
                  {todayPct}%
                </div>
                <p className="hf-kpi-card-sub m-0 text-[11.5px] font-medium text-text-muted">
                  {completedCount}/{totalCount} done
                </p>
              </div>
            </motion.div>

            {/* Card 2: Active Streak */}
            <motion.div
              className="hf-kpi-card flex flex-col gap-1.5 rounded-2xl border border-border-subtle bg-bg-card p-[14px_16px] transition-[transform,border-color] duration-150 ease-linear"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-1.5 text-text-muted">
                <Flame size={14} color="#FB923C" />
                <span className="hf-kpi-card-title text-[11px] font-bold uppercase tracking-[0.05em]">Best Streak</span>
              </div>
              <div className="flex min-w-0 items-baseline gap-1.5">
                <div className="hf-kpi-card-val shrink-0 text-[22px] font-[850] leading-none tracking-[-0.02em] text-text-primary">
                  {stats?.bestStreak ?? 0}<span className="text-sm font-[650] text-text-muted">d</span>
                </div>
                <p className="hf-kpi-card-sub m-0 min-w-0 truncate text-[11.5px] font-medium text-text-muted">
                  {stats?.bestStreakHabitName ? `in "${stats.bestStreakHabitName}"` : 'momentum'}
                </p>
              </div>
            </motion.div>

            {/* Card 3: Consistency Score */}
            <motion.div
              className="hf-kpi-card flex flex-col gap-1.5 rounded-2xl border border-border-subtle bg-bg-card p-[14px_16px] transition-[transform,border-color] duration-150 ease-linear"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-1.5 text-text-muted">
                <TrendingUp size={14} color="#38BDF8" />
                <span className="hf-kpi-card-title text-[11px] font-bold uppercase tracking-[0.05em]">Consistency</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <div className="hf-kpi-card-val text-[22px] font-[850] leading-none tracking-[-0.02em] text-text-primary">
                  {avgPct}%
                </div>
                <p className="hf-kpi-card-sub m-0 text-[11.5px] font-medium text-text-muted">
                  7-day avg
                </p>
              </div>
            </motion.div>

            {/* Card 4: Total Done */}
            <motion.div
              className="hf-kpi-card flex flex-col gap-1.5 rounded-2xl border border-border-subtle bg-bg-card p-[14px_16px] transition-[transform,border-color] duration-150 ease-linear"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-1.5 text-text-muted">
                <Trophy size={14} color="#A855F7" />
                <span className="hf-kpi-card-title text-[11px] font-bold uppercase tracking-[0.05em]">Total Done</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <div className="hf-kpi-card-val text-[22px] font-[850] leading-none tracking-[-0.02em] text-text-primary">
                  {stats?.totalCompletions ?? 0}
                </div>
                <p className="hf-kpi-card-sub m-0 text-[11.5px] font-medium text-text-muted">
                  lifetime
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── 2-column widget grid ── */}
          <div className="hf-dashboard-grid">
            {/* LEFT COLUMN */}
            <div className="flex min-w-0 flex-col gap-[clamp(16px,2vw,22px)]">

          {/* ── Week day selector ── */}
          <DashCard
            title={isViewingToday ? '7-Day Overview' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            action={
              !isViewingToday ? (
                <button
                  onClick={() => selectDate(todayString())}
                  className="rounded-full border border-border-default bg-[var(--surface-tint)] p-[5px_14px] text-xs font-bold text-text-primary [font-family:inherit] cursor-pointer"
                >
                  Jump to today
                </button>
              ) : (
                <span className="text-[13px] font-bold text-text-muted">{dateStr}</span>
              )
            }
          >
            <div className="hf-weekly-grid grid grid-cols-7 gap-1.5">
              {weekDates.map(({ date, dayNum, dayLabel, isToday, pct }) => {
                const R = 19, CIRC = 2 * Math.PI * R;
                const isSelected = date === selectedDate;
                return (
                  <div
                    key={date}
                    onClick={() => selectDate(date)}
                    className="flex cursor-pointer flex-col items-center gap-1.5"
                  >
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-accent-primary' : 'text-text-muted'}`}>
                      {dayLabel}
                    </span>
                    <div className="relative h-[42px] w-[42px]">
                      <svg width="42" height="42" className="absolute inset-0">
                        <circle cx="21" cy="21" r={R} fill="none" style={{ stroke: `color-mix(in srgb, ${accentHex} 22%, transparent)` }} strokeWidth="2.5" />
                        <circle cx="21" cy="21" r={R} fill="none" stroke={accentHex}
                          strokeWidth="2.5" strokeLinecap="round"
                          strokeDasharray={CIRC}
                          strokeDashoffset={CIRC * (1 - (isToday ? todayPct : pct) / 100)}
                          transform="rotate(-90 21 21)"
                          className="transition-[stroke-dashoffset] duration-[600ms] ease-linear"
                        />
                      </svg>
                      <div
                        className={`absolute inset-[5px] flex items-center justify-center rounded-full transition-[background] duration-[180ms] ease-linear ${isSelected ? 'bg-accent-primary' : 'bg-transparent'}`}
                      >
                        <span className={`text-[13px] ${isSelected ? 'font-bold text-[var(--accent-on-primary)]' : 'font-semibold text-text-primary'}`}>
                          {dayNum}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashCard>


              <DashCard
                title={isViewingToday ? "Today's Habits" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                action={
                  <span className={`text-[13px] font-semibold ${loadingDate ? 'text-text-muted' : 'text-text-primary'}`}>
                    {loadingDate ? 'Loading…' : `${completedCount}/${totalCount} done`}
                  </span>
                }
              >
                {displayHabits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-default p-[32px_20px] text-center">
                    <p className="m-0 mb-3.5 text-sm text-text-muted">No active habits yet.</p>
                    <button
                      onClick={() => setAddOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border-none p-[10px_20px] text-[13.5px] font-bold [font-family:inherit] cursor-pointer bg-accent-primary text-[var(--accent-on-primary)]"
                    >
                      <Plus size={16} strokeWidth={2.6} /> Add your first habit
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {displayHabits.map((h, i) => (
                      <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} />
                    ))}
                    {displayHabitsFull.length > 5 && (
                      <motion.button
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setShowAllGoodHabits(!showAllGoodHabits)}
                        className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)] p-[12px_20px] text-[13.5px] font-bold text-text-primary [font-family:inherit] shadow-none [backdrop-filter:blur(10px)] transition-all duration-200 cursor-pointer bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_12%,var(--bg-tertiary))_0%,var(--bg-tertiary)_100%)]"
                      >
                        <span>{showAllGoodHabits ? 'Show less' : `Show all habits (${displayHabitsFull.length})`}</span>
                        <motion.div
                          animate={{ rotate: showAllGoodHabits ? 180 : 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                        >
                          <ChevronDown size={16} color="var(--accent-primary)" />
                        </motion.div>
                      </motion.button>
                    )}
                  </div>
                )}
              </DashCard>

              <DashCard title="Completion Trends">
                <CompletionChart
                  data={
                    trendData.length > 0
                      ? trendData
                      : weekBars.map(({ date, pct }) => ({
                          date,
                          completed: Math.round((pct / 100) * totalCount),
                          total: totalCount,
                          percentage: pct,
                        }))
                  }
                  currentRange={trendDays}
                  onRangeChange={(days) => setTrendDays(days)}
                />
              </DashCard>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex min-w-0 flex-col gap-[clamp(16px,2vw,22px)]">
              <DashCard
                title="Consistency Score"
                action={avgPct > 0 ? <span className="text-[13px] font-bold text-text-primary">{avgPct}%</span> : null}
              >
                <div className="relative">
                  <div className="flex items-end justify-between gap-[5px]">
                    {weekBars.map(({ date, dayLabel, dayNum, pct, isToday }, i) => {
                      const TRACK_H = 88;
                      const barH = Math.max(pct > 0 ? 8 : 0, Math.round((pct / 100) * TRACK_H));
                      return (
                        <div key={date} className="flex flex-1 flex-col items-center gap-[5px]">
                          <div
                            className="relative w-full overflow-hidden rounded-full bg-[var(--surface-tint)] h-[88px]"
                          >
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: barH }}
                              transition={{ duration: 0.5, delay: 0.08 + i * 0.05, ease: 'easeOut' }}
                              className={`absolute inset-x-0 bottom-0 rounded-full ${isToday ? 'bg-accent-primary' : 'bg-[color-mix(in_srgb,var(--accent-primary)_52%,transparent)]'}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-px">
                            <span className={`text-[9px] font-medium ${isToday ? 'text-text-primary' : 'text-text-muted'}`}>
                              {dayLabel}
                            </span>
                            <span className={`text-[11px] ${isToday ? 'font-extrabold text-text-primary' : 'font-medium text-text-secondary'}`}>
                              {dayNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {avgPct > 0 && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-[2] border-t-[1.5px] border-dashed border-[var(--border-medium)]"
                      style={{ top: 88 - Math.round((avgPct / 100) * 88) }}
                    >
                      <span className="absolute left-0 -top-[9px] rounded-[4px] bg-bg-card p-[1px_5px] text-[10px] font-bold text-text-muted">
                        Avg.{avgPct}%
                      </span>
                    </div>
                  )}
                </div>
              </DashCard>

              {isViewingToday && <CircularProgress completed={completedCount} total={totalCount} />}

              <DashCard
                title="Bad Habits Avoided"
                action={
                  displayBadHabits.length > 0 ? (
                    <div className="rounded-full bg-[rgba(248,113,113,0.12)] p-[4px_12px] border border-[rgba(248,113,113,0.3)]">
                      <span className="text-[12.5px] font-[750] text-[#FCA5A5]">
                        {loadingDate ? 'Loading…' : `${avoidedCount}/${displayBadHabits.length} avoided`}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddBadDefault(true); setAddOpen(true); }}
                      className="flex items-center gap-[5px] rounded-full border-none p-[5px_12px] text-xs font-bold cursor-pointer bg-[rgba(248,113,113,0.12)] text-[#FCA5A5]"
                    >
                      <Plus size={13} /> Add
                    </button>
                  )
                }
              >
                {displayBadHabits.length === 0 ? (
                  <div className="p-[20px_12px_8px] text-center">
                    <div
                      className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(248,113,113,0.12)]"
                    >
                      <Ban size={22} color={RED_SOFT} />
                    </div>
                    <p className="m-0 mb-1 text-sm font-bold text-text-primary">No bad habits tracked</p>
                    <p className="m-0 mb-4 text-xs leading-[1.4] text-text-muted">
                      Add habits you want to break — check off each day you resist them
                    </p>
                    <button
                      onClick={() => { setAddBadDefault(true); setAddOpen(true); }}
                      className="inline-flex items-center gap-1.5 rounded-full border-none p-[9px_20px] text-sm font-bold text-white cursor-pointer shadow-[0_2px_10px_rgba(248,113,113,0.35)] bg-[#F87171]"
                    >
                      <Plus size={14} /> Track a bad habit
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {displayBadHabits.map((h, i) => (
                      <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} bad />
                    ))}
                  </div>
                )}
              </DashCard>

              {/* ── Quick Action Shortcuts ── */}
              <DashCard title="Quick Actions">
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/dashboard/analytics"
                    className="flex items-center gap-2.5 rounded-[14px] bg-[var(--surface-tint)] p-[12px_14px] text-[13px] font-bold text-text-primary no-underline transition-[background] duration-150 ease-linear"
                  >
                    <BarChart3 size={18} color="var(--accent-primary)" />
                    Analytics
                  </Link>
                  <Link
                    href="/dashboard/achievements"
                    className="flex items-center gap-2.5 rounded-[14px] bg-[var(--surface-tint)] p-[12px_14px] text-[13px] font-bold text-text-primary no-underline transition-[background] duration-150 ease-linear"
                  >
                    <Trophy size={18} color="#FB923C" />
                    Trophies
                  </Link>
                  <Link
                    href="/dashboard/year-in-review"
                    className="flex items-center gap-2.5 rounded-[14px] bg-[var(--surface-tint)] p-[12px_14px] text-[13px] font-bold text-text-primary no-underline transition-[background] duration-150 ease-linear"
                  >
                    <Sparkles size={18} color="#A855F7" />
                    Year Review
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 rounded-[14px] bg-[var(--surface-tint)] p-[12px_14px] text-[13px] font-bold text-text-primary no-underline transition-[background] duration-150 ease-linear"
                  >
                    <Settings size={18} color="var(--text-muted)" />
                    Settings
                  </Link>
                </div>
              </DashCard>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive mobile adjustments */}
      <style>{`
        @media (max-width: 1023px) {
          .hf-dashboard-main-container {
            padding-bottom: 110px !important;
          }
        }
        @media (max-width: 479px) {
          .hf-add-habit-btn {
            width: 100%;
          }
        }
      `}</style>

      {/* ── Habit Detail Sheet ── */}
      <AnimatePresence>
        {selectedId && (() => {
          const h = localHabits.find((x) => x.id === selectedId);
          return h ? (
            <HabitDetailSheet
              key={selectedId}
              habit={h}
              onClose={() => setSelectedId(null)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : null;
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {addOpen && (
          <AddHabitSheet
            key="add-sheet"
            initialBad={addBadDefault}
            onSuccess={handleAddSuccess}
            onClose={() => { setAddOpen(false); setAddBadDefault(false); }}
          />
        )}
      </AnimatePresence>

      {/* ProfileMenu instantiation removed */}

      <DevicesModal isOpen={devicesOpen} onClose={() => setDevicesOpen(false)} />
    </div>
  );
}

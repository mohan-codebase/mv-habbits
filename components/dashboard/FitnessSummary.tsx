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
import { useAccentColor } from '@/components/ui/ThemeProvider';
import type { OverviewStats } from '@/types/analytics';
import type { HabitWithEntry, Habit } from '@/types/habit';
import { todayString } from '@/lib/utils/dates';
import { generateHabitReport } from '@/lib/utils/pdf';
import { createClient } from '@/lib/supabase/client';
import type { HabitEntry } from '@/types/entry';
import { useToast } from '@/components/ui/Toast';

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
const PURPLE_LIGHT = 'var(--surface-tint)';
const PURPLE_MID = 'var(--surface-tint-mid)';
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
        <div style={{
          padding: '4px 12px',
          borderRadius: 9999,
          background: `color-mix(in srgb, ${accentHex} 14%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accentHex} 30%, transparent)`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: accentHex }}>{pct}%</span>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16, width: '100%' }}>
          <span style={{ fontSize: 24, fontWeight: 850, color: TEXT_DARK, letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
            {completed} of {total}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_MUTED }}>
            habits completed
          </span>
        </div>

        {/* Ring */}
        <div style={{ position: 'relative', width: size, height: size, margin: '8px 0 16px' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{ fontSize: 38, fontWeight: 850, color: TEXT_DARK, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>
              {pct}%
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              complete
            </span>
          </div>
        </div>

        {/* Per-habit dots */}
        {total > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%', marginTop: 12 }}>
            {Array.from({ length: total }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + i * 0.04 }}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: i < completed ? accentHex : 'transparent',
                  border: `2px solid ${i < completed ? accentHex : `color-mix(in srgb, ${accentHex} 35%, transparent)`}`,
                  boxShadow: 'none',
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

  const accent = bad ? RED : PURPLE;
  const accentLight = bad ? RED_LIGHT : `color-mix(in srgb, ${accent} 15%, transparent)`;

  const subtitle = bad
    ? (done ? 'Avoided today' : 'Avoid this habit')
    : habit.description
      ? habit.description.slice(0, 36) + (habit.description.length > 36 ? '…' : '')
      : habit.frequency?.type === 'daily'
        ? 'Daily habit'
        : 'Habit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 18px',
        background: done
          ? (bad
              ? 'rgba(248, 113, 113, 0.08)'
              : 'color-mix(in srgb, var(--accent-primary) 10%, var(--bg-card))')
          : 'var(--bg-card)',
        border: `1px solid ${
          done
            ? (bad ? 'rgba(248, 113, 113, 0.35)' : 'color-mix(in srgb, var(--accent-primary) 35%, transparent)')
            : 'var(--border-default)'
        }`,
        borderRadius: 9999,
        cursor: 'pointer',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
      }}
      onClick={() => onOpen(habit.id)}
    >
      {/* Clean Bottom Accent Bar for Completed items */}
      {done && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2.5,
            background: accent,
            borderRadius: 9999,
            transformOrigin: 'left',
          }}
        />
      )}

      {/* Icon Circle */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 42,
          height: 42,
          borderRadius: 9999,
          background: done ? accent : accentLight,
          color: done ? '#FFFFFF' : accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          boxShadow: 'none',
        }}
      >
        <DynamicIcon
          name={icon}
          size={20}
          color={done ? '#FFFFFF' : accent}
        />
      </motion.div>

      {/* Text & Badges */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: done && !bad ? 'line-through' : 'none',
              opacity: done && !bad ? 0.8 : 1,
            }}
          >
            {habit.name}
          </p>

          {/* Streak Badge */}
          {streak > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                fontWeight: 750,
                padding: '2px 7px',
                borderRadius: 9999,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <Flame size={12} style={{ display: 'inline', marginRight: 2 }} /> {streak}d
            </span>
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 500,
            color: done ? 'var(--text-secondary)' : 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Interactive Checkbox */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(habit.id, done);
        }}
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: done ? accent : 'transparent',
          border: `2px solid ${done ? accent : `color-mix(in srgb, ${accent} 40%, transparent)`}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
        }}
      >
        <AnimatePresence mode="wait">
          {done && (
            <motion.div
              key="check-icon"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            >
              <CheckIcon />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'relative',
        borderRadius: 18,
        padding: '14px 16px',
        background: accent
          ? `linear-gradient(135deg, color-mix(in srgb, ${c} 18%, transparent) 0%, color-mix(in srgb, ${c} 6%, transparent) 100%), var(--bg-card)`
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.008) 100%), var(--bg-card)',
        border: accent
          ? `1px solid color-mix(in srgb, ${c} 40%, transparent)`
          : '1px solid var(--border-default)',
        boxShadow: 'none',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 10.5, fontWeight: 750, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: `color-mix(in srgb, ${c} 15%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c,
        }}>
          <IconComp size={14} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 850, color: accent ? c : TEXT_DARK, letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
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
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0, 0, 0,0.45)' }}
      />

      {/* Floating card */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            pointerEvents: 'auto',
            width: '100%', maxWidth: 490,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid color-mix(in srgb, ${PURPLE} 35%, transparent)`,
            borderRadius: 28,
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '26px 22px 34px',
            fontFamily: "system-ui, -apple-system, sans-serif",
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14, marginTop: 0, marginBottom: 22 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: 58, height: 58, borderRadius: 18,
                background: `linear-gradient(135deg, ${PURPLE} 0%, color-mix(in srgb, ${PURPLE} 75%, black) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
                boxShadow: 'none',
              }}
            >
              <DynamicIcon name={editMode ? editIcon : (habit.icon ?? 'circle-check')} size={28} color="#FFFFFF" />
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editMode ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--input-bg)', border: `1.5px solid ${PURPLE}`,
                    borderRadius: 12, padding: '8px 14px',
                    fontSize: 18, fontWeight: 800, color: TEXT_DARK,
                    outline: 'none', fontFamily: "'Outfit', sans-serif",
                    boxShadow: `0 0 12px color-mix(in srgb, ${PURPLE} 30%, transparent)`,
                  }}
                />
              ) : (
                <>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 850, color: TEXT_DARK, letterSpacing: '-0.025em', fontFamily: "'Outfit', sans-serif" }}>
                    {habit.name}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED, fontWeight: 500 }}>
                    {habit.description ?? (habit.frequency?.type === 'daily' ? 'Daily habit' : 'Habit')}
                  </p>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!editMode && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => generateHabitReport(habit, rate, monthDone, monthRate)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: PURPLE_LIGHT,
                      border: `1px solid color-mix(in srgb, ${PURPLE} 25%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                    title="Download PDF Report"
                  >
                    <Download size={16} color={PURPLE} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#555555'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: PURPLE_LIGHT,
                      border: `1px solid color-mix(in srgb, ${PURPLE} 25%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
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
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: PURPLE_MID,
                  border: `1px solid color-mix(in srgb, ${PURPLE} 30%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 18,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
              >
                ×
              </motion.button>
            </div>
          </div>

          {/* Edit mode — icon picker + save */}
          {editMode && (
            <div style={{ ...GLASS_NESTED_PURPLE, borderRadius: 18, padding: '16px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Notes
              </p>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Why this matters, how you'll do it…"
                maxLength={500}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 60,
                  background: 'var(--input-bg)', border: `1.5px solid var(--input-border)`,
                  borderRadius: 10, padding: '8px 12px', marginBottom: 16,
                  fontSize: 14, color: TEXT_DARK, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                }}
                onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
              />
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Choose icon
              </p>
              <div className="hf-icon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 16, maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
                {HABIT_ICONS.map((ic) => {
                  const active = editIcon === ic;
                  return (
                    <button key={ic} onClick={() => setEditIcon(ic)} title={ic} style={{
                      width: '100%', aspectRatio: '1', borderRadius: 12, border: `2px solid ${active ? PURPLE : 'transparent'}`,
                      background: PURPLE_LIGHT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: active ? `0 2px 10px ${PURPLE_LIGHT}` : 'none',
                      transition: 'all 0.15s', transform: active ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      <DynamicIcon name={ic} size={20} color={active ? PURPLE : TEXT_MUTED} />
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Color
              </p>
              <div style={{ marginBottom: 16 }}>
                <ColorPicker value={editColor} onChange={setEditColor} />
              </div>
              {saveError && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6a6a6a' }}>{saveError}</p>}
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                  background: saving ? 'var(--accent-light)' : PURPLE,
                  color: 'var(--accent-on-primary)', fontSize: 15, fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer',
                  boxShadow: 'none',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Notes (read mode) */}
          {!editMode && (
            <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: habit.description ? 8 : 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Notes
                </p>
                <button
                  onClick={() => { setEditName(habit.name); setEditIcon(habit.icon ?? 'circle-check'); setEditColor(habit.color || '#555555'); setEditNotes(habit.description ?? ''); setEditMode(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontSize: 12.5, fontWeight: 700, padding: 0 }}
                >
                  {habit.description ? 'Edit' : 'Add'}
                </button>
              </div>
              {habit.description ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: TEXT_DARK, whiteSpace: 'pre-wrap' }}>
                  {habit.description}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 13.5, color: TEXT_MUTED }}>
                  No notes yet — tap “Add” to jot why this habit matters.
                </p>
              )}
            </div>
          )}

          {/* Stat pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatPill label="Current Streak" value={`${habit.current_streak}d`} accent color={PURPLE} />
            <StatPill label="Longest Streak" value={`${habit.longest_streak}d`} />
            <StatPill label="30-day Rate" value={`${rate}%`} accent color={PURPLE} />
            <StatPill label="Total Done" value={`${habit.total_completions}`} />
          </div>

          {/* Weekly report — this habit, last 7 days */}
          <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '14px 12px 10px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px', marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Weekly report
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE }}>{weekChartAvg}% avg</span>
            </div>
            {loading
              ? <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '24px 0' }}>Loading…</p>
              : <WeeklyReportChart data={weekChart} avg={weekChartAvg} color={PURPLE} />}
          </div>

          {/* Calendar */}
          <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '16px 14px', marginBottom: 14 }}>
            {/* Month header + navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button
                onClick={() => setMonthOffset((o) => o - 1)}
                disabled={!canGoBack}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: canGoBack ? PURPLE_LIGHT : 'transparent',
                  border: 'none', cursor: canGoBack ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: canGoBack ? PURPLE : 'var(--drag-handle)', fontSize: 18, fontWeight: 700,
                }}
              >‹</button>

              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.01em' }}>
                  {MONTHS[calMonth]} {calYear}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_MUTED }}>
                  {monthDone} done · {monthRate}% this month
                </p>
              </div>

              <button
                onClick={() => setMonthOffset((o) => o + 1)}
                disabled={!canGoForward}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: canGoForward ? PURPLE_LIGHT : 'transparent',
                  border: 'none', cursor: canGoForward ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: canGoForward ? PURPLE : 'var(--drag-handle)', fontSize: 18, fontWeight: 700,
                }}
              >›</button>
            </div>

            {loading ? (
              <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, textAlign: 'center', padding: '16px 0' }}>Loading…</p>
            ) : (() => {
              const weeks = Array.from(
                { length: Math.ceil(calCells.length / 7) },
                (_, wi) => calCells.slice(wi * 7, (wi + 1) * 7)
              );
              const CELL_H = 'clamp(30px, 10vw, 40px)';
              const rowStyle: React.CSSProperties = { display: 'flex', gap: '4px', width: '100%' };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  {/* Day-of-week headers */}
                  <div style={rowStyle}>
                    {DOW_LABELS.map((d, i) => (
                      <div key={i} style={{
                        flex: '1 1 0', textAlign: 'center',
                        fontSize: 10, fontWeight: 700, color: TEXT_MUTED,
                        paddingBottom: 4,
                      }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Week rows */}
                  {weeks.map((week, wi) => (
                    <div key={wi} style={rowStyle}>
                      {week.map((cell, di) => {
                        if (!cell) {
                          return <div key={di} style={{ flex: '1 1 0', height: CELL_H }} />;
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
                          <motion.div
                            key={di}
                            whileHover={interactive ? { scale: 1.1, zIndex: 5 } : {}}
                            whileTap={interactive ? { scale: 0.92 } : {}}
                            onClick={interactive && !isSaving ? () => setActiveLogDate(cell.date) : undefined}
                            title={interactive ? (cell.completed ? 'Tap to view details/unmark' : 'Tap to view details/mark done') : undefined}
                            style={{
                              flex: '1 1 0', minWidth: 0,
                              height: CELL_H,
                              borderRadius: 10,
                              background: bg,
                              border: isSelected
                                ? '2px solid #ffffff'
                                : cell.isToday
                                  ? `2px solid ${PURPLE_HEX}`
                                  : '1px solid transparent',
                              boxShadow: isSelected
                                ? `0 0 16px ${PURPLE_HEX}`
                                : cell.completed
                                  ? `0 4px 12px color-mix(in srgb, ${PURPLE} 35%, transparent)`
                                  : 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11.5,
                              fontWeight: cell.isToday || isSelected || cell.completed ? 850 : 500,
                              color: txtColor,
                              cursor: interactive ? 'pointer' : 'default',
                              opacity: isSaving ? 0.5 : 1,
                              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', width: '100%' }}>
                              <span>{cell.day}</span>
                              {hasVideo && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: 3,
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  background: cell.completed ? '#fff' : PURPLE,
                                }} />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { bg: PURPLE, label: 'Done', txt: '#fff' },
                      { bg: PURPLE_LIGHT, label: 'Missed', txt: TEXT_MUTED },
                      { bg: 'transparent', label: 'Today', txt: PURPLE_HEX, border: `2px solid ${PURPLE_HEX}` },
                    ].map(({ bg, label, txt, border }) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 9999,
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: bg, border: border ?? 'none',
                        }} />
                        <span style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Daily Log & Video Proof Card */}
          <div style={{ ...GLASS_NESTED, borderRadius: 20, padding: '18px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 750, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 7 }}>
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 9999,
                  border: activeEntry?.is_completed
                    ? `1px solid ${PURPLE}`
                    : '1px solid var(--border-default)',
                  background: activeEntry?.is_completed
                    ? `color-mix(in srgb, ${PURPLE} 16%, var(--bg-card))`
                    : 'var(--bg-tertiary)',
                  color: activeEntry?.is_completed ? PURPLE : 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: 'none',
                }}
              >
                <CheckCircle2 size={15} color={activeEntry?.is_completed ? PURPLE : 'var(--text-muted)'} />
                <span>{activeEntry?.is_completed ? 'Completed' : 'Mark Done'}</span>
              </motion.button>
            </div>

            {/* Notes input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 750, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Entry Notes
              </span>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                borderRadius: 12, padding: '4px 6px 4px 12px',
                transition: 'border-color 0.15s ease',
              }}>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="What did you achieve today?"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 13,
                    color: TEXT_DARK,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
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
                  style={{
                    padding: '7px 14px',
                    borderRadius: 9999,
                    border: 'none',
                    background: notesInput === (activeEntry?.notes ?? '') ? 'var(--bg-tertiary)' : PURPLE,
                    color: notesInput === (activeEntry?.notes ?? '') ? 'var(--text-muted)' : 'var(--accent-on-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: notesInput === (activeEntry?.notes ?? '') ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {savingNotes ? 'Saving…' : 'Save'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Completion rate bar */}
          <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_DARK }}>
                {MONTHS[calMonth]} Completion
              </p>
              <span style={{ fontSize: 13, fontWeight: 700, color: PURPLE }}>{monthRate}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: PURPLE_LIGHT, overflow: 'hidden' }}>
              <motion.div
                key={`${calYear}-${calMonth}`}
                initial={{ width: 0 }}
                animate={{ width: `${monthRate}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${PURPLE}, color-mix(in srgb, ${PURPLE} 65%, #fff))`, borderRadius: 5 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0 0', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>
                <span style={{ fontWeight: 700, color: TEXT_DARK }}>{monthDone}</span> of {daysElapsed} days completed
              </p>
              <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 700, color: TEXT_DARK }}>{daysRemaining}</span> {daysRemaining === 1 ? 'day' : 'days'} left
              </p>
            </div>
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                marginTop: 16, width: '100%', padding: '14px 0', borderRadius: 16, border: 'none',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Delete Habit
            </button>
          ) : (
            <div style={{ marginTop: 16, background: 'rgba(104, 104, 104,0.08)', borderRadius: 16, padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6a6a6a', fontWeight: 600, textAlign: 'center' }}>
                Delete &quot;{habit.name}&quot;? This removes all history and cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                    background: 'rgba(104, 104, 104, 0.08)', color: '#6a6a6a', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                    background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
                    opacity: deleting ? 0.7 : 1,
                  }}
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
  const orbBase: React.CSSProperties = {
    width: 38, height: 38, borderRadius: '50%', padding: 0, border: 'none',
    cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
            style={{
              ...orbBase,
              background: orbGloss(c),
              boxShadow: active
                ? `inset 0 1px 1px rgba(255, 255, 255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${c}`
                : 'inset 0 1px 1px rgba(255, 255, 255,0.45)',
              transform: active ? 'scale(1.08)' : 'scale(1)',
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
        style={{
          ...orbBase,
          position: 'relative', overflow: 'hidden',
          background: isCustom
            ? orbGloss(value)
            : 'conic-gradient(from 90deg, #6a6a6a, #a6a6a6, #b2b2b2, #9b9b9b, #939393, #7b7b7b, #707070, #717171, #6a6a6a)',
          boxShadow: isCustom
            ? `inset 0 1px 1px rgba(255, 255, 255,0.45), 0 0 0 2px var(--glass-bg-sheet), 0 0 0 4px ${value}`
            : 'inset 0 1px 1px rgba(255, 255, 255,0.45)',
          transform: isCustom ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <input
          type="color"
          value={isCustom ? value : '#555555'}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
        />
        {isCustom ? <CheckIcon /> : <Plus size={18} color="#fff" strokeWidth={2.6} style={{ filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0,0.35))' }} />}
      </label>
    </div>
  );
}

type FreqType = 'daily' | 'weekly' | 'x_per_week';
type TargetType = 'boolean' | 'duration';

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...GLASS_NESTED, borderRadius: 18, padding: '16px 16px', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</p>;
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

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--input-bg)', border: `1.5px solid var(--input-border)`,
    borderRadius: 12, padding: '13px 16px',
    fontSize: 16, fontWeight: 600, color: TEXT_DARK,
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0, 0, 0,0.45)' }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 30, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 480,
            background: 'var(--glass-bg-sheet)',
            borderRadius: 24,
            maxHeight: '90dvh', overflowY: 'auto',
            padding: '24px 16px 32px',
            fontFamily: "system-ui, -apple-system, sans-serif",
            boxShadow: '0 24px 64px rgba(31, 31, 31,0.40), inset 0 1px 0 rgba(255, 255, 255,0.12)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 0, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
                {isBadHabit ? 'Track Bad Habit' : 'New Habit'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: TEXT_MUTED }}>
                {isBadHabit ? 'Check off days you successfully avoided it' : 'Build a streak that sticks'}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: '50%', background: PURPLE_MID,
              border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>×</button>
          </div>

          {/* Good / Bad toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setIsBadHabit(false); if (isBadHabit) { setIcon('circle-check'); setColor(accentHex); } }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 14, border: 'none',
                background: !isBadHabit ? accentHex : 'var(--bg-elevated)',
                color: !isBadHabit ? '#fff' : TEXT_MUTED,
                fontSize: 13, fontWeight: !isBadHabit ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: !isBadHabit ? `0 2px 12px color-mix(in srgb, ${accentHex} 35%, transparent)` : 'none',
              }}
            >
              <CheckCircle2 size={15} />
              Good Habit
            </button>
            <button
              type="button"
              onClick={() => { setIsBadHabit(true); if (!isBadHabit) { setIcon('ban'); setColor(RED); } }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 14, border: 'none',
                background: isBadHabit ? RED : 'var(--bg-elevated)',
                color: isBadHabit ? '#fff' : TEXT_MUTED,
                fontSize: 13, fontWeight: isBadHabit ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: isBadHabit ? '0 2px 12px rgba(248,113,113,0.35)' : 'none',
              }}
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
              style={{ ...inputStyle, border: `1.5px solid ${error && !name.trim() ? '#6a6a6a' : 'var(--input-border)'}` }}
              onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
            />

            <div style={{ marginTop: 14 }}>
              <FieldLabel>Notes (optional)</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why this matters, how you'll do it…"
                maxLength={500}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 64, lineHeight: 1.5, border: '1.5px solid var(--input-border)' }}
                onFocus={(e) => { e.target.style.borderColor = PURPLE; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--input-border)'; }}
              />
            </div>
          </SectionCard>

          {/* ── Icon + Color ── */}
          <SectionCard>
            <FieldLabel>Icon</FieldLabel>
            <div className="hf-icon-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 12,
            }}>
              {(showAllIcons ? HABIT_ICONS : HABIT_ICONS.slice(0, 6)).map((ic) => {
                const active = icon === ic;
                return (
                  <button key={ic} onClick={() => setIcon(ic)} title={ic} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 12,
                    border: `1.5px solid ${active ? PURPLE : 'transparent'}`,
                    background: active ? 'var(--surface-tint-mid)' : PURPLE_LIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                  }}>
                    <DynamicIcon name={ic} size={20} color={active ? PURPLE : TEXT_MUTED} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowAllIcons((v) => !v)}
              style={{
                border: 'none', background: 'transparent', color: PURPLE,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '2px 0',
                marginBottom: 18,
              }}
            >
              {showAllIcons ? 'Show less' : `View more (${HABIT_ICONS.length - 6})`}
            </button>
            <FieldLabel>Color</FieldLabel>
            <ColorPicker value={color} onChange={setColor} />
          </SectionCard>

          {/* ── Frequency ── */}
          <SectionCard>
            <FieldLabel>How often</FieldLabel>
            <div style={{ display: 'flex', background: 'var(--surface-tint)', borderRadius: 12, padding: 3, gap: 3, marginBottom: 14 }}>
              {freqTabs.map(({ key, label }) => (
                <button key={key} onClick={() => setFreqType(key)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none',
                  background: freqType === key ? PURPLE : 'transparent',
                  color: freqType === key ? '#fff' : TEXT_MUTED,
                  fontSize: 12, fontWeight: freqType === key ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{label}</button>
              ))}
            </div>

            {freqType === 'weekly' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {DAY_LABELS.map((label, idx) => {
                  const active = days.includes(idx);
                  return (
                    <button key={idx} onClick={() => toggleDay(idx)} style={{
                      width: 38, height: 38, borderRadius: '50%', border: 'none',
                      background: active ? color : 'var(--bg-elevated)',
                      color: active ? '#fff' : TEXT_MUTED,
                      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: active ? `0 2px 8px color-mix(in srgb, ${color} 30%, transparent)` : 'none',
                    }}>{label}</button>
                  );
                })}
              </div>
            )}

            {freqType === 'x_per_week' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_DARK, fontWeight: 600 }}>
                  {perWeek}× per week
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setPerWeek((n) => Math.max(1, n - 1))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'var(--surface-tint)', color: PURPLE, fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ width: 28, textAlign: 'center', fontSize: 20, fontWeight: 800, color: TEXT_DARK }}>{perWeek}</span>
                  <button onClick={() => setPerWeek((n) => Math.min(7, n + 1))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: PURPLE, color: '#fff', fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Target / Timer ── */}
          <SectionCard>
            <FieldLabel>Target type</FieldLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: targetType === 'duration' ? 16 : 0 }}>
              {(['boolean', 'duration'] as TargetType[]).map((t) => (
                <button key={t} onClick={() => setTargetType(t)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: targetType === t ? color : 'var(--bg-elevated)',
                  color: targetType === t ? '#fff' : TEXT_MUTED,
                  fontSize: 13, fontWeight: targetType === t ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: targetType === t ? `0 2px 10px color-mix(in srgb, ${color} 25%, transparent)` : 'none',
                }}>
                  {t === 'boolean' ? 'Check-off' : 'Duration'}
                </button>
              ))}
            </div>

            {targetType === 'duration' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_DARK, fontWeight: 600 }}>{duration} minutes</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setDuration((n) => Math.max(5, n - 5))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'var(--surface-tint)', color: PURPLE, fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 20, fontWeight: 800, color: TEXT_DARK }}>{duration}</span>
                  <button onClick={() => setDuration((n) => Math.min(240, n + 5))} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: PURPLE, color: '#fff', fontSize: 22, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(104, 104, 104,0.08)', border: '1px solid rgba(104, 104, 104,0.2)', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6a6a6a', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 9999, border: 'none',
              background: loading ? 'var(--accent-light)' : 'var(--accent-primary)',
              color: 'var(--accent-on-primary)', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s',
            }}
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
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 18,
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 16,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'var(--surface-tint)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {suffix && <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dimmed)', marginLeft: 2 }}>{suffix}</span>}
        </p>
        {sub && (
          <p style={{ margin: '7px 0 0', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 20,
      padding: 20,
      minWidth: 0,
      ...style,
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h3>
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
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'var(--accent-on-primary)' : 'var(--text-secondary)',
        fontSize: 14, fontWeight: active ? 700 : 600, fontFamily: 'inherit', textAlign: 'left',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-tint)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* White pill header button */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
          background: '#ffffff',
          color: '#1a1a1a',
          fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', textAlign: 'left',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <span style={{ display: 'flex', flexShrink: 0, color: '#1a1a1a' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'flex', alignItems: 'center' }}
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
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 0,
              paddingLeft: 14,
              borderLeft: '2px solid rgba(255,255,255,0.12)',
              marginLeft: 10,
              marginTop: 2,
              marginBottom: 4,
            }}>
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
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
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
    setLocalHabits((prev) => [...prev, { ...saved, todayEntry: null, completionRate: 0 } as HabitWithEntry]);
    setAddOpen(false);
  };

  const handleUpdate = (updated: Partial<HabitWithEntry> & { id: string }) => {
    setLocalHabits((prev) => prev.map((h) => h.id === updated.id ? { ...h, ...updated } : h));
  };

  const handleDelete = (id: string) => {
    setLocalHabits((prev) => prev.filter((h) => h.id !== id));
    setSelectedId(null);
  };

  const goodHabits = localHabits.filter((h) => !h.is_bad_habit);

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
  const badHabits = localHabits.filter((h) => h.is_bad_habit);
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
    <div style={{
      background: 'var(--bg-primary)',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
      minHeight: '100dvh',
    }}>
      {/* Desktop Sidebar is rendered by layout.tsx */}

      {/* ───────────────── Main ───────────────── */}
      <div>
        <div
          className="hf-dashboard-main-container"
          style={{
            maxWidth: 1280, margin: '0 auto',
            padding: 'clamp(18px, 2.5vw, 32px) clamp(16px, 2.5vw, 32px) 72px',
            display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 22px)',
          }}
        >
          {/* ── Top Hero Greeting Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 12%, var(--bg-card)) 0%, var(--bg-card) 100%)',
              border: '1px solid var(--border-default)',
              borderRadius: 24,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient background glow */}
            <div style={{
              position: 'absolute', top: '-40%', right: '-10%', width: 300, height: 300,
              borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow-lg) 0%, transparent 70%)',
              pointerEvents: 'none', filter: 'blur(30px)',
            }} />

            <div style={{ minWidth: 0, zIndex: 1, flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {dateStr}
                </span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-medium)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{completedCount}</span>/{totalCount} Completed Today
                </span>
              </div>
              <h1 style={{
                margin: 0, fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif",
              }}>
                {greeting}, {displayName.split(' ')[0]}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {todayPct === 100
                  ? 'Amazing job! All habits completed for today.'
                  : todayPct >= 50
                  ? `Great progress! You're ${todayPct}% done with today's habits.`
                  : 'Let\'s crush today\'s goals one habit at a time.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
              <button
                className="hf-add-habit-btn"
                onClick={() => setAddOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 8px 24px color-mix(in srgb, var(--accent-primary) 35%, transparent)',
                  transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <Plus size={18} strokeWidth={2.6} />
                <span className="hf-dash-btn-label">Add Habit</span>
              </button>
              <Link
                className="hf-profile-link"
                href="/dashboard/settings"
                aria-label="Open profile settings"
                style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'var(--surface-tint)', border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-primary)', transition: 'background 0.15s ease, transform 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <User size={20} color="var(--text-primary)" />
              </Link>
            </div>
          </motion.div>

          {/* ── 4 Top KPI Metric Cards ── */}
          <div
            className="hf-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {/* Card 1: Today's Completion */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 9999, padding: '14px 28px', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Target size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today Progress</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {todayPct}%
                </div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                  {completedCount}/{totalCount} done
                </p>
              </div>
            </motion.div>

            {/* Card 2: Active Streak */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 9999, padding: '14px 28px', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Flame size={14} color="#FB923C" />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 24, fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stats?.bestStreak ?? 0} <span style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-muted)' }}>d</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                  {stats?.bestStreakHabitName ? `in "${stats.bestStreakHabitName.slice(0, 12)}${stats.bestStreakHabitName.length > 12 ? '…' : ''}"` : 'momentum'}
                </p>
              </div>
            </motion.div>

            {/* Card 3: Consistency Score */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 9999, padding: '14px 28px', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <TrendingUp size={14} color="#38BDF8" />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consistency</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {avgPct}%
                </div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                  7-day avg
                </p>
              </div>
            </motion.div>

            {/* Card 4: Total Done */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 9999, padding: '14px 28px', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Trophy size={14} color="#A855F7" />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Done</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 850, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stats?.totalCompletions ?? 0}
                </div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                  lifetime
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Week day selector ── */}
          <DashCard
            title={isViewingToday ? '7-Day Overview' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            action={
              !isViewingToday ? (
                <button
                  onClick={() => selectDate(todayString())}
                  style={{ background: 'var(--surface-tint)', border: '1px solid var(--border-default)', borderRadius: 9999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Jump to today
                </button>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{dateStr}</span>
              )
            }
          >
            <div className="hf-weekly-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
              {weekDates.map(({ date, dayNum, dayLabel, isToday, pct }) => {
                const R = 19, CIRC = 2 * Math.PI * R;
                const isSelected = date === selectedDate;
                return (
                  <div
                    key={date}
                    onClick={() => selectDate(date)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {dayLabel}
                    </span>
                    <div style={{ position: 'relative', width: 42, height: 42 }}>
                      <svg width="42" height="42" style={{ position: 'absolute', inset: 0 }}>
                        <circle cx="21" cy="21" r={R} fill="none" style={{ stroke: `color-mix(in srgb, ${accentHex} 22%, transparent)` }} strokeWidth="2.5" />
                        <circle cx="21" cy="21" r={R} fill="none" stroke={accentHex}
                          strokeWidth="2.5" strokeLinecap="round"
                          strokeDasharray={CIRC}
                          strokeDashoffset={CIRC * (1 - (isToday ? todayPct : pct) / 100)}
                          transform="rotate(-90 21 21)"
                          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute', inset: 5, borderRadius: '50%',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.18s ease',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--accent-on-primary)' : 'var(--text-primary)' }}>
                          {dayNum}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashCard>

          {/* ── 2-column widget grid ── */}
          <div className="hf-dashboard-grid">
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 22px)', minWidth: 0 }}>
              <DashCard
                title={isViewingToday ? "Today's Habits" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                action={
                  <span style={{ fontSize: 13, fontWeight: 600, color: loadingDate ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {loadingDate ? 'Loading…' : `${completedCount}/${totalCount} done`}
                  </span>
                }
              >
                {displayHabits.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', border: '1px dashed var(--border-default)', borderRadius: 18 }}>
                    <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-muted)' }}>No active habits yet.</p>
                    <button
                      onClick={() => setAddOpen(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 9999, border: 'none', background: 'var(--accent-primary)', color: 'var(--accent-on-primary)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <Plus size={16} strokeWidth={2.6} /> Add your first habit
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {displayHabits.map((h, i) => (
                      <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} />
                    ))}
                    {displayHabitsFull.length > 5 && (
                      <motion.button
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setShowAllGoodHabits(!showAllGoodHabits)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '12px 20px',
                          borderRadius: 9999,
                          border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 12%, var(--bg-tertiary)) 0%, var(--bg-tertiary) 100%)',
                          color: 'var(--text-primary)',
                          fontSize: 13.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          width: '100%',
                          marginTop: 6,
                          backdropFilter: 'blur(10px)',
                          boxShadow: 'none',
                          transition: 'all 0.2s ease',
                        }}
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

              <DashCard title="Weekly Completion Trend" action={<span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{avgPct}% avg</span>}>
                <WeeklyReportChart
                  data={weekBars.map(({ date, dayLabel, dayNum, pct, isToday }) => ({ date, label: dayLabel, dayNum, pct, isToday }))}
                  avg={avgPct}
                />
              </DashCard>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2vw, 22px)', minWidth: 0 }}>
              <DashCard
                title="Consistency Score"
                action={avgPct > 0 ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{avgPct}%</span> : null}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 5 }}>
                    {weekBars.map(({ date, dayLabel, dayNum, pct, isToday }, i) => {
                      const TRACK_H = 88;
                      const barH = Math.max(pct > 0 ? 8 : 0, Math.round((pct / 100) * TRACK_H));
                      return (
                        <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <div style={{
                            width: '100%', height: TRACK_H, borderRadius: 9999,
                            background: 'var(--surface-tint)',
                            position: 'relative', overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: barH }}
                              transition={{ duration: 0.5, delay: 0.08 + i * 0.05, ease: 'easeOut' }}
                              style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                borderRadius: 9999,
                                background: isToday
                                  ? 'var(--accent-primary)'
                                  : 'color-mix(in srgb, var(--accent-primary) 52%, transparent)',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: 9, fontWeight: 500, color: isToday ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {dayLabel}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {dayNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {avgPct > 0 && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0,
                      top: 88 - Math.round((avgPct / 100) * 88),
                      borderTop: '1.5px dashed var(--border-medium)',
                      pointerEvents: 'none', zIndex: 2,
                    }}>
                      <span style={{
                        position: 'absolute', left: 0, top: -9,
                        fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                        background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4,
                      }}>
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
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: 9999,
                      background: 'rgba(248, 113, 113, 0.12)',
                      border: '1px solid rgba(248, 113, 113, 0.3)',
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 750, color: RED_SOFT }}>
                        {loadingDate ? 'Loading…' : `${avoidedCount}/${displayBadHabits.length} avoided`}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddBadDefault(true); setAddOpen(true); }}
                      style={{
                        padding: '5px 12px', borderRadius: 9999, border: 'none',
                        background: RED_LIGHT, color: RED_SOFT,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <Plus size={13} /> Add
                    </button>
                  )
                }
              >
                {displayBadHabits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 12px 8px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: RED_LIGHT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}>
                      <Ban size={22} color={RED_SOFT} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>No bad habits tracked</p>
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: TEXT_MUTED, lineHeight: 1.4 }}>
                      Add habits you want to break — check off each day you resist them
                    </p>
                    <button
                      onClick={() => { setAddBadDefault(true); setAddOpen(true); }}
                      style={{
                        padding: '9px 20px', borderRadius: 9999, border: 'none',
                        background: RED, color: '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 2px 10px rgba(248,113,113,0.35)',
                      }}
                    >
                      <Plus size={14} /> Track a bad habit
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {displayBadHabits.map((h, i) => (
                      <HabitRow key={h.id} habit={h} index={i} onToggle={handleToggle} onOpen={setSelectedId} bad />
                    ))}
                  </div>
                )}
              </DashCard>

              {/* ── Quick Action Shortcuts ── */}
              <DashCard title="Quick Actions">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <Link
                    href="/dashboard/analytics"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      borderRadius: 14, background: 'var(--surface-tint)', color: 'var(--text-primary)',
                      textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'background 0.15s ease',
                    }}
                  >
                    <BarChart3 size={18} color="var(--accent-primary)" />
                    Analytics
                  </Link>
                  <Link
                    href="/dashboard/achievements"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      borderRadius: 14, background: 'var(--surface-tint)', color: 'var(--text-primary)',
                      textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'background 0.15s ease',
                    }}
                  >
                    <Trophy size={18} color="#FB923C" />
                    Trophies
                  </Link>
                  <Link
                    href="/dashboard/year-in-review"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      borderRadius: 14, background: 'var(--surface-tint)', color: 'var(--text-primary)',
                      textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'background 0.15s ease',
                    }}
                  >
                    <Sparkles size={18} color="#A855F7" />
                    Year Review
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      borderRadius: 14, background: 'var(--surface-tint)', color: 'var(--text-primary)',
                      textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'background 0.15s ease',
                    }}
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
          .hf-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
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

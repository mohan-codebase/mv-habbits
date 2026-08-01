'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Pencil, Archive, Trash2, Flame, Shield, GripVertical, Check } from 'lucide-react';
import { DynamicIcon } from '@/lib/icons';
import type { HabitWithEntry } from '@/types/habit';

interface HabitCardProps {
  habit: HabitWithEntry;
  onToggle: (habitId: string, completed: boolean) => void;
  onEdit?: (habit: HabitWithEntry) => void;
  onArchive?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  onOpen?: (habitId: string) => void;
  dragHandleProps?: any;
}

function freqLabel(habit: HabitWithEntry): string {
  const f = habit.frequency;
  if (f.type === 'daily') return 'Daily';
  if (f.type === 'weekly') {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (f.days ?? []).map((d) => names[d]).join(' · ') || 'Weekly';
  }
  if (f.type === 'x_per_week') return `${f.count ?? 1}×/wk`;
  if (f.type === 'x_per_month') return `${f.count ?? 1}×/mo`;
  return 'Daily';
}

function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '7px 10px',
        background: hov ? (danger ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)') : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-primary)',
        fontSize: 12.5,
        fontWeight: 500,
        textAlign: 'left',
        transition: 'all 0.12s ease',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const HabitCard = React.memo(({ habit, onToggle, onEdit, onArchive, onDelete, onOpen, dragHandleProps }: HabitCardProps) => {
  const [checked, setChecked] = useState(habit.todayEntry?.is_completed ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChecked(habit.todayEntry?.is_completed ?? false);
  }, [habit.todayEntry?.is_completed]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const val = !checked;
    setChecked(val);
    onToggle(habit.id, val);
  }, [habit.id, checked, onToggle]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const isBad = habit.is_bad_habit === true;
  const completed = checked;
  const streak = habit.current_streak ?? 0;
  const hasMenu = Boolean(onEdit || onArchive || onDelete);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      className={`group relative w-full h-12 rounded-xl border transition-all duration-200 overflow-hidden ${
        completed
          ? 'bg-[var(--bg-card)] border-[var(--border-accent)] opacity-80'
          : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-subtle)] hover:border-[var(--border-accent)] shadow-sm'
      }`}
    >
      {/* Top Accent Gradient Line when completed */}
      {completed && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />
      )}

      {/* Single-Line Flex Container */}
      <div className="h-full px-3 flex items-center justify-between gap-2.5">
        
        {/* Left Section: Single-Line Habit Metadata */}
        <div
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          onClick={() => onOpen?.(habit.id)}
        >
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              className="text-[var(--text-dimmed)] hover:text-[var(--text-secondary)] p-0.5 cursor-grab active:cursor-grabbing shrink-0"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </div>
          )}

          {/* Compact Icon */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
              completed
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            <DynamicIcon name={habit.icon} size={15} color={completed ? '#c084fc' : 'var(--text-secondary)'} />
          </div>

          {/* Habit Name */}
          <span
            className={`text-xs sm:text-sm font-semibold font-['Outfit'] truncate transition-colors ${
              completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
            }`}
          >
            {habit.name}
          </span>

          {/* Streak Badge (Single-line inline pill) */}
          {streak > 0 && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${
                isBad
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {isBad ? <Shield size={9} /> : <Flame size={9} className="animate-pulse" />}
              {streak}d
            </span>
          )}

          {/* Bad habit avoid tag */}
          {isBad && (
            <span className="text-[9px] uppercase font-extrabold px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
              Avoid
            </span>
          )}

          {/* Subtext frequency pill (Desktop / wide view) */}
          <span className="hidden md:inline-block text-[11px] text-slate-500 truncate">
            • {freqLabel(habit)}
          </span>
        </div>

        {/* Right Section: Options Menu & Compact Check Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Options Dropdown */}
          {hasMenu && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label="Options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal size={15} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-2xl p-1 min-w-[130px] z-30"
                  >
                    {onEdit && (
                      <MenuItem
                        icon={<Pencil size={13} />}
                        label="Edit"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(habit);
                        }}
                      />
                    )}
                    {onArchive && (
                      <MenuItem
                        icon={<Archive size={13} />}
                        label="Archive"
                        onClick={() => {
                          setMenuOpen(false);
                          onArchive(habit.id);
                        }}
                      />
                    )}
                    {onDelete && (
                      <>
                        <div className="h-px bg-white/10 my-1" />
                        <MenuItem
                          icon={<Trash2 size={13} />}
                          label="Delete"
                          onClick={() => {
                            setMenuOpen(false);
                            onDelete(habit.id);
                          }}
                          danger
                        />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Compact Checkmark Button (Single-line row fit) */}
          <button
            type="button"
            onClick={handleToggle}
            aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
              completed
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                : 'bg-white/[0.05] hover:bg-purple-500/20 text-slate-500 hover:text-purple-300 border border-white/15 hover:border-purple-500/50'
            }`}
          >
            {completed ? (
              <Check size={15} strokeWidth={3} className="animate-in zoom-in-50 duration-150" />
            ) : (
              <Check size={14} strokeWidth={2.5} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>

      </div>
    </motion.div>
  );
});

HabitCard.displayName = 'HabitCard';
export default HabitCard;

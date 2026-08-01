'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Pencil, Archive, Trash2, Flame, Shield, Target, BadgeCheck, GripVertical, Check } from 'lucide-react';
import { DynamicIcon } from '@/lib/icons';
import type { HabitWithEntry } from '@/types/habit';
import ShareButton from '@/components/social/ShareButton';
import SwipeToComplete from '@/components/ui/SwipeToComplete';

interface HabitCardProps {
  habit: HabitWithEntry;
  onToggle: (habitId: string, completed: boolean) => void;
  onEdit?: (habit: HabitWithEntry) => void;
  onArchive?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  onOpen?: (habitId: string) => void;
  dragHandleProps?: any;
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex === 'var(--accent-primary)') return `color-mix(in srgb, var(--accent-primary) ${alpha * 100}%, transparent)`;
  if (hex === 'var(--accent-light)') return `color-mix(in srgb, var(--accent-light) ${alpha * 100}%, transparent)`;
  if (!hex?.startsWith('#')) return `rgba(var(--accent-primary-rgb), ${alpha})`;
  const s = hex.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function freqLabel(habit: HabitWithEntry): string {
  const f = habit.frequency;
  if (f.type === 'daily') return 'Daily';
  if (f.type === 'weekly') {
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return (f.days ?? []).map((d) => names[d]).join(' · ') || 'Weekly';
  }
  if (f.type === 'x_per_week') return `${f.count ?? 1}× / week`;
  if (f.type === 'x_per_month') return `${f.count ?? 1}× / month`;
  return '';
}

// Maps habit categories or names to high-quality cover photos
function getHabitCoverImage(habit: HabitWithEntry): string {
  const name = habit.name.toLowerCase();
  const category = habit.category?.name.toLowerCase() ?? '';
  const isBad = habit.is_bad_habit === true;

  if (isBad) {
    return 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=80';
  }

  const query = `${name} ${category}`;

  if (query.match(/(gym|workout|fitness|exercise|run|lift|cardio|sport|train|body|muscle|yoga|stretching)/)) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80';
  }
  if (query.match(/(learn|code|read|study|book|write|productivity|work|focus|computer|coding|language)/)) {
    return 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80';
  }
  if (query.match(/(meditate|mind|breathe|sleep|relax|calm|peace|zen|journal)/)) {
    return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80';
  }
  if (query.match(/(food|water|diet|eat|nutrition|drink|hydrate|health|fruit|vege|cooking)/)) {
    return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80';
  }
  if (query.match(/(money|finance|budget|save|spend|invest|coin|crypto)/)) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80';
  }

  // Elegant abstract cover
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
}

function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-2.5 py-2 border-none rounded-sm cursor-pointer text-[13px] font-medium text-left transition-all duration-[120ms] bg-transparent ${
        danger
          ? 'text-[#8e8e8e] hover:bg-[rgba(104,104,104,0.12)] hover:text-danger'
          : 'text-text-secondary hover:bg-bg-elevated'
      }`}
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
    e.stopPropagation(); // prevent card click / sheet opening
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
  let color = habit.color ?? 'var(--accent-primary)';
  if (!isBad && (color.toUpperCase() === '#919191' || color.toUpperCase() === '#b4b4b4' || color.toUpperCase() === '#686868' || color.toUpperCase() === '#555555')) color = 'var(--accent-primary)';
  if (isBad && color === 'var(--accent-primary)') color = '#6a6a6a';
  const completed = checked;
  const streak = habit.current_streak ?? 0;
  const coverImage = getHabitCoverImage(habit);

  const hasMenu = Boolean(onEdit || onArchive || onDelete);

  const cardContent = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {/* Background Image (100% Card Height) */}
      <img
        src={coverImage}
        alt={habit.name}
        className="habit-card-image absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-[400ms] ease-in-out"
      />

      {/* Dark gradient overlay for bottom text legibility */}
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.3)_40%,rgba(0,0,0,0.65)_70%,rgba(0,0,0,0.92)_100%)]" />

      {/* Content wrapper */}
      <div className="relative h-full z-[2] flex flex-col justify-between p-5 box-border">
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full">
          {/* Habit Icon (Glassmorphic) */}
          <div className="flex items-center gap-2">
            <div className="w-[38px] h-[38px] rounded-full bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.25)] flex items-center justify-center shadow-none">
              <DynamicIcon name={habit.icon} size={18} color="#ffffff" />
            </div>

            {/* Category badge */}
            {habit.category && (
              <div className="px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.25)] text-white text-[10px] font-[750] tracking-[0.02em]">
                {habit.category.name}
              </div>
            )}
          </div>

          {/* Action Tools (Right) */}
          <div className="flex items-center gap-1.5">
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.25)] flex items-center justify-center cursor-grab text-white opacity-80"
              >
                <GripVertical size={14} />
              </div>
            )}

            {/* Options Menu */}
            {hasMenu && (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  aria-label="Options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.25)] text-white cursor-pointer"
                >
                  <MoreHorizontal size={14} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -4 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-[calc(100%+6px)] bg-bg-elevated border border-border-default rounded-[11px] shadow-none p-[5px] min-w-[140px] z-30"
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
                          <div className="h-px bg-border-subtle my-1 mx-0.5" />
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
          </div>
        </div>

        {/* Bottom Details Section */}
        <div className="flex flex-col gap-3.5">
          <div>
            {/* Habit Title */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-[22px] font-extrabold text-white tracking-[-0.025em] m-0 [text-shadow:0_2px_4px_rgba(0,0,0,0.5)] truncate">
                {habit.name}
              </h3>
              {completed && (
                <BadgeCheck
                  size={20}
                  color="#919191"
                  fill="white"
                  className="flex-shrink-0 [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.25))]"
                />
              )}
              {isBad && (
                <span className="text-[8.5px] font-extrabold px-[5px] py-px rounded-full bg-[rgba(104,104,104,0.2)] border border-[rgba(104,104,104,0.4)] text-[#8e8e8e] tracking-[0.04em] uppercase flex-shrink-0">
                  Avoid
                </span>
              )}
            </div>

            {/* Description/Bio (White text) */}
            <p className="text-base text-[rgba(255,255,255,0.75)] leading-[1.4] m-0 line-clamp-2 h-[38px] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
              {habit.description || (isBad ? 'Avoid this trigger to build healthy resilience.' : `Frequency: ${freqLabel(habit)}`)}
            </p>
          </div>

          {/* Stats Indicators (Streak & Rate) */}
          <div className="flex items-center gap-2.5">
            {/* Streak Pill */}
            <div
              title="Current streak"
              className={`flex items-center gap-[5px] px-2.5 py-1 rounded-full border text-[12px] font-extrabold shadow-none ${
                isBad
                  ? 'bg-[rgba(239,68,68,0.2)] border-[rgba(239,68,68,0.4)] text-[#fca5a5]'
                  : 'bg-[rgba(245,158,11,0.22)] border-[rgba(245,158,11,0.4)] text-[#fbbf24]'
              }`}
            >
              {isBad ? (
                <Shield size={13} color="#fca5a5" />
              ) : (
                <Flame size={13} color="#fbbf24" />
              )}
              <span>{streak}d streak</span>
            </div>

            {/* Rate Pill */}
            <div
              title="Completion rate"
              className="flex items-center gap-[5px] px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.25)] text-[12px] text-white font-extrabold shadow-none"
            >
              <Target size={13} color="#ffffff" />
              <span className="[font-family:'IBM_Plex_Mono',monospace]">
                {habit.completionRate ?? 0}%
              </span>
            </div>

            {/* Share Button */}
            {(streak > 0 || completed) && (
              <div className="ml-auto pl-2 border-l border-white/20">
                <ShareButton
                  title={habit.name}
                  text={`I'm on a ${streak}-day streak for "${habit.name}" on Productivity Master!`}
                  type="twitter"
                  className="scale-90"
                />
              </div>
            )}
          </div>

          {/* iOS Swipe to Complete Action Button */}
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <SwipeToComplete
              completed={completed}
              onToggle={(val) => {
                setChecked(val);
                onToggle(habit.id, val);
              }}
              color={color}
              label={isBad ? 'slide to avoid' : 'slide to complete'}
              completedLabel={isBad ? 'avoided' : 'completed'}
              height={48}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const containerClassName = `bg-bg-card border-[6px] border-bg-card rounded-[28px] shadow-none overflow-visible relative h-[380px] flex flex-col transition-all duration-200 ${
    completed ? 'opacity-90' : 'opacity-100'
  } ${onOpen ? 'cursor-pointer' : 'cursor-default'}`;

  return (
    <motion.div layout className="relative">
      {onOpen ? (
        <motion.div
          onClick={() => onOpen(habit.id)}
          className={containerClassName}
          whileHover={{
            y: -5,
            boxShadow: 'none',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {cardContent}
        </motion.div>
      ) : (
        <motion.div
          className={containerClassName}
          whileHover={{
            y: -5,
            boxShadow: 'none',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {cardContent}
        </motion.div>
      )}
    </motion.div>
  );
});

HabitCard.displayName = 'HabitCard';
export default HabitCard;

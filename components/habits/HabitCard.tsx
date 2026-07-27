'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Pencil, Archive, Trash2, Flame, Shield, Target, BadgeCheck, GripVertical } from 'lucide-react';
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
        padding: '8px 10px',
        background: hov ? (danger ? 'rgba(104, 104, 104,0.12)' : 'var(--bg-elevated)') : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        color: danger ? (hov ? 'var(--danger)' : '#8e8e8e') : 'var(--text-secondary)',
        fontSize: 13,
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
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden' }}>
      {/* Background Image (100% Card Height) */}
      <img
        src={coverImage}
        alt={habit.name}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          transition: 'transform 0.4s ease',
        }}
        className="habit-card-image"
      />

      {/* Dark gradient overlay for bottom text legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0, 0, 0,0.1) 0%, rgba(0, 0, 0,0.3) 40%, rgba(0, 0, 0,0.65) 70%, rgba(0, 0, 0,0.92) 100%)',
          zIndex: 1,
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 20,
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Habit Icon (Glassmorphic) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0, 0, 0,0.1)',
              }}
            >
              <DynamicIcon name={habit.icon} size={18} color="#ffffff" />
            </div>

            {/* Category badge */}
            {habit.category && (
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--r-pill)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 750,
                  letterSpacing: '0.02em',
                }}
              >
                {habit.category.name}
              </div>
            )}
          </div>

          {/* Action Tools (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  color: '#ffffff',
                  opacity: 0.8,
                }}
              >
                <GripVertical size={14} />
              </div>
            )}

            {/* Options Menu */}
            {hasMenu && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-label="Options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
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
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 6px)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 11,
                        boxShadow: '0 10px 25px rgba(0, 0, 0,0.25)',
                        padding: 5,
                        minWidth: 140,
                        zIndex: 30,
                      }}
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
                          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            {/* Habit Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.025em',
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {habit.name}
              </h3>
              {completed && (
                <BadgeCheck
                  size={20}
                  color="#919191"
                  fill="white"
                  style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0,0.25))' }}
                />
              )}
              {isBad && (
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 'var(--r-pill)',
                    background: 'rgba(104, 104, 104,0.2)',
                    border: '1px solid rgba(104, 104, 104,0.4)',
                    color: '#8e8e8e',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  Avoid
                </span>
              )}
            </div>

            {/* Description/Bio (White text) */}
            <p
              style={{
                fontSize: 13.5,
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.4,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: 38,
                textShadow: '0 1px 2px rgba(0, 0, 0,0.4)',
              }}
            >
              {habit.description || (isBad ? 'Avoid this trigger to build healthy resilience.' : `Frequency: ${freqLabel(habit)}`)}
            </p>
          </div>

          {/* Stats Indicators (Streak & Rate) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Streak Pill */}
            <div
              title="Current streak"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 9999,
                background: isBad ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.22)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: `1px solid ${isBad ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                fontSize: 12,
                color: isBad ? '#fca5a5' : '#fbbf24',
                fontWeight: 800,
                boxShadow: 'none',
              }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: 12,
                color: '#ffffff',
                fontWeight: 800,
                boxShadow: 'none',
              }}
            >
              <Target size={13} color="#ffffff" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {habit.completionRate ?? 0}%
              </span>
            </div>
          </div>

          {/* Action Button (Centered Pill) */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleToggle}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 22,
              border: 'none',
              background: completed
                ? `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 75%, black) 100%)`
                : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
              color: completed ? '#ffffff' : '#0f172a',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: 'none',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className="habit-pill-btn"
          >
            {completed ? (
              <>Completed ✓</>
            ) : (
              <>Mark Done +</>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );

  const containerStyles = {
    background: 'var(--bg-card)',
    // Bezel effect
    border: '6px solid var(--bg-card)',
    borderRadius: 28,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05)',
    overflow: 'visible',
    position: 'relative' as const,
    height: 380, // slightly taller to comfortably host full-height imagery + action button
    display: 'flex',
    flexDirection: 'column' as const,
    opacity: completed ? 0.9 : 1,
    transition: 'all 0.2s ease',
    cursor: onOpen ? 'pointer' : 'default',
  };

  return (
    <motion.div layout style={{ position: 'relative' }}>
      {onOpen ? (
        <motion.div
          onClick={() => onOpen(habit.id)}
          style={containerStyles}
          whileHover={{
            y: -5,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0,0.06)',
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {cardContent}
        </motion.div>
      ) : (
        <motion.div
          style={containerStyles}
          whileHover={{
            y: -5,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0,0.06)',
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

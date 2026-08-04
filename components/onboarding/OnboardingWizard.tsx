'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Check, X, Zap, PartyPopper, Flame } from 'lucide-react';
import { DynamicIcon as OWIcon } from '@/lib/icons';
import type { Habit } from '@/types/habit';

/* ─── Types ─────────────────────────────────────────────────── */
interface OnboardingWizardProps {
  userName?: string;
  onComplete: (habit: Habit) => void;
  onDismiss: () => void;
}

interface Template {
  name: string;
  icon: string;
  color: string;
  frequency: { type: 'daily' };
  target_type: 'boolean';
  target_value: 1;
}

/* ─── Data ──────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'health',      label: 'Health',        icon: 'heart',         desc: 'Sleep, hydration, vitamins' },
  { id: 'fitness',     label: 'Fitness',        icon: 'dumbbell',      desc: 'Workouts, steps, stretching' },
  { id: 'mindfulness', label: 'Mindfulness',    icon: 'brain',         desc: 'Meditation, journaling, gratitude' },
  { id: 'learning',    label: 'Learning',       icon: 'book-open',     desc: 'Reading, courses, practice' },
  { id: 'productivity',label: 'Productivity',   icon: 'target',        desc: 'Deep work, planning, reviews' },
];

const TEMPLATES: Record<string, Template[]> = {
  health:       [
    { name: 'Drink 8 glasses of water', icon: 'glass-water',   color: '#b1b1b1', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Take vitamins',             icon: 'pill',           color: 'var(--accent-primary)', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Sleep 8 hours',            icon: 'moon',           color: '#8a8a8a', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'No alcohol',               icon: 'ban',            color: '#8c8c8c', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  fitness:      [
    { name: 'Morning run',              icon: 'footprints',     color: 'var(--accent-primary)', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Workout 30 mins',          icon: 'dumbbell',       color: '#a6a6a6', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: '10,000 steps',             icon: 'activity',       color: '#7b7b7b', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Stretch / mobility',       icon: 'wind',           color: '#717171', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  mindfulness:  [
    { name: 'Morning meditation',       icon: 'brain',          color: '#8a8a8a', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Gratitude journal',        icon: 'pen-tool',       color: '#bbbbbb', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'No phone first hour',      icon: 'ban',            color: '#6f6f6f', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Evening reflection',       icon: 'moon',           color: '#b1b1b1', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  learning:     [
    { name: 'Read 30 minutes',          icon: 'book-open',      color: 'var(--accent-primary)', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Practice a language',      icon: 'globe',          color: '#7b7b7b', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Write 500 words',          icon: 'pen-tool',       color: '#a6a6a6', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Watch a tutorial',         icon: 'graduation-cap', color: '#717171', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
  productivity: [
    { name: 'Plan the day (5 min)',     icon: 'calendar-check', color: 'var(--accent-primary)', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: '2-hour deep work block',  icon: 'target',          color: '#6f6f6f', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Weekly review',           icon: 'refresh-cw',      color: '#bbbbbb', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
    { name: 'Inbox zero',              icon: 'inbox',           color: '#8c8c8c', frequency: { type: 'daily' }, target_type: 'boolean', target_value: 1 },
  ],
};

const PRESET_COLORS = ['var(--accent-primary)','#7b7b7b','#8a8a8a','#717171','#a6a6a6','#8c8c8c','#b1b1b1','var(--accent-primary)','#bbbbbb','#6f6f6f'];

/* ─── Mini confetti burst (CSS only, no dep) ────────────────── */
function Confetti() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    color: PRESET_COLORS[i % PRESET_COLORS.length],
    // Deterministic positions keep rendering pure while still creating a burst.
    tx: `${((i * 47) % 120) - 60}px`,
    ty: `${-((i * 29) % 80 + 20)}px`,
    rot: `${(i * 79) % 360}deg`,
    delay: `${i * 0.03}s`,
  }));
  return (
    <div className="pointer-events-none absolute top-[40%] left-1/2 z-10">
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={{
            background: p.color,
            '--tx': p.tx,
            '--ty': p.ty,
            '--rot': p.rot,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Step indicator ────────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-7 flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-[var(--r-pill)] transition-all duration-300 ease-linear"
          style={{
            width: i === current ? 20 : 6,
            background: i === current ? 'var(--accent-primary)' : i < current ? 'var(--accent-glow-md)' : 'var(--border-default)',
            border: i < current && i !== current ? '1px solid var(--accent-primary)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Shared slide variants ─────────────────────────────────── */
const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
};

/* ─── Main component ────────────────────────────────────────── */
export default function OnboardingWizard({ userName, onComplete, onDismiss }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState('var(--accent-primary)');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdHabit, setCreatedHabit] = useState<Habit | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const go = useCallback((next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }, [step]);

  const pickTemplate = (t: Template) => {
    setTemplate(t);
    setHabitName(t.name);
    setHabitColor(t.color);
    go(3);
  };

  const handleSave = async () => {
    if (!habitName.trim()) { setError('Please enter a habit name.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: habitName.trim(),
          icon: template?.icon ?? 'circle-check',
          color: habitColor,
          frequency: { type: 'daily' },
          target_type: 'boolean',
          target_value: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create habit');
      setCreatedHabit(json.data as Habit);
      setShowConfetti(true);
      go(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    if (createdHabit) onComplete(createdHabit);
  };

  const STEPS = 5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Productivity Master"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.65)] p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-[520px] overflow-hidden rounded-[22px] border border-border-default bg-bg-elevated shadow-none"
      >
        {/* Dismiss — skip on final step */}
        {step < 4 && (
          <button
            onClick={onDismiss}
            aria-label="Skip onboarding"
            className="absolute top-3.5 right-3.5 z-[2] flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary text-text-muted"
          >
            <X size={15} />
          </button>
        )}

        {/* Top accent line */}
        <div className="h-[3px] bg-[var(--accent-primary)]" />

        <div className="p-[28px_28px_32px]">
          <StepDots current={step} total={STEPS} />

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Step 0: Welcome ───────────────────────────────── */}
              {step === 0 && (
                <div className="text-center">
                  <div className="mb-4 flex justify-center"><Zap size={48} color="var(--accent-primary)" /></div>
                  <h2 className="m-0 mb-2.5 text-2xl font-extrabold text-text-primary [font-family:'Outfit'] [letter-spacing:-0.03em]">
                    Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
                  </h2>
                  <p className="mx-auto mb-7 max-w-[360px] text-[14.5px] leading-[1.6] text-text-secondary">
                    Productivity Master turns daily check-ins into unstoppable streaks. Let&apos;s create your very first habit — it takes about 60 seconds.
                  </p>
                  <button
                    onClick={() => go(1)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-accent-primary p-[13px] [font-family:inherit] text-[15px] font-bold text-accent-on-primary shadow-none"
                  >
                    Let&apos;s go <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* ── Step 1: Category ─────────────────────────────── */}
              {step === 1 && (
                <div>
                  <h2 className="m-0 mb-1.5 text-xl font-extrabold text-text-primary [font-family:'Outfit'] [letter-spacing:-0.02em]">
                    What do you want to improve?
                  </h2>
                  <p className="m-0 mb-5 text-[13.5px] text-text-muted">
                    Pick an area — we&apos;ll suggest habits for it.
                  </p>
                  <div className="mb-5 grid grid-cols-2 gap-2.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryId(cat.id); go(2); }}
                        className="cursor-pointer rounded-xl border p-[14px_12px] text-left [font-family:inherit] transition-all duration-150 ease-in-out"
                        style={{
                          background: categoryId === cat.id ? 'var(--accent-glow-md)' : 'var(--bg-tertiary)',
                          borderColor: categoryId === cat.id ? 'var(--border-accent)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="mb-[5px] text-accent-primary"><OWIcon name={cat.icon} size={22} color="var(--accent-primary)" /></div>
                        <p className="m-0 mb-0.5 text-[13px] font-bold text-text-primary">{cat.label}</p>
                        <p className="m-0 text-[11px] text-text-muted">{cat.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Template ─────────────────────────────── */}
              {step === 2 && (
                <div>
                  <h2 className="m-0 mb-1.5 text-xl font-extrabold text-text-primary [font-family:'Outfit'] [letter-spacing:-0.02em]">
                    Choose a habit to start
                  </h2>
                  <p className="m-0 mb-5 text-[13.5px] text-text-muted">
                    Pick one — you can add more later.
                  </p>
                  <div className="mb-5 flex flex-col gap-2.5">
                    {(TEMPLATES[categoryId] ?? []).map(t => (
                      <button
                        key={t.name}
                        onClick={() => pickTemplate(t)}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-bg-tertiary p-[12px_14px] text-left [font-family:inherit] transition-all duration-150 ease-in-out hover:border-border-medium hover:bg-bg-elevated"
                      >
                        <div
                          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]"
                          style={{ background: `${t.color}20`, border: `1px solid ${t.color}40` }}
                        ><OWIcon name={t.icon} size={18} color={t.color} /></div>
                        <span className="text-[14px] font-semibold text-text-primary">{t.name}</span>
                        <ArrowRight size={14} color="var(--text-dimmed)" className="ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => go(1)} className="flex cursor-pointer items-center gap-[5px] border-none bg-none text-[13px] text-text-muted">
                    <ArrowLeft size={13} /> Back
                  </button>
                </div>
              )}

              {/* ── Step 3: Customize ────────────────────────────── */}
              {step === 3 && (
                <div>
                  <h2 className="m-0 mb-1.5 text-xl font-extrabold text-text-primary [font-family:'Outfit'] [letter-spacing:-0.02em]">
                    Make it yours
                  </h2>
                  <p className="m-0 mb-5 text-[13.5px] text-text-muted">
                    Tweak the name and pick a colour.
                  </p>

                  {/* Name field */}
                  <div className="mb-[18px]">
                    <label className="mb-1.5 block text-[12.5px] font-semibold tracking-[0.04em] text-text-secondary uppercase">
                      Habit name
                    </label>
                    <input
                      value={habitName}
                      onChange={e => setHabitName(e.target.value)}
                      placeholder="e.g. Morning Run"
                      maxLength={80}
                      className="box-border w-full rounded-[10px] bg-bg-tertiary p-[11px_14px] text-[14px] text-text-primary outline-none [font-family:inherit] focus:border-[var(--border-active)]"
                      style={{ border: `1px solid ${error ? 'var(--danger)' : 'var(--border-subtle)'}` }}
                    />
                    {error && <p className="m-0 mt-[5px] text-xs text-danger">{error}</p>}
                  </div>

                  {/* Color picker */}
                  <div className="mb-6">
                    <label className="mb-2.5 block text-[12.5px] font-semibold tracking-[0.04em] text-text-secondary uppercase">
                      Colour
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHabitColor(c)}
                          className="h-[30px] w-[30px] cursor-pointer rounded-full shadow-none transition-transform duration-[120ms] ease-in-out"
                          style={{
                            background: c, border: habitColor === c ? '2px solid white' : '2px solid transparent',
                            transform: habitColor === c ? 'scale(1.18)' : 'scale(1)',
                          }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    className="mb-5 flex items-center gap-3 rounded-xl p-[12px_14px]"
                    style={{ background: `${habitColor}12`, border: `1px solid ${habitColor}30` }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: `${habitColor}25`, border: `1px solid ${habitColor}50` }}
                    >
                      {template?.icon ? <OWIcon name={template.icon} size={18} color={habitColor} /> : <Zap size={18} color={habitColor} />}
                    </div>
                    <span className="text-[14px] font-semibold text-text-primary">
                      {habitName || 'Your habit'}
                    </span>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => go(2)}
                      className="flex flex-none cursor-pointer items-center gap-[5px] rounded-[10px] border border-border-subtle bg-bg-tertiary p-[12px_16px] text-[14px] font-semibold text-text-secondary [font-family:inherit]"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border-none bg-accent-primary p-3 text-[14px] font-bold text-accent-on-primary [font-family:inherit] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving ? 'Creating…' : <><Check size={15} /> Create habit</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Celebrate ────────────────────────────── */}
              {step === 4 && (
                <div className="relative text-center">
                  {showConfetti && <Confetti />}
                  <div className="mb-4 flex justify-center"><PartyPopper size={52} color="var(--accent-primary)" /></div>
                  <h2 className="m-0 mb-2.5 text-2xl font-extrabold text-text-primary [font-family:'Outfit'] [letter-spacing:-0.03em]">
                    Your first habit is live!
                  </h2>
                  <p className="m-0 mb-2 text-[14.5px] leading-[1.6] text-text-secondary">
                    <strong className="text-accent-primary">{createdHabit?.name}</strong> has been added to your dashboard.
                  </p>
                  <p className="m-0 mb-7 flex items-center justify-center gap-1.5 text-[13.5px] text-text-muted">
                    Check it off today to start your streak! <Flame size={16} color="var(--accent-primary)" />
                  </p>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border-accent bg-[var(--accent-glow)] p-[10px_14px]">
                    <Sparkles size={14} color="var(--accent-primary)" />
                    <span className="text-[13px] font-semibold text-accent-primary">
                      Tip: You can add more habits anytime with the + button.
                    </span>
                  </div>
                  <button
                    onClick={finish}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-none bg-accent-primary p-[13px] text-[15px] font-bold text-accent-on-primary shadow-none [font-family:inherit]"
                  >
                    Go to dashboard <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

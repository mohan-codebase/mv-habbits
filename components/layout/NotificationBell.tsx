'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { todayString } from '@/lib/utils/dates';

interface Notice {
  id: string;
  title: string;
  description: string;
  icon: 'reminder' | 'streak';
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = todayString();
        const [habitsRes, entriesRes] = await Promise.all([
          supabase
            .from('habits')
            .select('id, name, reminder_time, current_streak')
            .eq('user_id', user.id)
            .eq('is_archived', false),
          supabase
            .from('habit_entries')
            .select('habit_id, is_completed')
            .eq('user_id', user.id)
            .eq('entry_date', today),
        ]);

        const habits = habitsRes.data ?? [];
        const done = new Set(
          (entriesRes.data ?? [])
            .filter((e) => e.is_completed)
            .map((e) => e.habit_id as string)
        );

        const notices: Notice[] = [];

        for (const h of habits) {
          if (!done.has(h.id) && h.reminder_time) {
            notices.push({
              id: `r-${h.id}`,
              title: `Reminder: ${h.name}`,
              description: `Scheduled at ${h.reminder_time}`,
              icon: 'reminder',
            });
          }
        }

        const topStreak = habits
          .filter((h) => (h.current_streak ?? 0) >= 3)
          .sort((a, b) => (b.current_streak ?? 0) - (a.current_streak ?? 0))[0];

        if (topStreak) {
          notices.push({
            id: `s-${topStreak.id}`,
            title: `${topStreak.current_streak}-day streak on ${topStreak.name}`,
            description: 'Keep the fire burning today.',
            icon: 'streak',
          });
        }

        if (!cancelled) setItems(notices);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  const count = items.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`relative w-[34px] h-[34px] flex items-center justify-center rounded-[9px] border border-border-default text-text-secondary cursor-pointer transition-[background,border-color] duration-150 hover:bg-bg-elevated ${
          open ? 'bg-bg-elevated' : 'bg-bg-tertiary'
        }`}
      >
        <Bell size={15} />
        {count > 0 && (
          <span
            aria-label={`${count} new`}
            className="absolute top-[5px] right-[5px] min-w-3.5 h-3.5 px-[3px] rounded-[7px] bg-accent-primary text-white text-[9.5px] font-bold flex items-center justify-center leading-none"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+8px)] w-80 bg-bg-secondary border border-border-default rounded-xl shadow-none p-2 z-50"
          >
            <div className="px-2 pt-[6px] pb-[10px] border-b border-border-subtle mb-[6px] flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">
                Notifications
              </span>
              <span className="text-xs text-text-muted">
                {loading ? 'Loading…' : `${count} new`}
              </span>
            </div>

            {!loading && items.length === 0 && (
              <div className="px-3 py-7 text-center text-text-muted text-[13px]">
                You&apos;re all caught up.
              </div>
            )}

            {!loading &&
              items.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-[10px] px-[10px] py-[9px] rounded-[9px] items-start"
                >
                  <div
                    className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 border ${
                      n.icon === 'streak'
                        ? 'bg-[rgba(166,166,166,0.14)] border-[rgba(166,166,166,0.3)] text-[#a6a6a6]'
                        : 'bg-[var(--accent-glow)] border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)] text-accent-primary'
                    }`}
                  >
                    {n.icon === 'streak' ? <Flame size={13} /> : <Clock size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-[13px] font-semibold text-text-primary">
                      {n.title}
                    </p>
                    <p className="mt-0.5 mb-0 text-xs text-text-muted">
                      {n.description}
                    </p>
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

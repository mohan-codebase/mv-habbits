'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HabitEntry } from '@/types/entry';

export type RealtimeStatus = 'connecting' | 'live' | 'offline';

interface Options {
  userId: string | null;
  entryDate: string;           // YYYY-MM-DD (only today's changes patch TodayHabits)
  onEntryChange: (entry: HabitEntry) => void;
}

/**
 * Subscribes to habit_entries changes for the signed-in user scoped to a
 * single entry_date. Emits entry updates so callers can patch optimistic
 * UI state (e.g. TodayHabits) without re-fetching.
 */
export function useRealtimeEntries({ userId, entryDate, onEntryChange }: Options): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const cbRef = useRef(onEntryChange);
  const instanceId = useId();

  useEffect(() => {
    cbRef.current = onEntryChange;
  });

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => setStatus('offline'));
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`habit_entries:${userId}:${entryDate}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_entries',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new ?? payload.old) as HabitEntry | undefined;
          if (!next) return;
          if (next.entry_date !== entryDate) return;
          cbRef.current(next);
        }
      )
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED')      setStatus('live');
        else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT' || subStatus === 'CLOSED')
          setStatus('offline');
        else setStatus('connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, entryDate, instanceId]);

  return status;
}

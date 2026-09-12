'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  habit_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseCoinsResult {
  coins: number;
  transactions: CoinTransaction[];
  loading: boolean;
  /** Call after a habit toggle to refetch the coin balance */
  refresh: () => Promise<void>;
  /** Optimistically add coins (for instant UI feedback) */
  addOptimistic: (amount: number) => void;
}

export function useCoins(): UseCoinsResult {
  const [coins, setCoins] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchCoins = useCallback(async () => {
    try {
      const res = await fetch('/api/coins?limit=20');
      if (!res.ok) return;
      const json = await res.json();
      if (mountedRef.current && json.data) {
        setCoins(json.data.coins ?? 0);
        setTransactions(json.data.transactions ?? []);
      }
    } catch {
      // silent fail
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCoins();
    return () => { mountedRef.current = false; };
  }, [fetchCoins]);

  // Subscribe to realtime updates on profiles.coins
  useEffect(() => {
    const supabase = createClient();
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;
    let isCancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (isCancelled) return;
      const userId = data.user?.id ?? null;
      if (!userId) return;

      activeChannel = supabase
        .channel(`coins-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const newCoins = (payload.new as { coins?: number }).coins;
            if (typeof newCoins === 'number' && mountedRef.current) {
              setCoins(newCoins);
            }
          }
        )
        .subscribe();
    });

    return () => {
      isCancelled = true;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchCoins();
  }, [fetchCoins]);

  const addOptimistic = useCallback((amount: number) => {
    setCoins((prev) => Math.max(0, prev + amount));
  }, []);

  return { coins, transactions, loading, refresh, addOptimistic };
}

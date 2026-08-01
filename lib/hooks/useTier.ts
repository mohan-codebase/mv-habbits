'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/types/profile';

/**
 * Reads the signed-in user's account tier.
 *
 * Defaults to 'free' while loading and on any error, so the UI degrades to the
 * silver key rather than briefly flashing gold at a free user.
 */
export function useTier(): { tier: Tier; loading: boolean } {
  const [tier, setTier] = useState<Tier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', auth.user.id)
        .single();

      if (cancelled) return;
      if (!error && data?.tier === 'premium') setTier('premium');
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tier, loading };
}

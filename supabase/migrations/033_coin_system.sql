-- ============================================================
-- Coin System for Habit Tracking
-- ============================================================
-- Users earn coins when completing habits and lose them when
-- uncompleting. Streaks grant bonus coins.

-- Add coins balance to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;

-- Transaction ledger — every coin change is logged
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,               -- positive = earned, negative = spent/deducted
  balance_after INTEGER NOT NULL,         -- snapshot of balance after this txn
  reason TEXT NOT NULL,                   -- 'habit_complete', 'habit_uncomplete', 'streak_bonus', 'all_done_bonus'
  habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',            -- e.g. { "streak": 7, "habit_name": "Run" }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coin_txn_select" ON public.coin_transactions;
CREATE POLICY "coin_txn_select" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "coin_txn_insert" ON public.coin_transactions;
CREATE POLICY "coin_txn_insert" ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coin_txn_user ON public.coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_txn_habit ON public.coin_transactions(habit_id);

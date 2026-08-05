# 03 — Pricing and Feature Gating

> **Phase 1.** Requires docs `01` and `02`. Blocks doc `04` (payments).
>
> **Repo context:** Next.js 16 App Router + Supabase (Postgres + RLS). API routes live in
> `app/api/**/route.ts`, all of them check `supabase.auth.getUser()`. Authorization is
> enforced primarily by Postgres Row Level Security, not by application code. See
> `00-INDEX.md`.

---

## 1. Current state

A tier column already exists — migration `028_user_tier.sql` added `profiles.tier` with
values `'free' | 'premium'`, plus an index. `types/profile.ts` types it:

```ts
export type Tier = 'free' | 'premium';
```

But it is **used for exactly one thing**: `lib/hooks/useTier.ts` reads it so
`components/ui/AppLogo.tsx` can render a silver key for free users and a gold key for
premium ones. There is no gate anywhere. Every feature is available to everyone.

Critically: **`useTier` is a client hook.** Client-side tier checks are display logic,
never enforcement. All real gating in this document happens on the server.

---

## 2. Proposed plan matrix

> **⚠️ Owner decision required (D2).** The split below is a recommendation based on what
> the app actually does and what costs money to run. Confirm or adjust the limits and
> the price before implementing. Everything downstream (doc `02` pricing section, doc
> `04` checkout) reads from `lib/pricing.ts`, so a change is cheap *if made now*.

### Design principle

Free must be genuinely useful — a habit tracker that nags you at habit #4 gets deleted.
Premium should sell on **depth (history, insight, analysis)** and on the features with
real marginal cost (**AI coach, push, storage**), not on crippling the core loop.

| | **Free** | **Premium** |
|---|---|---|
| Active habits | **5** | Unlimited |
| Daily check-ins | Unlimited | Unlimited |
| Streaks & achievements | ✅ All 18 | ✅ All 18 |
| Analytics history | **Last 30 days** | **Full history** + year heatmap + year-in-review |
| Weekday / category pattern analysis | ❌ | ✅ |
| AI habit coach (weekly insights) | ❌ | ✅ |
| Push reminders | **1 habit** | Unlimited |
| Notes on entries | ✅ | ✅ |
| Video attachments on entries | ❌ | ✅ |
| Data export | **JSON only** | JSON, CSV, Excel, PDF report |
| Social — friends & family feed | ✅ up to 3 connections | Unlimited |
| Habit lock (passcode / Face ID) | ❌ | ✅ *(only if doc 01 §B3 Option B is done)* |
| Themes | ✅ Light & dark | ✅ + accent colors |
| Support | Email, best effort | Email, priority |

### Price (fill in and confirm)

| Plan | Monthly | Yearly | Yearly saving |
|---|---|---|---|
| Free | $0 | $0 | — |
| Premium | **$4.99** | **$39.99** | 33% (~2 months free) |

Rationale: benchmarked against the habit-tracker category (Streaks $4.99 one-time,
Habitify $4.99/mo, Way of Life $4.99/mo, Productive ~$7/mo). $4.99/mo with a yearly
discount sits mid-market. **Yearly is the plan to push** — it halves payment-processing
overhead per user and dramatically improves cash flow and churn.

Consider a **7-day free trial of Premium, no card required** — the tier column supports
it with a `premium_until` timestamp (§4). Trials materially lift conversion for habit
apps because value only becomes visible after a week of data.

### Write it down

Create `lib/pricing.ts` (doc `02` stubs this file — fill it here):

```ts
export type PlanId = 'free' | 'premium';
export type BillingInterval = 'monthly' | 'yearly';

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    limits: {
      maxHabits: 5,
      analyticsHistoryDays: 30,
      maxReminders: 1,
      maxConnections: 3,
      exportFormats: ['json'] as const,
      aiCoach: false,
      videoAttachments: false,
      patternAnalysis: false,
      habitLock: false,
    },
  },
  premium: {
    id: 'premium' as const,
    name: 'Premium',
    price: { monthly: 4.99, yearly: 39.99 },
    limits: {
      maxHabits: Infinity,
      analyticsHistoryDays: Infinity,
      maxReminders: Infinity,
      maxConnections: Infinity,
      exportFormats: ['json', 'csv', 'xlsx', 'pdf'] as const,
      aiCoach: true,
      videoAttachments: true,
      patternAnalysis: true,
      habitLock: true,
    },
  },
} as const;

export const TRIAL_DAYS = 7;
export const CURRENCY = 'USD';
```

---

## 3. Gating architecture

Three layers. **The first is the only one that is security; the other two are UX.**

```
Layer 1 — Postgres  : RLS + CHECK constraints. Cannot be bypassed.       ← enforcement
Layer 2 — API route : reject over-limit requests with 402.               ← enforcement
Layer 3 — React     : hide/disable UI, show upgrade prompts.             ← UX only
```

An attacker who calls `POST /api/habits` directly with a crafted body must be stopped by
layer 1 or 2. Never rely on layer 3.

### 3.1 Server-side tier helper — `lib/tier.ts`

```ts
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANS, type PlanId } from '@/lib/pricing';

export interface TierState {
  tier: PlanId;
  isPremium: boolean;
  limits: (typeof PLANS)[PlanId]['limits'];
}

/**
 * Resolves the effective tier for a user, honoring an active trial or a
 * grace period after cancellation (premium_until in the future).
 * Server-only. Never trust a tier value sent from the client.
 */
export async function getTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<TierState> {
  const { data } = await supabase
    .from('profiles')
    .select('tier, premium_until')
    .eq('id', userId)
    .maybeSingle();

  const until = data?.premium_until ? new Date(data.premium_until) : null;
  const withinGrace = until !== null && until.getTime() > Date.now();
  const isPremium = data?.tier === 'premium' || withinGrace;
  const tier: PlanId = isPremium ? 'premium' : 'free';

  return { tier, isPremium, limits: PLANS[tier].limits };
}

/** Standard 402 response for a blocked action. */
export function paymentRequired(feature: string) {
  return Response.json(
    { data: null, error: `Upgrade to Premium to use ${feature}.`, code: 'UPGRADE_REQUIRED' },
    { status: 402 },
  );
}
```

### 3.2 Client-side hook — extend `lib/hooks/useTier.ts`

Keep the existing hook's shape (it powers `AppLogo`) and add the limits so UI can gate
display without a round trip:

```ts
export function useTier(): { tier: Tier; limits: Limits; loading: boolean }
```

Same defaults as today: assume `free` while loading and on error, so a free user never
flashes a premium state.

---

## 4. Database changes

Create `supabase/migrations/031_billing_columns.sql`:

```sql
-- 031: columns needed to track trials, grace periods, and plan interval.
-- The subscriptions table itself is created in doc 04 (migration 032).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_until   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_used      BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.premium_until IS
  'Premium access is granted while now() < premium_until, even if tier = free. Covers trials and post-cancellation grace until period end.';

CREATE INDEX IF NOT EXISTS profiles_premium_until_idx
  ON public.profiles (premium_until) WHERE premium_until IS NOT NULL;
```

### 🔒 Critical: users must not be able to grant themselves Premium

`profiles` currently has this policy from migration `001`:

```sql
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

That lets any authenticated user run `UPDATE profiles SET tier = 'premium'` on their own
row **directly against the Supabase REST API with their anon key.** The whole paywall is
bypassable in one HTTP request. This must be fixed before charging anyone.

Add to migration `031`:

```sql
-- Block self-service tier escalation. Billing columns are writable only by the
-- service role (webhook handler), never by the end user.
CREATE OR REPLACE FUNCTION public.guard_profile_billing_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- The service role bypasses RLS and runs as 'service_role'; allow it through.
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.tier             IS DISTINCT FROM OLD.tier
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
     OR NEW.trial_used    IS DISTINCT FROM OLD.trial_used
     OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
    RAISE EXCEPTION 'Billing fields are read-only';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_guard_profile_billing ON public.profiles;
CREATE TRIGGER tr_guard_profile_billing
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_billing_columns();
```

**Verify this manually after applying.** Sign in as a normal user in the browser console
and attempt:

```js
await supabase.from('profiles').update({ tier: 'premium' }).eq('id', user.id)
```

It must fail. If it succeeds, stop and fix before continuing.

### Habit count limit at the database level

Belt and braces — enforce the free-tier habit cap in Postgres so no API path can miss it:

```sql
CREATE OR REPLACE FUNCTION public.enforce_habit_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier  TEXT;
  v_until TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT tier, premium_until INTO v_tier, v_until
  FROM public.profiles WHERE id = NEW.user_id;

  IF v_tier = 'premium' OR (v_until IS NOT NULL AND v_until > now()) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.habits
  WHERE user_id = NEW.user_id AND is_archived = false;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'HABIT_LIMIT_REACHED'
      USING HINT = 'Upgrade to Premium for unlimited habits';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_enforce_habit_limit ON public.habits;
CREATE TRIGGER tr_enforce_habit_limit
  BEFORE INSERT ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.enforce_habit_limit();
```

> The `5` is duplicated between `lib/pricing.ts` and SQL. That is acceptable — but add a
> comment in both pointing at the other, and cover it with a test in doc `11`.

---

## 5. Where to apply gates

Go through each route handler and add the check. Pattern:

```ts
import { getTier, paymentRequired } from '@/lib/tier';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const { isPremium, limits } = await getTier(supabase, user.id);
  if (!limits.aiCoach) return paymentRequired('the AI coach');
  // …
}
```

| File | Gate |
|---|---|
| `app/api/coach/route.ts` | `limits.aiCoach` — **highest priority**, this one costs real money per call |
| `app/api/habits/route.ts` (POST) | count active habits vs `limits.maxHabits`, return 402 with `code: 'HABIT_LIMIT_REACHED'` |
| `app/api/habits/[id]/route.ts` (PATCH) | setting `reminder_time` on more than `limits.maxReminders` habits |
| `app/api/export/route.ts` | requested format must be in `limits.exportFormats` |
| `app/api/analytics/heatmap/route.ts` | clamp range to `limits.analyticsHistoryDays` |
| `app/api/analytics/trends/route.ts` | same clamp |
| `app/api/analytics/patterns/route.ts` | `limits.patternAnalysis` |
| `app/api/entries/route.ts` (PATCH) | reject `video_path` when `!limits.videoAttachments` |
| `app/api/social/*` | connection count vs `limits.maxConnections` |
| `app/dashboard/year-in-review/page.tsx` | server component — read tier, render upsell instead of content |

> **Do not clamp analytics by silently returning less data with a 200.** Return the
> clamped range *and* a flag (`{ data, meta: { clamped: true, limitDays: 30 } }`) so the
> UI can show "See your full history with Premium" rather than looking broken.

---

## 6. Upgrade UX

Build `components/billing/UpgradePrompt.tsx` — one reusable component, three variants:

- **`inline`** — a card replacing gated content (year-in-review, pattern analysis).
- **`modal`** — triggered when a limit is hit (6th habit, 2nd reminder).
- **`banner`** — dismissible, shown in-app when a trial has ≤ 2 days left.

Rules that matter more than the visual design:

- Say what they get, not what they're missing. "Unlimited habits and full history —
  $4.99/mo" beats "You've hit your limit."
- **Never block work already done.** If a user downgrades with 12 habits, do not delete
  seven. Keep all data, mark habits beyond the limit read-only/archived-visible, and let
  them choose which 5 stay active. Deleting user data on downgrade is the fastest way to
  get a chargeback and a bad review.
- One upgrade path: every prompt routes to the same `/dashboard/upgrade` page (doc `04`).
- Free users must never see a broken screen — gated areas show the upsell, not an error.

### Downgrade behavior — decide and implement explicitly

| Resource | On downgrade to Free |
|---|---|
| Habits over 5 | All kept. User picks 5 active; rest auto-archived (recoverable). |
| Analytics history | Still stored, view clamped to 30 days. |
| Reminders | All but one disabled; user picks which stays. |
| Video attachments | Kept and viewable, no new uploads. |
| Social connections over 3 | Kept, no new connections. |
| Exports | JSON only. |

Implement the "pick which 5" flow as a one-time modal on next login after downgrade.

---

## 7. Task list

> Needs from `DECISIONS.md`: all of §3 (pricing) and the `FREE_*` limits. **If those are
> still `TODO`, stop and report** — this entire document is built on those numbers, and
> guessing them means writing the wrong values into a database trigger.

### 👤 Human

- [ ] Confirm the plan matrix and prices in `DECISIONS.md` §3 (decision D2)
- [ ] ⚠️ Apply migration `031` to the Supabase project *(dashboard/CLI access — and this
      one changes authorization behavior, so read it before running)*
- [ ] 🔴 **Verify by hand** that a signed-in user cannot escalate their own tier. In the
      browser console on a logged-in session:
      ```js
      await supabase.from('profiles').update({ tier: 'premium' }).eq('id', user.id)
      ```
      This **must** return an error. If it succeeds, the paywall is bypassable — stop and
      fix before continuing to doc `04`.

### 🤖 Agent

- [ ] Fill in `lib/pricing.ts` from `DECISIONS.md`
- [ ] Create `lib/tier.ts` (server-only)
- [ ] Write migration `031` — billing columns + billing-guard trigger + habit-limit
      trigger. **Write the file; do not apply it.** Report that it needs a human to apply.
- [ ] Extend `lib/hooks/useTier.ts` to return limits
- [ ] Add gates to the 10 routes in §5
- [ ] `components/billing/UpgradePrompt.tsx` with three variants
- [ ] Downgrade flow (archive-not-delete + pick-5 modal) — ⚠️ this flow must **never**
      delete a habit row; verify that in review
- [ ] Wire the pricing section in `components/landing/Pricing.tsx` to `lib/pricing.ts`
- [ ] `npm run typecheck && npm run lint && npm run build`

## 8. Acceptance criteria

- [ ] A free user calling `POST /api/coach` receives **402**, not insights.
- [ ] A free user with 5 habits calling `POST /api/habits` receives **402**, and the
      direct Supabase REST insert path also fails (trigger fires).
- [ ] A user cannot set their own `tier` or `premium_until` from the client under any
      circumstance.
- [ ] Downgrading from Premium to Free destroys **zero** rows.
- [ ] Every gated surface shows an upgrade prompt, never an error or an empty screen.
- [ ] `npm run typecheck && npm run lint && npm run build` pass.

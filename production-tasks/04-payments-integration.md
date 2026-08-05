# 04 — Payments Integration

> **Phase 2.** Requires doc `03` (pricing matrix + `lib/tier.ts` + billing columns).
>
> **Repo context:** Next.js 16 App Router + TypeScript. Supabase Postgres with RLS.
> API route handlers in `app/api/**/route.ts` return `{ data, error }`. Zod v4 for
> validation. Middleware is `proxy.ts`. `profiles.tier` (`free | premium`) already
> exists from migration `028`; doc `03` added `premium_until`, `trial_used`, and a
> trigger that blocks users from writing their own billing columns. See `00-INDEX.md`.
>
> **This document is provider-agnostic by design.** The adapter in §3 means swapping
> providers later touches one file, not twenty.

---

## 1. Provider decision (owner decision D1) ⚠️

The seller is based in **India** and the product sells **worldwide**. That combination
is the single most important fact here, and it rules the choice.

### The problem with taking card payments directly

If you are the merchant of record, **you** are liable for consumption tax in the buyer's
country. Selling a digital service to consumers means:

- EU/UK: VAT registration (OSS scheme) and VAT charged at the buyer's local rate
- Many US states: economic-nexus sales tax
- Australia, Canada, Norway, Japan, Singapore, and ~50 more: local digital-services tax
- India: GST on domestic sales; export of services has its own documentation (LUT/FIRC)

Plus FX handling, invoicing requirements, fraud, chargebacks, and dunning. This is
weeks of work and ongoing compliance overhead for a solo product.

### Recommendation: use a Merchant of Record (MoR)

An MoR becomes the legal seller. They collect and remit every tax, issue compliant
invoices, handle chargebacks and refunds, and pay you a periodic payout. You give up
~5% instead of ~2.9%, and you get back a compliance department.

| Provider | Model | Fees (approx.) | Notes |
|---|---|---|---|
| **Paddle** ⭐ | MoR | ~5% + $0.50 | Most mature subscription tooling. Manual approval — they review the product, so apply **early**. Strong dunning + retention flows. |
| **Lemon Squeezy** | MoR | ~5% + $0.50 | Easiest onboarding, now part of Stripe. Good fallback if Paddle approval is slow. |
| **Dodo Payments** | MoR | ~4% + $0.40 | India-founded, built for exactly this case. Younger, smaller. |
| Stripe (direct) | You are MoR | 2.9% + $0.30 (+0.5% Stripe Tax) | Cheapest, but you own all tax registration and remittance. Stripe India also has export-payment paperwork. |
| Razorpay | Gateway | ~2% domestic | Best for India-domestic only. International needs separate approval. |

**Recommended path: apply to Paddle now.** Approval takes days to a couple of weeks and
requires a live site with working pricing, terms, refund policy, and a real contact
address — which is precisely what docs `02` and `06` produce. If Paddle declines or
stalls, fall back to **Lemon Squeezy**. Build against the adapter in §3 either way.

> **Do this first, before writing code:** start the MoR application. It is the longest
> lead-time item in the entire launch and it gates the go-live date. Everything else in
> this document can be built against sandbox credentials in parallel.

**Do not** implement two providers at launch. One, done properly.

---

## 2. Data model

Create `supabase/migrations/032_subscriptions.sql`:

```sql
-- 032: subscription state mirrored from the payment provider.
-- The provider is the source of truth; this table is a local cache kept in sync
-- by the webhook handler so the app never has to call the provider on read paths.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  provider               TEXT NOT NULL,               -- 'paddle' | 'lemonsqueezy' | 'stripe'
  provider_customer_id   TEXT,
  provider_subscription_id TEXT NOT NULL,

  status                 TEXT NOT NULL,               -- see CHECK below
  plan_id                TEXT NOT NULL,               -- 'premium'
  billing_interval       TEXT NOT NULL,               -- 'monthly' | 'yearly'

  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT false,
  canceled_at            TIMESTAMPTZ,
  trial_ends_at          TIMESTAMPTZ,

  -- Money is stored in minor units (cents) as an integer. Never use float for money.
  unit_amount_cents      INTEGER,
  currency               TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_status_check CHECK (status IN (
    'trialing', 'active', 'past_due', 'paused', 'canceled', 'expired'
  )),
  CONSTRAINT subscriptions_interval_check CHECK (billing_interval IN ('monthly','yearly')),
  CONSTRAINT subscriptions_provider_sub_unique UNIQUE (provider, provider_subscription_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx   ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions (status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users may READ their own subscription. Nobody may write it via the anon key —
-- only the service role (webhook handler) writes here.
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- Deliberately NO insert/update/delete policies for authenticated users.


-- ── Webhook event log: idempotency + audit trail ──────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT NOT NULL,
  event_id      TEXT NOT NULL,          -- provider's own event id
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  processed_at  TIMESTAMPTZ,
  error         TEXT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT billing_events_unique UNIQUE (provider, event_id)
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
-- No policies at all: service role only. Users must never read raw billing payloads.

CREATE INDEX IF NOT EXISTS billing_events_unprocessed_idx
  ON public.billing_events (received_at) WHERE processed_at IS NULL;
```

### Why both `profiles.tier` and `subscriptions`

`profiles.tier` + `premium_until` is the **hot path** — read on every gated request by
`lib/tier.ts` with no join. `subscriptions` is the **record** — full billing state for
the account page, support, and reconciliation. The webhook writes both, always in that
order: `subscriptions` first, then derive and write `profiles`.

---

## 3. Provider adapter

One interface, one implementation. Swapping providers later means writing a second
implementation and changing one import.

`lib/billing/types.ts`:

```ts
export type SubStatus =
  | 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'expired';

export interface NormalizedSubscription {
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  userId: string;
  status: SubStatus;
  planId: 'premium';
  billingInterval: 'monthly' | 'yearly';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEndsAt: string | null;
  unitAmountCents: number | null;
  currency: string | null;
}

export interface BillingProvider {
  readonly name: string;
  /** Verify the webhook signature. MUST use the raw request body. */
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  /** Pull the provider's event id + type out of a verified payload. */
  parseEvent(rawBody: string): { id: string; type: string; payload: unknown };
  /** Map a provider event to our normalized shape, or null if we ignore it. */
  toSubscription(payload: unknown): NormalizedSubscription | null;
  /** Server-side: create a checkout session/URL for a user. */
  createCheckout(input: {
    userId: string;
    email: string;
    interval: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;
  /** Server-side: URL where the customer manages/cancels their subscription. */
  createPortalUrl(input: { providerCustomerId: string; returnUrl: string }): Promise<{ url: string }>;
}
```

`lib/billing/index.ts`:

```ts
import 'server-only';
import { paddleProvider } from './paddle';
import type { BillingProvider } from './types';

export const billing: BillingProvider = paddleProvider;   // ← single swap point
```

Then `lib/billing/paddle.ts` implements it. Read the provider's current docs when you
write this file — **do not write webhook-verification code from memory.** Signature
schemes change and getting one wrong is a security hole, not a bug.

---

## 4. Linking a payment to a user 🔒

This is where payment integrations get compromised. Rules:

1. When creating a checkout, pass the Supabase `user.id` as **provider metadata /
   custom data** (Paddle: `custom_data`; Lemon Squeezy: `checkout_data.custom`;
   Stripe: `client_reference_id` or `metadata`).
2. On webhook, read the user id back **from the provider's payload**, never from a
   query parameter, cookie, or anything the browser sent.
3. **Never** grant Premium from a success-redirect. The user controls their browser.
   The redirect only shows a "thanks, activating…" state; the webhook does the granting.
4. Validate that the user id in the payload is a real UUID and exists in `profiles`
   before writing anything.
5. Verify the webhook signature against the **raw body bytes** before parsing JSON. In
   a Next.js route handler that means `await req.text()`, not `await req.json()`.

---

## 5. Endpoints to build

### 5.1 `POST /api/billing/checkout`

```
Auth: required (session)
Body: { interval: 'monthly' | 'yearly' }
→ 200 { data: { url } }  |  401  |  409 (already subscribed)
```

- Zod-validate the body (`lib/validations/billing.ts`).
- Load the user; if they already have an `active`/`trialing` subscription → 409.
- Call `billing.createCheckout({ userId: user.id, email: user.email, … })`.
- `successUrl` → `${SITE_URL}/dashboard/billing?status=success`
- `cancelUrl`  → `${SITE_URL}/dashboard/upgrade?status=cancelled`
- Return the URL; the client does `window.location.href = url`.

### 5.2 `POST /api/billing/webhook` — the important one

```ts
// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { billing } from '@/lib/billing';

// Webhooks must never be cached or statically analyzed.
export const dynamic = 'force-dynamic';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,      // service role: bypasses RLS
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  // 1. RAW body — required for signature verification.
  const raw = await req.text();

  if (!billing.verifyWebhook(raw, req.headers)) {
    console.warn('[billing] webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { id: eventId, type, payload } = billing.parseEvent(raw);
  const db = admin();

  // 2. Idempotency: unique (provider, event_id). A duplicate insert means we
  //    already have this event — ack with 200 so the provider stops retrying.
  const { error: insertErr } = await db.from('billing_events').insert({
    provider: billing.name, event_id: eventId, event_type: type, payload,
  });
  if (insertErr) {
    if (insertErr.code === '23505') return NextResponse.json({ received: true }); // duplicate
    console.error('[billing] failed to log event', insertErr);
    return NextResponse.json({ error: 'Log failed' }, { status: 500 }); // let it retry
  }

  try {
    const sub = billing.toSubscription(payload);
    if (sub) {
      // 3. Upsert the subscription record.
      await db.from('subscriptions').upsert({
        user_id: sub.userId,
        provider: billing.name,
        provider_customer_id: sub.providerCustomerId,
        provider_subscription_id: sub.providerSubscriptionId,
        status: sub.status,
        plan_id: sub.planId,
        billing_interval: sub.billingInterval,
        current_period_start: sub.currentPeriodStart,
        current_period_end: sub.currentPeriodEnd,
        cancel_at_period_end: sub.cancelAtPeriodEnd,
        canceled_at: sub.canceledAt,
        trial_ends_at: sub.trialEndsAt,
        unit_amount_cents: sub.unitAmountCents,
        currency: sub.currency,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider,provider_subscription_id' });

      // 4. Derive the entitlement written to profiles (the hot-path read).
      //    Access continues to the end of the paid period even after cancellation.
      const entitled = sub.status === 'active' || sub.status === 'trialing';
      await db.from('profiles').update({
        tier: entitled ? 'premium' : 'free',
        premium_until: sub.currentPeriodEnd ?? sub.trialEndsAt ?? null,
      }).eq('id', sub.userId);
    }

    await db.from('billing_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('provider', billing.name).eq('event_id', eventId);

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('[billing] webhook processing error', e);
    await db.from('billing_events')
      .update({ error: String(e) })
      .eq('provider', billing.name).eq('event_id', eventId);
    // 500 → provider retries. Correct: better a retry than a lost upgrade.
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

**Webhook rules, all of them non-negotiable:**

- Verify signature before parsing. Reject with 401 on failure.
- Idempotent — the same event id must never be applied twice. Providers retry.
- Return **200 fast**. Providers time out around 5–10s. If work is slow, log the event
  and process asynchronously.
- Return **5xx on genuine failure** so the provider retries. Returning 200 on an error
  silently loses a paid upgrade.
- Never trust anything but the signed payload.
- Add the webhook path to `proxy.ts` — it is under `/api` so the existing early return
  already passes it through without a redirect. Confirm that.

**Events to handle** (names vary by provider — map them in the adapter):

| Concept | Action |
|---|---|
| subscription created | upsert, grant premium |
| subscription updated (plan/interval change) | upsert |
| subscription cancelled | `cancel_at_period_end = true`, keep premium until period end |
| subscription expired / ended | set free |
| payment succeeded | extend `current_period_end` |
| payment failed | status `past_due` — **keep access**, start dunning |
| refund issued | set free immediately, log |

> **Do not revoke access the instant a payment fails.** Cards expire constantly. Give
> the provider's dunning process its full retry window (usually 2–3 weeks) before
> downgrading. Revoking on first failure creates support tickets and churn.

### 5.3 `POST /api/billing/portal`

Auth required. Look up `provider_customer_id` for the user, call
`billing.createPortalUrl(...)`, return the URL. This is where the user updates their
card, changes plan, downloads invoices, and cancels. **Do not build your own cancel
flow** — the provider's portal is compliant and maintained.

### 5.4 `GET /api/billing/subscription`

Auth required. Returns the user's current subscription for the account UI. Return only
what the UI needs — status, interval, period end, cancel flag, amount, currency. Never
return the raw provider payload.

---

## 6. UI to build

| Route / component | Purpose |
|---|---|
| `app/dashboard/upgrade/page.tsx` | The single upgrade destination all prompts route to. Plan comparison + monthly/yearly toggle + checkout button. |
| `app/dashboard/billing/page.tsx` | Current plan, renewal date, "Manage billing" → portal, invoice link, cancel notice. |
| `components/billing/CheckoutButton.tsx` | Client. Calls `/api/billing/checkout`, disables while pending, handles errors visibly. |
| `components/billing/SubscriptionStatus.tsx` | Badge in Settings: Free / Premium / Trial (n days left) / Past due. |
| Post-checkout state | `/dashboard/billing?status=success` shows "Activating your subscription…" and polls `/api/billing/subscription` every 2s for up to 30s, since the webhook may land a moment after the redirect. |

Add a "Billing" section to `app/dashboard/settings/page.tsx` — it already has section
headings (`App & Installation`, `Security & Authentication`, `Preferences & Theme`,
`Data Management`, `Support & Session`). Insert Billing after Preferences.

---

## 7. Trial flow (if enabled — see doc `03`)

- Grant on first signup: set `premium_until = now() + 7 days`, `trial_started_at = now()`,
  `trial_used = true`. Do this in the signup path server-side, guarded by
  `trial_used = false` so it cannot be farmed.
- Show remaining days in the UI from day 5.
- Send email at day 5 and day 7 (doc `07`).
- On expiry no action is needed — `lib/tier.ts` naturally returns `free` once
  `premium_until` has passed. Verify that path with a test.

---

## 8. Environment variables

Add to Vercel (Production **and** Preview — use sandbox keys for Preview):

```
BILLING_PROVIDER=paddle
PADDLE_ENV=sandbox|production
PADDLE_API_KEY=...              # server-only, never NEXT_PUBLIC_
PADDLE_WEBHOOK_SECRET=...       # server-only
PADDLE_PRICE_ID_MONTHLY=...
PADDLE_PRICE_ID_YEARLY=...
NEXT_PUBLIC_SITE_URL=https://{{DOMAIN}}
SUPABASE_SERVICE_ROLE_KEY=...   # already needed by the reminders cron
```

> ⚠️ Only `NEXT_PUBLIC_*` variables reach the browser. Any key without that prefix stays
> server-side. Never prefix an API key or webhook secret with `NEXT_PUBLIC_`.

Document every one of these in `10-infrastructure-and-deployment.md` §env matrix.

---

## 9. Testing

Sandbox first, always. Do not point at production credentials until every case below
passes in sandbox.

- [ ] Checkout completes → webhook arrives → `profiles.tier = 'premium'` → gated feature
      unlocks without a manual refresh of anything server-side
- [ ] Replaying the identical webhook twice changes nothing (idempotency)
- [ ] Tampered signature → 401, no DB write
- [ ] Cancel → `cancel_at_period_end = true`, access retained until `current_period_end`
- [ ] Period end passes → next read returns Free
- [ ] Failed payment → `past_due`, **access retained**
- [ ] Refund → immediate downgrade
- [ ] Upgrade monthly → yearly mid-cycle → single active subscription row, correct period
- [ ] User with no subscription hitting `/api/billing/portal` → clean 404/409, not a crash
- [ ] Webhook for an unknown/deleted user → logged, no crash, no orphan row
- [ ] Two rapid webhooks for the same subscription → last-write-wins, consistent state

Use the provider's CLI/dashboard to replay events. Add a Playwright test for the
checkout button and the post-checkout polling state (doc `11`).

---

## 10. Reconciliation job (do not skip)

Webhooks get lost. Add a daily cron that pulls all subscriptions the provider considers
active and repairs any drift in `profiles.tier` / `subscriptions.status`.

- Path: `app/api/cron/reconcile-billing/route.ts`
- Auth: `Authorization: Bearer $CRON_SECRET`, same pattern as
  `app/api/cron/reminders/route.ts`
- Schedule: once daily is enough — add it to the same cron config as reminders
- Log every correction it makes. If it is correcting things regularly, the webhook has
  a bug.

---

## 11. Task list

> Needs from `DECISIONS.md`: `PAYMENT_PROVIDER`, `PAYMENT_APPLICATION_STATUS`, all of §3
> (pricing), `LEGAL_ENTITY`, `TAX_ID`, `SITE_URL`.
>
> **⚠️ This is the highest-risk document in the set — it moves real money.** Use a strong
> model, and have a human read every line of the webhook handler before it goes live. A
> mistake here means either lost revenue or granted-but-unpaid access.
>
> **Agent: do not write webhook signature-verification code from memory.** Fetch the
> provider's current documentation and follow it exactly. Signature schemes change, and a
> wrong implementation is a security hole that looks like working code.

### 👤 Human

- [ ] 🔴 **Submit the payment provider application today** (decision D1) — days to weeks
      of lead time, and it gates the launch date
- [ ] Complete KYC with the legal entity details from `DECISIONS.md` §2
- [ ] Create the products and prices in the provider dashboard; put the resulting price
      IDs into Vercel env vars
- [ ] Set the product's tax category to SaaS / digital service
- [ ] Register the webhook URL in the provider dashboard, pointing at
      `{SITE_URL}/api/billing/webhook`
- [ ] ⚠️ Apply migration `032` to Supabase
- [ ] Add all `§8` env vars to Vercel — **sandbox credentials for Preview**, production
      credentials for Production. A real charge fired from a preview deploy is a very bad day.
- [ ] Run the §9 test matrix against sandbox, including at least one full purchase
- [ ] Read the webhook handler line by line before switching to production keys

### 🤖 Agent

- [ ] Fetch the chosen provider's current API + webhook docs before writing any adapter code
- [ ] Write migration `032` — `subscriptions` + `billing_events`. **Write only; do not apply.**
- [ ] `lib/billing/types.ts`, `lib/billing/index.ts`, `lib/billing/<provider>.ts`
- [ ] `lib/validations/billing.ts`
- [ ] `POST /api/billing/checkout`
- [ ] `POST /api/billing/webhook` — signature verified against the **raw** body,
      idempotent via `billing_events`, 5xx on genuine failure
- [ ] `POST /api/billing/portal`
- [ ] `GET  /api/billing/subscription`
- [ ] `app/dashboard/upgrade/page.tsx`, `app/dashboard/billing/page.tsx`
- [ ] `components/billing/{CheckoutButton,SubscriptionStatus}.tsx`
- [ ] Billing section in Settings
- [ ] Trial grant on signup (only if `TRIAL_ENABLED = yes`)
- [ ] Daily reconciliation cron
- [ ] `npm run typecheck && npm run lint && npm run build`
- [ ] Report to the human: every env var name the code now requires, and confirmation
      that Premium can **only** be granted by the webhook — never by a redirect or a
      client action

## 12. Acceptance criteria

- [ ] A real end-to-end sandbox purchase grants Premium within 10 seconds.
- [ ] Every item in §9 passes.
- [ ] No secret key is exposed to the client. Verify:
      `grep -rn "NEXT_PUBLIC_.*\(KEY\|SECRET\|TOKEN\)" app components lib` returns only
      the Supabase anon/publishable key.
- [ ] Premium can only be granted by the webhook — never by client action or redirect.
- [ ] `npm run typecheck && npm run lint && npm run build` pass.

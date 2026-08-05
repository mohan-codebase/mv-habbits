# 09 — Observability and Analytics

> **Phase 3.** Without this you launch blind: you will not know when something breaks,
> and you will not know why people leave.
>
> **Repo context:** Next.js 16 App Router on Vercel, Supabase backend.
> `@vercel/speed-insights` is already mounted in `app/layout.tsx`. Error boundaries exist
> at `app/dashboard/error.tsx` and `app/dashboard/analytics/error.tsx`. Logging today is
> ad-hoc `console.error` scattered across route handlers. See `00-INDEX.md`.

---

## 1. Current state

| Capability | Status |
|---|---|
| Error tracking | ❌ None. Errors vanish into Vercel logs. |
| Structured logging | ❌ `console.error` with inconsistent prefixes |
| Uptime monitoring | ❌ None |
| Product analytics | ❌ None |
| Performance monitoring | 🟨 `@vercel/speed-insights` (Web Vitals only) |
| Client error boundaries | 🟨 Two exist, but they don't report anywhere |
| Database monitoring | 🟨 Supabase dashboard, no alerts configured |
| Uptime/status page | ❌ None |

---

## 2. Error tracking — Sentry 🔴

Highest-value item in this document. Right now, if a user hits a 500 on
`POST /api/entries`, nobody finds out.

### Setup

```bash
npx @sentry/wizard@latest -i nextjs
```

The wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`,
`sentry.edge.config.ts`, and wraps `next.config.ts`.

> ⚠️ **The wizard will modify `next.config.ts`.** That file has carefully written CSP
> headers and a deliberately disabled Cache Components setting with an explanatory
> comment. Review the wizard's diff line by line and preserve everything. Do not accept
> a blind overwrite.

### Configuration that matters

```ts
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',

  // Sample rates — 100% of errors, a slice of traces (cost control).
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,     // only record sessions that errored

  // 🔒 Privacy: this app holds personal habit data and free-text notes.
  sendDefaultPii: false,
  beforeSend(event) {
    // Never ship note text, habit names, or emails to a third party.
    if (event.request?.data) delete event.request.data;
    if (event.user) event.user = { id: event.user.id };  // id only, no email/ip
    return event;
  },

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'NotAllowedError',            // user dismissed a WebAuthn / notification prompt
    'AbortError',
  ],
});
```

**Session Replay is off by default here on purpose.** Replays capture the screen —
including every habit name and note. If you enable it, you must turn on full input and
text masking, and disclose it in the privacy policy (doc `06`).

### Also do

- [ ] Add CSP allowances for Sentry's ingest domain in `next.config.ts` `connect-src`.
- [ ] Report from the existing error boundaries — `app/dashboard/error.tsx` and
      `app/dashboard/analytics/error.tsx` should call `Sentry.captureException(error)`
      in an effect.
- [ ] Add a **root** `app/error.tsx` and `app/global-error.tsx` — currently only the
      dashboard subtree is covered.
- [ ] Upload source maps in CI so stack traces are readable (the wizard sets this up;
      confirm the auth token is in Vercel env vars).
- [ ] Set up alerts: any new issue type → email; error rate spike → email.

---

## 3. Structured logging

Replace scattered `console.error` with one small logger. No dependency needed.

```ts
// lib/logger.ts
import 'server-only';

type Level = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured JSON logging. Vercel parses JSON lines into queryable fields.
 * NEVER pass request bodies, notes, emails, tokens, or passcodes in `meta`.
 */
function log(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    level, event, ts: new Date().toISOString(),
    env: process.env.VERCEL_ENV ?? 'development',
    ...meta,
  });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (e: string, m?: Record<string, unknown>) => log('debug', e, m),
  info:  (e: string, m?: Record<string, unknown>) => log('info', e, m),
  warn:  (e: string, m?: Record<string, unknown>) => log('warn', e, m),
  error: (e: string, m?: Record<string, unknown>) => log('error', e, m),
};
```

Migration plan:

- [ ] Replace `console.error` in all 23 route handlers with `logger.error`.
- [ ] **Delete the `DIAG` logs in `app/api/entries/route.ts`** that stringify the whole
      request body (also flagged in doc `08` §7).
- [ ] Log identifiers, never content: `{ userId, habitId, code }` — not names or notes.
- [ ] Add an `eslint` rule banning bare `console.log` in `app/api/**`.

---

## 4. Product analytics

### Choose a vendor (decision D7)

| Option | Pros | Cons |
|---|---|---|
| **PostHog Cloud EU** ⭐ | Funnels, retention, feature flags, session replay, generous free tier, can run cookieless | Heavier script |
| Plausible | Tiny script, no cookies, no consent banner needed, simple | Page views only — no funnels or user-level analysis |
| Vercel Web Analytics | Zero setup, already in the ecosystem | Very limited |

**Recommended: PostHog, configured cookieless (`persistence: 'memory'` or
localStorage-only) and hosted in the EU region.** That gives you funnels and retention —
which is what actually informs the product — while keeping the consent story simple
(see doc `06` §2.5).

If you want the absolute simplest legal position and only need traffic numbers, use
Plausible.

### Events worth tracking

Track a small, deliberate set. Every event you add is a maintenance cost and a privacy
consideration.

**Acquisition & activation**
- `landing_viewed`, `signup_started`, `signup_completed`, `email_confirmed`
- `onboarding_started`, `onboarding_completed`, `first_habit_created`
- `first_checkin_completed` ← **the activation moment for a habit app**

**Engagement**
- `habit_created`, `habit_checkin`, `habit_archived`
- `analytics_viewed`, `achievement_unlocked`
- `push_permission_granted` / `denied`
- `pwa_installed`

**Monetization**
- `paywall_viewed` (with `feature` property: which gate triggered it)
- `upgrade_clicked`, `checkout_started`, `checkout_completed`, `checkout_abandoned`
- `trial_started`, `trial_converted`, `trial_expired`
- `subscription_cancelled` (with a reason, if you ask)

**Never send as properties:** habit names, note text, email addresses, or anything the
user typed. Send ids and counts only. This is not just privacy hygiene — habit names
are frequently health data.

### Metrics that matter for this product

Build one dashboard with:

1. **Activation rate** — % of signups that complete a first check-in within 24h
2. **D1 / D7 / D30 retention** — the only number that predicts a habit app's survival
3. **Free → Premium conversion**, and trial conversion separately
4. **Paywall → checkout funnel**, broken down by which gate triggered it
5. **Churn rate** and cancellation reasons
6. **Weekly active check-ins per user** — the core engagement loop

---

## 5. Uptime monitoring

- [ ] Add a health endpoint `app/api/health/route.ts` that verifies the app **and** the
      database are alive:

  ```ts
  export const dynamic = 'force-dynamic';

  export async function GET() {
    try {
      const supabase = await createServerClient();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      return Response.json({ status: 'ok', ts: new Date().toISOString() });
    } catch {
      return Response.json({ status: 'degraded' }, { status: 503 });
    }
  }
  ```

  Return no detail on failure — a health endpoint is public.

- [ ] Monitor it every minute with a free service (Better Stack, UptimeRobot, Checkly).
- [ ] Also monitor the landing page `/` and `/login`.
- [ ] Alert to email **and** phone/SMS. An email-only alert at 3am is not an alert.
- [ ] Exclude `/api/health` from rate limiting (doc `08`).

---

## 6. Cron job monitoring 🔴

The reminders cron (doc `01` §B1) and the billing reconciliation cron (doc `04` §10) fail
**silently**. Nobody notices reminders stopping until users complain.

- [ ] Use dead-man's-switch monitoring (Better Stack Heartbeats, Cronitor, or
      healthchecks.io): the cron pings a URL on success, and you get alerted when the
      ping **doesn't** arrive.
- [ ] Have each cron return counts (`{ sent, staleRemoved }` — the reminders route
      already does this) and log them structurally.
- [ ] Alert if reminders sent drops to zero for 24 hours while subscriptions exist.

---

## 7. Database monitoring

In the Supabase dashboard:

- [ ] Enable alerts for high CPU, disk, and connection-count
- [ ] Watch the connection pool — serverless functions open many short connections;
      confirm you're using the pooler URL if connections spike
- [ ] Review slow queries weekly at first. Likely candidates given the code:
      `app/api/social/feed/route.ts` (deeply nested embed with 4 joins, limit 50) and
      the analytics range queries
- [ ] Set a database-size alert well before the plan limit
- [ ] Confirm PITR / backups are on (doc `10`)

---

## 8. Privacy note

Everything in this document sends data to third parties. Before enabling any of it:

- Add Sentry, the analytics vendor, and any monitoring tool to the **subprocessor list**
  in the privacy policy (doc `06` §2.1).
- Sign their DPAs.
- Configure EU data residency where offered.
- Verify with a network inspection that no habit name, note, or email leaves the app.
  **Test this explicitly** — create a habit called `TESTSENTINEL123`, trigger an error,
  and confirm that string appears nowhere in the outbound payloads.

---

## 9. Task list

> Needs from `DECISIONS.md`: `ANALYTICS_PROVIDER`, `UPTIME_MONITOR`, `SUPPORT_EMAIL`.

### 👤 Human

- [ ] Create the Sentry project; put `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` in
      Vercel
- [ ] Choose the analytics vendor (decision D7) and create the project — **pick the EU
      region** if using PostHog
- [ ] Configure Sentry alert rules (new issue → email; error-rate spike → email)
- [ ] Set up the external uptime monitor against `/api/health`, `/`, and `/login`.
      Route alerts to **phone, not just email** — an email at 3am is not an alert.
- [ ] Set up dead-man's-switch heartbeats for the cron jobs
- [ ] Configure Supabase alerts (CPU, disk, connections, database size)
- [ ] Sign DPAs with Sentry and the analytics vendor; add both to the privacy policy
      (doc `06`)
- [ ] Build the metrics dashboard in §4 *(vendor UI work)*

### 🤖 Agent

- [ ] Install and configure Sentry. ⚠️ **The wizard will rewrite `next.config.ts`** —
      that file has hand-written CSP headers and a deliberately disabled Cache Components
      setting with an explanatory comment. Review the diff line by line and preserve all
      of it. Do not accept a blind overwrite.
- [ ] Add `beforeSend` scrubbing; leave Session Replay **off** — replays capture habit
      names and note text
- [ ] Add root `app/error.tsx` and `app/global-error.tsx`
- [ ] Report from the existing boundaries (`app/dashboard/error.tsx`,
      `app/dashboard/analytics/error.tsx`)
- [ ] Add the Sentry ingest domain to CSP `connect-src`
- [ ] Create `lib/logger.ts`; migrate all 23 route handlers off bare `console.error`
- [ ] Delete the `DIAG` body logging in `app/api/entries/route.ts`
- [ ] Install the analytics SDK; configure cookieless
- [ ] Instrument the events in §4 — ⚠️ **ids and counts only**. Never send habit names,
      note text, or email addresses as properties.
- [ ] Add `app/api/health/route.ts` (returns no detail on failure)
- [ ] Run the `TESTSENTINEL123` leak test and report the result
- [ ] `npm run typecheck && npm run lint && npm run build`

## 10. Acceptance criteria

- [ ] A deliberately thrown error in a route handler appears in Sentry within a minute,
      with a readable stack trace and **no** request body attached.
- [ ] `signup_completed` and `first_checkin_completed` fire correctly for a real signup.
- [ ] The full paywall → checkout funnel is visible in analytics.
- [ ] Taking the app down triggers an uptime alert to phone within 5 minutes.
- [ ] Skipping a cron run triggers a heartbeat alert.
- [ ] The `TESTSENTINEL123` string appears in **no** third-party payload.
- [ ] Every vendor is listed in the privacy policy.

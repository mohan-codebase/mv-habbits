# 13 — Go-Live Checklist

> **Phase 5.** The final runbook. Work through it in order on launch day.
>
> This document assumes docs `01`–`12` are complete or consciously skipped. If a section
> below references something you skipped, mark it ⏭️ and note the risk you're accepting —
> don't silently pass over it.

---

## 1. T-minus 2 weeks

Long-lead items. Nothing here can be rushed on launch day.

- [ ] **Payment provider application submitted** (doc `04` §1) — this is the longest
      lead-time item in the entire launch. Approval needs a live site with pricing,
      terms, refund policy, and a contact address.
- [ ] Domain registered and DNS delegated
- [ ] Legal entity details finalized ({{LEGAL_ENTITY}}, {{LEGAL_ADDRESS}})
- [ ] Legal pages drafted and **sent for lawyer review** (doc `06`)
- [ ] Apple Developer account active, if keeping Apple sign-in (doc `07` §5.3)
- [ ] Vercel and Supabase upgraded to paid plans (doc `10`)

## 2. T-minus 1 week

- [ ] All of doc `01` (launch blockers) is done and verified
- [ ] Landing page live on a preview URL and reviewed on real devices
- [ ] Pricing confirmed and identical in `lib/pricing.ts`, the landing page, the payment
      provider dashboard, and the JSON-LD structured data
- [ ] Payments working end-to-end **in sandbox**, every case in doc `04` §9 passing
- [ ] Custom SMTP live; deliverability verified to Gmail, Outlook, iCloud (doc `07` §2)
- [ ] RLS audit complete; the permission matrix passes (doc `08` §2)
- [ ] Rate limiting live on `/api/passcode/verify` and `/api/coach`
- [ ] Sentry receiving errors; uptime monitoring active
- [ ] Backups verified by an actual restore into a scratch project (doc `10` §5)
- [ ] Legal pages returned from review and published

## 3. T-minus 1 day — final verification

### 3.1 Secrets

- [ ] Every secret rotated (doc `08` §5): Supabase anon + service role, VAPID keypair,
      `CRON_SECRET`, `ANTHROPIC_API_KEY`, payment provider keys
- [ ] `grep -rn "NEXT_PUBLIC_.*\(SECRET\|SERVICE\|PRIVATE\|KEY\)" .` — only the Supabase
      publishable key should appear
- [ ] No `.env` file is tracked: `git ls-files | grep -E "^\.env"` returns nothing
- [ ] Every variable in `.env.example` is set in Vercel Production

### 3.2 Configuration

- [ ] `NEXT_PUBLIC_SITE_URL` = the production domain
- [ ] Supabase Site URL and redirect allow-list updated
- [ ] Google OAuth origins and redirect URIs updated; consent screen **published**
- [ ] Payment provider switched from sandbox to **production** keys, webhook URL pointing
      at the production domain
- [ ] Cron jobs in `vercel.json` at the right schedules
- [ ] `grep -rn "mv-habits.app\|vercel.app\|localhost" app components lib public`
      — no stale origins

### 3.3 Data

- [ ] Production database contains **no test or personal seed data**
- [ ] Specifically: no rows left from the trip tables' `DEFAULT ARRAY['Mohan','Charles']`
      (doc `01` §B5)
- [ ] Migrations `001`→latest all applied; `supabase db diff --linked` is empty
- [ ] Fresh backup taken immediately before launch

### 3.4 Build

- [ ] `npm run typecheck && npm run lint && npm run build` all pass
- [ ] CI green on `main`
- [ ] All Playwright smoke tests passing against staging
- [ ] `npm audit --production` — no unresolved high/critical

---

## 4. Launch day — the smoke test

Do this **on production**, with a real, brand-new account. Not staging. Not an existing
account. Budget 45 minutes.

### 4.1 Acquisition

- [ ] `https://{{DOMAIN}}` loads the landing page (not a redirect to `/login`)
- [ ] All four nav anchors scroll to real sections
- [ ] Pricing shows the correct amounts
- [ ] Page looks right on a real phone, in both light and dark
- [ ] `/privacy`, `/terms`, `/refunds`, `/cookies` all load without a session
- [ ] Footer shows the legal entity name

### 4.2 Signup and activation

- [ ] Sign up with a **real, previously unused** email
- [ ] Confirmation email arrives **in the inbox**, within a minute, correctly branded
- [ ] Confirmation link works and lands on `/dashboard`
- [ ] Timezone was auto-detected and stored correctly
- [ ] Onboarding runs; first habit created; **first check-in completed**
- [ ] Sign out, sign back in — data is there

### 4.3 Core product

- [ ] Create a habit; it appears immediately
- [ ] Check in; the toggle sticks and the ring/count updates
- [ ] Open the app on a second device as the same user — realtime updates propagate
- [ ] Streak increments correctly
- [ ] Analytics render with data
- [ ] Notes, quotes, achievements pages all load without error
- [ ] Data export downloads and contains real data

### 4.4 Monetization

- [ ] Hit a paywall (create a 6th habit) — upgrade prompt shows, no error
- [ ] Click upgrade → checkout opens with the right price and currency
- [ ] **Complete a real purchase with a real card** (refund it afterwards)
- [ ] Premium unlocks within 10 seconds
- [ ] The gated feature that triggered the paywall now works
- [ ] Billing page shows the correct plan and renewal date
- [ ] "Manage billing" opens the provider portal
- [ ] Cancel → access retained until period end, correctly communicated
- [ ] Refund the test purchase; verify the downgrade lands

### 4.5 Notifications

- [ ] Install the PWA on a real phone
- [ ] Grant notification permission
- [ ] Set a habit reminder 6 minutes out
- [ ] **The push notification actually arrives** — this is the one most likely to be
      broken (doc `01` §B1)
- [ ] Tapping it opens the app at `/dashboard`

### 4.6 Account lifecycle

- [ ] Password reset works end to end
- [ ] Google sign-in works with a fresh Google account
- [ ] Account deletion request works, shows the grace period, and can be cancelled

### 4.7 Operations

- [ ] `/api/health` returns `ok`
- [ ] Sentry is receiving events (throw a deliberate test error, then resolve it)
- [ ] Analytics recorded the signup and first check-in from §4.2
- [ ] Uptime monitor is green
- [ ] Cron heartbeats reporting

---

## 5. Immediately after launch

**First hour**
- [ ] Watch Sentry continuously
- [ ] Watch Vercel function logs for 500s
- [ ] Watch Supabase for connection or CPU spikes
- [ ] Confirm the first real (non-you) signup completes

**First 24 hours**
- [ ] Check every cron ran
- [ ] Check email delivery rates and bounces
- [ ] Check that reminders actually went out
- [ ] Review any Sentry issues
- [ ] Respond to every support email — early users who get a fast reply become advocates

**First week**
- [ ] Review activation rate (signup → first check-in)
- [ ] Review D1 retention
- [ ] Review the paywall → checkout funnel; find where it leaks
- [ ] Read every piece of feedback
- [ ] Check the Anthropic bill — the AI coach is the one unbounded cost (doc `10` §10)
- [ ] Check the billing reconciliation cron's correction log — corrections mean the
      webhook has a bug

---

## 6. Rollback plan

Know this before you need it.

**Symptom: the site is broken after a deploy**
→ Vercel → Deployments → previous → "Promote to Production". Takes ~30 seconds.

**Symptom: a migration broke things**
→ There is no automatic rollback. Apply the down-migration you wrote alongside it. If it
was destructive and you have no down-path, restore from the pre-launch backup and accept
the data loss window. This is why doc `10` §9 insists on a written rollback per migration.

**Symptom: payments are misbehaving**
→ Disable the checkout button via a feature flag / env var and put a notice on the
upgrade page. Do **not** delete subscription rows. Reconcile from the provider dashboard,
which is the source of truth.

**Symptom: you're leaking data (RLS hole)**
→ This is the emergency. Immediately revoke the affected policy in the Supabase SQL
editor (tighten to `auth.uid() = user_id`), even if it breaks the social feature. Then
assess scope, then fix properly, then notify affected users if personal data was exposed
(GDPR: 72 hours to the supervisory authority).

**Symptom: costs are spiking**
→ Most likely the AI coach or the database. Disable `/api/coach` with an env flag,
check the rate limiters, check for a scraping loop in the logs.

---

## 7. Deliberately not doing at launch

Write down what you're skipping, so it's a decision and not an oversight:

- Multi-language support (doc `05` §4.3) — English only
- RTL layouts
- Native mobile apps — the PWA is the mobile story
- Team/family plans — single-user subscriptions only
- The habit-lock passcode feature (doc `01` §B3) — shipped disabled
- Trip planner, expenses, goals UI — tables dropped or dormant
- Blog and content marketing (doc `12` §7)
- CSP nonces (doc `08` §4) — `'unsafe-inline'` retained, accepted risk
- Comprehensive test coverage — smoke tests + RLS tests only

---

## 8. Sign-off

Do not launch until every line here is true.

- [ ] Every launch blocker in doc `01` is resolved
- [ ] A real payment has been taken and refunded successfully on production
- [ ] A real push notification arrived on a real phone
- [ ] Legal pages are lawyer-reviewed and published
- [ ] A backup has been verified by restoring it
- [ ] Error tracking and uptime alerting are live and tested
- [ ] The RLS permission matrix passes
- [ ] Rollback procedure is written down and understood
- [ ] Someone is available to watch the first 24 hours

**Launched on:** ________________
**By:** ________________

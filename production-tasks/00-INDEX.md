# Production Launch — Task Index

> **Purpose of this folder.** These documents are the complete work plan to take this
> codebase from "working personal project" to "publicly launched paid product".
> They are written to be handed to an AI coding agent (Gemini Pro / Flash, Claude, etc.)
> **one file at a time**. Each file is self-contained: it repeats the repo context it
> needs, so you never have to feed the whole folder at once.

---

## 1. How to use these documents

**Feed the AI three things every time: this preamble, `DECISIONS.md`, and one task file.**

```
You are working in the repository described in the attached index. Read the task
document in full before writing any code.

RULES
1. Do only the tasks under the "🤖 Agent" heading. Tasks under "👤 Human" require
   dashboard access, DNS, payments, real devices, or legal judgment — you cannot do
   them. Do not claim you did. List them back to me at the end as still-pending.
2. DECISIONS.md is the only source of truth for domains, prices, legal entity names,
   and vendor choices. If a value there says TODO, do NOT invent one. Leave
   `TODO(DECISIONS.md): <what you need>` in the code, finish everything else, and
   tell me what was blocked.
3. Anything marked ⚠️ is destructive or security-sensitive. Do not run it. Write the
   file or describe the change, then stop and tell me it needs my approval.
4. Never apply a database migration. Write the .sql file and tell me to apply it.
5. Never run anything against production. Staging only.
6. After each task run `npm run typecheck` and `npm run lint`, and fix what you broke.
7. Do not start tasks from other documents. Do not refactor unrelated code.
8. Do not rename the product or touch the logo — a rebrand is planned separately.

Finish with: what you completed, what you skipped and why, what needs me.
```

> If you are pasting into a chat UI rather than an agentic coding tool, the model cannot
> run `typecheck`/`lint` or read files itself. Run the checks yourself and paste errors
> back, and paste in any file it asks to see.

**Order matters.** Follow the phases in section 5. Documents in a later phase assume
earlier phases are done.

**Mark progress** in the status table in section 6 as you go. Keep it updated — it is
the only place that records what is actually finished.

### Conventions used in every task list

| Marker | Meaning |
|---|---|
| 👤 **Human** | Requires dashboard access, DNS, a real device, money, or judgment. An agent cannot do it — if one says it did, it hallucinated. |
| 🤖 **Agent** | Code, config, and file changes. Safe to delegate. |
| ⚠️ | Destructive or security-sensitive. A human confirms before it runs. |
| 🔴 🟠 🟡 | Severity: critical / important / nice-to-have |
| ⏭️ | Deliberately deferred past launch |

---

## 2. Repository context (give this to every agent)

| Thing | Value |
|---|---|
| Product | A habit tracker web app (PWA) |
| Framework | Next.js **16** (App Router), React **19**, TypeScript |
| Styling | Tailwind CSS **v4** + CSS custom properties in `app/globals.css` |
| Backend | Supabase — Postgres, Auth, Row Level Security, Realtime, Storage |
| Hosting | Vercel |
| Animation | Framer Motion v12 |
| Forms / validation | React Hook Form + Zod v4 |
| Charts | Recharts v3 |
| AI | `@anthropic-ai/sdk` (weekly habit coach) |
| Package manager | npm |
| Tests | **None currently exist** |

### Directory map

```
app/
  page.tsx              → currently just redirect('/login')
  layout.tsx            → fonts, metadata, providers, service worker, SpeedInsights
  login/ signup/ forgot-password/ reset-password/
  privacy/ terms/       → already written, substantial, use components/landing/Navbar
  auth/callback/        → Supabase OAuth callback
  dashboard/            → the product itself (RSC pages)
    page.tsx            → main dashboard, server-fetches habits + entries
    analytics/ achievements/ notes/ quotes/ year-in-review/ settings/
    habits/[id]/
  api/                  → 23 route handlers, all JSON, all auth-checked
components/
  dashboard/FitnessSummary.tsx   → 2,137 lines. The real product UI. Handle with care.
  dashboard/DashboardApp.tsx     → wrapper: passcode lock + renders FitnessSummary
  landing/Navbar.tsx             → EXISTS, links to /#features /#how-it-works /#pricing /#faq
  layout/  ui/  analytics/  settings/  auth/  quotes/  onboarding/
lib/
  supabase/{client,server,cached-server}.ts
  utils/{dates,api,url,export,import,pdf}.ts
  validations/{entry,habit}.ts   → Zod schemas
  hooks/{useTier,useRealtimeEntries}.ts
  {quotes,webpush,webauthn,passcode,cache,constants,icons}.ts
supabase/migrations/    → 001 … 028, applied BY HAND to the Supabase project
types/                  → analytics, entry, achievement, profile, habit
proxy.ts                → Next 16 middleware (renamed): session refresh + auth redirects
next.config.ts          → CSP + security headers, redirects, image config
vercel.json             → cron definition
public/sw.js            → service worker: web push only, fetch handler is a deliberate no-op
```

### Key facts an agent must know before editing

1. **`proxy.ts` is the middleware.** Next.js 16 renamed `middleware.ts` → `proxy.ts`.
   Do not create a `middleware.ts`.
2. **Cache Components is deliberately disabled** in `next.config.ts`. The comment there
   explains why (dynamic Supabase auth reads outside Suspense caused a render loop).
   Do not enable it.
3. **The service worker's `fetch` handler is intentionally empty.** An offline shell
   previously corrupted RSC payloads. Do not add caching to it.
4. **RLS is the authorization layer.** Almost no authorization logic lives in the API
   routes beyond "is there a user". If you add a table, you must add RLS policies.
5. **Migrations are applied manually.** There is no migration runner wired up yet
   (doc `10` fixes this). New migrations continue the numbering: `029_…`, `030_…`.
6. **Everything is timezone-aware via `profiles.timezone`** (default `Asia/Kolkata`).
   Never use raw `new Date()` for a user-facing calendar date; use
   `formatInTimeZone` from `date-fns-tz` like `app/dashboard/page.tsx` does.

---

## 3. Global rules — apply to every task

### 🚫 Do not touch branding

**The product name and logo are going to change after launch.** Therefore:

- **Do not** rename the product anywhere. It stays "MV Habits" for now.
- **Do not** redesign, replace, or regenerate the logo. Leave `assets/logo/*`,
  `public/logo/*`, `public/icons/*`, `app/icon.png`, `app/apple-icon.png`,
  `app/opengraph-image.png` and `components/ui/AppLogo.tsx` exactly as they are.
- **Do not** spend effort on brand copy, taglines, or visual identity polish.
- When writing new user-facing text, **use the existing name inline** — do not invent
  a placeholder token in shipped code. But keep name references **few and centralized**
  so the future rename is a small diff. Prefer importing from one constant:

  ```ts
  // lib/brand.ts  ← create this in doc 02
  export const PRODUCT_NAME = 'MV Habits';
  export const SUPPORT_EMAIL = 'support@yourdomain.com';
  export const COMPANY_LEGAL_NAME = '…';   // fill before legal pages go live
  ```

  Use `PRODUCT_NAME` in new components. Do not go back and refactor the ~40 existing
  hardcoded occurrences — that is churn, and the rename will handle them.

### Placeholders → `DECISIONS.md`

Documents use `{{TOKEN}}` placeholders (`{{DOMAIN}}`, `{{LEGAL_ENTITY}}`,
`{{SUPPORT_EMAIL}}`, `{{LEGAL_ADDRESS}}`, `{{JURISDICTION}}`, …).

**Every one of them resolves from [`DECISIONS.md`](DECISIONS.md).** Fill that file in
once and paste it alongside each task document. An agent that hits an unresolved token
must leave `TODO(DECISIONS.md)` and report it — never guess. A guessed company name in a
privacy policy or a guessed price on a checkout page looks correct and ships silently.

### Engineering conventions

- Server components by default. Add `'use client'` only when you need state, effects,
  or browser APIs.
- API routes return `{ data, error }` — match the existing shape in `app/api/entries/route.ts`.
- Validate every request body with Zod. Put schemas in `lib/validations/`.
- Never log secrets, tokens, full request bodies, or PII.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It may only be used in route
  handlers and cron jobs.
- Style with the existing CSS variables (`var(--accent-primary)`, `var(--text-primary)`,
  `var(--bg-card)`, …). Do not introduce a second color system.
- Before declaring a task done: `npm run typecheck && npm run lint && npm run build`.

---

## 4. The documents

| # | File | What it covers |
|---|---|---|
| — | [`DECISIONS.md`](DECISIONS.md) | **Fill this in first.** Every domain, price, legal detail, and vendor choice. Paste it with every other doc. |
| 01 | [`01-launch-blockers.md`](01-launch-blockers.md) | Real bugs and dead code that must be fixed first |
| 02 | [`02-landing-page.md`](02-landing-page.md) | Public marketing page at `/`, footer, routing change |
| 03 | [`03-pricing-and-feature-gating.md`](03-pricing-and-feature-gating.md) | Free vs Premium matrix, server-side enforcement |
| 04 | [`04-payments-integration.md`](04-payments-integration.md) | Checkout, webhooks, subscription state, billing portal |
| 05 | [`05-international-readiness.md`](05-international-readiness.md) | Currency, tax, timezones, formatting, i18n scaffold |
| 06 | [`06-legal-and-compliance.md`](06-legal-and-compliance.md) | Privacy, terms, refunds, GDPR/DPDP, account deletion |
| 07 | [`07-email-and-auth-production.md`](07-email-and-auth-production.md) | Custom SMTP, email templates, OAuth production config |
| 08 | [`08-security-hardening.md`](08-security-hardening.md) | Rate limiting, CSP, RLS audit, secrets, brute force |
| 09 | [`09-observability-and-analytics.md`](09-observability-and-analytics.md) | Sentry, logging, uptime, product analytics |
| 10 | [`10-infrastructure-and-deployment.md`](10-infrastructure-and-deployment.md) | Supabase envs, migrations, backups, domains, env vars |
| 11 | [`11-testing-and-ci.md`](11-testing-and-ci.md) | GitHub Actions, Playwright smoke tests, RLS tests |
| 12 | [`12-seo-and-onboarding.md`](12-seo-and-onboarding.md) | Metadata, OG, structured data, first-run experience |
| 13 | [`13-go-live-checklist.md`](13-go-live-checklist.md) | The ordered runbook for launch day |

---

## 5. Execution phases

Work top to bottom. Do not start a phase until the previous one is green.

**Phase 0 — Fix what's broken** (1–2 days)
`01`

**Phase 1 — Make it a product** (4–7 days)
`02` → `03` → `12`

**Phase 2 — Make it sellable** (4–6 days)
`04` → `05` → `06`

**Phase 3 — Make it safe to run** (3–5 days)
`07` → `08` → `09`

**Phase 4 — Make it operable** (2–4 days)
`10` → `11`

**Phase 5 — Ship** (1 day)
`13`

> If you must cut scope to launch sooner, the honest minimum is:
> `01`, `02`, `03`, `04`, `06`, `07`, `10`, `13`.
> Skipping `08` (rate limiting) and `09` (error tracking) means launching blind and
> exposed — acceptable only for a soft launch to a handful of users.

---

## 6. Status tracker

Update this as work completes. `⬜ not started · 🟨 in progress · ✅ done · ⏭️ deliberately skipped`

| Doc | Title | Status | Notes |
|---|---|---|---|
| 01 | Launch blockers | 🟨 | All 🤖 agent tasks done. Blocked on human: apply migrations 029 + 030, upgrade Vercel to Pro, verify a reminder on a real device. |
| 02 | Landing page | ✅ | Server component marketing page, hero preview, navbar anchors, pricing toggle, native details FAQ, footer added to public pages. |
| 03 | Pricing & gating | ⬜ | |
| 04 | Payments | ⬜ | Provider decision required — see doc |
| 05 | International readiness | ⬜ | |
| 06 | Legal & compliance | ⬜ | Needs real legal entity details |
| 07 | Email & auth | ⬜ | Blocker: Supabase default SMTP is rate-limited |
| 08 | Security hardening | ⬜ | |
| 09 | Observability | ⬜ | |
| 10 | Infrastructure | ⬜ | |
| 11 | Testing & CI | ⬜ | |
| 12 | SEO & onboarding | ⬜ | |
| 13 | Go-live checklist | ⬜ | |

---

## 6b. Built but unreachable — do not delete, re-wire

A dead-code sweep found that an earlier component-based dashboard
(`TodayHabits` and its tree) was replaced by the monolithic
`components/dashboard/FitnessSummary.tsx`, and ~23 files that only the old
dashboard reached were removed. These survivors were **deliberately kept**: the
code works, but nothing reaches it because its only caller was deleted. Each is
a feature the app already paid for and silently stopped shipping.

| What | Where | Needs |
|---|---|---|
| Onboarding wizard (419 lines, complete) | `components/onboarding/OnboardingWizard.tsx` | Re-mount in `FitnessSummary` for first-run users. **Doc `12` should wire this up, not rebuild it.** |
| Realtime entry sync | `lib/hooks/useRealtimeEntries.ts` | Re-mount in `FitnessSummary` so multi-device updates work again |
| AI habit coach | `app/api/coach/route.ts` (`@anthropic-ai/sdk`) | No UI calls it. **Doc `03` gates it as Premium (`FREE_AI_COACH: no`) — it must be reachable before it can be sold.** |
| Habit reordering | `app/api/habits/reorder/route.ts` | No UI calls it. Drag-and-drop died with `HabitList`; `@hello-pangea/dnd` is still installed for it |

**Removed outright:** the social feature (Network + Feed tabs, `components/social/`,
`app/api/social/*`, and the `friends` / `families` / `family_members` /
`feed_reactions` / `feed_comments` tables via migration `031`). It was a shell —
no UI could create a connection or set `habits.visibility`, and `profiles_select`
was never widened past `auth.uid() = id`, so the feed was empty by construction
for every user. Doc `03` no longer prices it.

> Removing any of these is a product decision, not cleanup. They are the reason
> `@hello-pangea/dnd` and `@anthropic-ai/sdk` are still in `package.json`.

---

## 7. Decisions the owner must make (not the AI)

**Record the answers in [`DECISIONS.md`](DECISIONS.md)** — that file is what the agent
reads. This table only says what blocks what.

| # | Decision | Blocks | Default recommendation |
|---|---|---|---|
| D1 | Payment provider | `04` | Paddle (Merchant of Record) — see doc 04 §1. **Apply early — longest lead time in the launch.** |
| D2 | Price points and what's free | `02`, `03`, `04` | See doc 03 §2 for a proposed matrix |
| D3 | Legal entity — sole proprietor vs company | `04`, `06` | Required for payment provider KYC |
| D4 | Production domain | `10`, `12` | — |
| D5 | Vercel plan — Hobby vs Pro | `01`, `10` | **Pro** — Hobby caps cron at once-daily, which breaks reminders |
| D6 | Keep or drop the orphaned trip/expense tables | `01` | Drop — see doc 01 §B5. ⚠️ Back up first. |
| D7 | Analytics vendor | `09` | PostHog Cloud EU (GDPR-friendly) |

---

## 8. Seven things that must never be delegated

An agent may **write** these. Only a human should **run** them.

| Where | What | Why |
|---|---|---|
| any doc | Applying a database migration | Agent writes the `.sql`; human applies it. Always. |
| `01` §B5 | `DROP TABLE` on 9 tables + deleting a storage bucket | Irreversible data loss |
| `01` §B3 | Deleting the passcode UI and handlers | Must first verify `SecuritySettings.tsx` doesn't depend on them |
| `03` §4 | The billing-guard migration | Changes authorization — verify the escalation test right after |
| `04` | Switching payment keys from sandbox → production | Real money |
| `06` §4.3 | The account-deletion cron | Deletes user data and storage objects |
| `08` §5 | Rotating secrets | Rotating VAPID invalidates every existing push subscription |

Also: **nothing** in this folder runs against the production database. Staging only —
see doc `10` §2.

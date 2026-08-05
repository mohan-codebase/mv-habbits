# 11 — Testing and CI

> **Phase 4.** Requires doc `10` (staging environment + seed script).
>
> **Repo context:** Next.js 16 + React 19 + TypeScript. Scripts available today:
> `dev`, `build`, `start`, `lint` (ESLint 9 flat config in `eslint.config.mjs`),
> `typecheck` (`tsc --noEmit`). **There are zero tests in the repository.** Vercel
> auto-deploys `main` with nothing gating it. See `00-INDEX.md`.

---

## 1. Reality check on scope

This is a solo project of ~21,000 lines. A 90%-coverage unit test suite is not a
realistic or useful goal, and chasing it will delay launch for little benefit.

**What actually protects you** at this stage, in order of value per hour spent:

1. **CI that blocks a broken build from deploying** — 1 hour, catches the most common failure
2. **RLS tests** — the security boundary is Postgres policies; a wrong one is a breach
3. **Smoke tests of the critical paths** — signup, check-in, checkout
4. **Unit tests of pure business logic** — streaks, date math, tier limits
5. Everything else — later

Do 1–4. Skip the rest until there's a reason.

---

## 2. CI — GitHub Actions

Currently nothing checks a commit before Vercel deploys it. Worse: Next.js 16 **dropped
the integrated ESLint step from `next build`** — `next.config.ts` even notes this — so
lint currently runs nowhere automatically.

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Typecheck
        run: npm run typecheck
      - name: Lint
        run: npm run lint
      - name: Build
        run: npm run build
        env:
          # Build-time only. Point at the staging project, never production.
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_SITE_URL: https://staging.{{DOMAIN}}

  test:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run test:unit
```

Then in GitHub → Settings → Branches → protect `main`:

- [ ] Require the `check` job to pass before merge
- [ ] Require a pull request (even solo — it forces CI to run before deploy)
- [ ] Disallow force pushes

---

## 3. Unit tests — Vitest

```bash
npm i -D vitest @vitest/coverage-v8
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

Add to `package.json`:

```json
"test:unit": "vitest run",
"test:watch": "vitest"
```

### What to test — pure logic only

| File | Why it matters |
|---|---|
| `lib/utils/dates.ts` | `todayString`, `isHabitActiveOnDate`, `toLocalDateString`. Date math is where habit trackers break, and it's pure — cheap to test thoroughly. |
| `lib/stats/habitStats.ts` | `computeBestStreak`, `computeLifetimeCompletions` — drives the headline dashboard numbers. |
| `lib/coach/aggregate.ts` | `buildCoachSummary`, `bestWeekday`. Also verify it emits **no raw note text** — that's a privacy assertion worth locking down in a test. |
| `lib/validations/entry.ts`, `lib/validations/habit.ts` | Zod schemas: accept valid, reject invalid, and confirm the HTML/control-char stripping actually strips. |
| `lib/tier.ts` (doc `03`) | Limit resolution, trial and grace-period expiry. Test the boundary: `premium_until` one second in the past. |
| `lib/pricing.ts` | Plan shape consistency. |
| `lib/utils/import.ts` | Malformed backup files must be rejected, not crash. |

Timezone tests need explicit control:

```ts
// Never let the test machine's timezone decide the result.
// Set TZ=UTC in the test script, and pass timezones explicitly.
```

Set `"test:unit": "TZ=UTC vitest run"`.

### What NOT to unit test

- React components — low value here, high maintenance. The smoke tests cover what matters.
- Supabase client wrappers — you'd be testing mocks.
- Anything that just forwards arguments.

---

## 4. RLS tests 🔴 — highest security value

Doc `08` §2.2 defines the permission matrix. Codify it so a future migration cannot
silently widen access.

Create `tests/rls/` with tests that hit the **Supabase REST API directly** using each
test user's own JWT — not your API routes. That is what an attacker uses.

```ts
// tests/rls/habit-entries.test.ts  (sketch)
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

// Three seeded users: A and B are friends; C is unrelated.
// Credentials come from the staging seed script (doc 10 §2).

describe('habit_entries RLS', () => {
  it('owner can read their own entries', async () => { /* … */ });

  it('friend CANNOT read entries of a private habit', async () => {
    const { data } = await clientB.from('habit_entries').select('*').eq('user_id', userA.id);
    expect(data?.some(e => e.habit_id === privateHabitId)).toBe(false);
  });

  it('friend CAN read entries of a friends-visibility habit', async () => { /* … */ });

  it('stranger reads nothing of user A', async () => {
    const { data } = await clientC.from('habit_entries').select('*').eq('user_id', userA.id);
    expect(data).toHaveLength(0);
  });

  it('pending (unaccepted) friendship grants no access', async () => { /* … */ });

  it('nobody can update another user\'s entry', async () => {
    const { error } = await clientB.from('habit_entries')
      .update({ is_completed: true }).eq('id', entryOfA.id);
    expect(error).toBeTruthy();
  });
});
```

**The single most important test in the whole suite:**

```ts
it('a user cannot escalate their own tier', async () => {
  const { error } = await clientA.from('profiles')
    .update({ tier: 'premium' }).eq('id', userA.id);
  expect(error).toBeTruthy();
});
```

Run these against **staging only**, never production. Gate them behind an env var so a
misconfigured run cannot touch real data.

Cover: `profiles`, `habits`, `habit_entries`, `categories`, `achievements`, `goals`,
`friends`, `family_members`, `feed_reactions`, `feed_comments`, `push_subscriptions`,
`ai_insights`, `habit_lock_credentials`, `subscriptions`, `billing_events`.

---

## 5. Smoke tests — Playwright

```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
```

Keep the suite **small and reliable**. Five flaky tests are worse than zero — you'll
start ignoring the red.

### The critical paths

| # | Flow | Assertion |
|---|---|---|
| 1 | Landing page loads | Hero headline visible; all four nav anchors resolve to a section |
| 2 | Sign up → confirm → dashboard | Reaches `/dashboard` (use a mailbox API or Supabase admin to confirm) |
| 3 | Sign in → dashboard | Habits render |
| 4 | Create a habit | Appears in today's list without a page reload |
| 5 | Check in a habit | Toggle sticks; count and ring update |
| 6 | Free-tier habit limit | 6th habit blocked with an upgrade prompt, not an error |
| 7 | Upgrade flow | Checkout button redirects to the provider (sandbox) |
| 8 | Sign out | Redirects to `/login`; `/dashboard` is no longer reachable |
| 9 | Legal pages | `/privacy`, `/terms`, `/refunds` load without a session |
| 10 | Account deletion request | Confirmation state shown, grace period communicated |

### Rules

- Run against **staging**, with seeded users.
- Each test creates its own data and cleans up, or uses a dedicated user — do not depend
  on test ordering.
- No `waitForTimeout`. Wait on elements and network idle. This app is full of optimistic
  UI and realtime updates; arbitrary sleeps will flake.
- Run in CI on PRs and nightly. Keep total runtime under 5 minutes.

Add `"test:e2e": "playwright test"`.

---

## 6. Manual test checklist

Some things are not worth automating but must be verified before launch. Keep this as a
living checklist in the repo.

**Devices** — real hardware, not just emulation:
- [ ] iOS Safari (PWA installed to home screen — the manifest sets `display: standalone`)
- [ ] Android Chrome (installed PWA)
- [ ] Desktop Chrome, Safari, Firefox
- [ ] Both light and dark themes on each

**PWA specifics**
- [ ] Install prompt appears (`components/ui/InstallPwaPrompt.tsx`)
- [ ] Installed app opens standalone, no browser chrome
- [ ] Push notification permission → subscribe → receive a real reminder
- [ ] Icons render correctly on the home screen (maskable variants)
- [ ] Service worker updates without breaking navigation — this app previously had RSC
      corruption from an over-eager SW; re-verify after any `sw.js` change

**Realtime**
- [ ] Two devices signed in as the same user; check in on one, watch the other update

**Timezone** (doc `05`)
- [ ] Change device timezone; verify "today" and streaks follow

**Accessibility**
- [ ] Keyboard-only: complete signup, create a habit, check it in
- [ ] Screen reader pass on the dashboard (VoiceOver or NVDA)
- [ ] `axe` DevTools scan on landing, dashboard, and settings — zero critical issues

---

## 7. Task list

> Requires the staging Supabase project and `scripts/seed.mjs` from doc `10`.
>
> **⚠️ Every test in this document runs against staging.** Add an explicit guard that
> refuses to run if the Supabase URL matches production.

### 👤 Human

- [ ] Add `STAGING_SUPABASE_URL` and `STAGING_SUPABASE_ANON_KEY` to GitHub repository
      secrets
- [ ] Enable branch protection on `main` requiring the `check` job *(GitHub settings UI)*
- [ ] Work through the manual device checklist in §6 — real iPhone and real Android,
      installed as PWAs, including receiving an actual push notification. **No agent can
      do this**, and the push path is the most likely thing to be broken.
- [ ] Screen-reader pass on the dashboard (VoiceOver / NVDA)

### 🤖 Agent

- [ ] `.github/workflows/ci.yml` — typecheck, lint, build
- [ ] Install Vitest; add `test:unit` with `TZ=UTC`
- [ ] Unit tests for the files in §3 (dates, streak stats, coach aggregation, validation
      schemas, tier limits)
- [ ] Include the assertion that `lib/coach/aggregate.ts` emits **no raw note text** —
      that is a privacy guarantee worth locking down
- [ ] `tests/rls/` covering the doc `08` §2.2 matrix, including 🔴 the tier-escalation
      test — that one must assert the update **fails**
- [ ] Install Playwright; write the 10 smoke tests in §5. No `waitForTimeout` — this app
      has optimistic UI and realtime updates; arbitrary sleeps will flake.
- [ ] Wire e2e into CI (PR + nightly)
- [ ] Commit the manual checklist from §6 into the repo
- [ ] Run the suite 3 times consecutively and report any flakes
- [ ] `npm run typecheck && npm run lint && npm run build`

## 8. Acceptance criteria

- [ ] CI blocks merging a commit that fails typecheck, lint, or build.
- [ ] `npm run test:unit` passes and covers date math, streak computation, validation
      schemas, and tier limits.
- [ ] Every RLS test passes; the tier-escalation test **fails to escalate**.
- [ ] All 10 Playwright smoke tests pass against staging, in under 5 minutes, with no
      flakes across 3 consecutive runs.
- [ ] The manual device checklist has been completed and signed off.

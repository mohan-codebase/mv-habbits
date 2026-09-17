# 01 — Launch Blockers

> **Phase 0.** Do this document first. Everything here is a real defect or dead code
> found by auditing the repository. None of it is speculative cleanup.
>
> **Repo context:** Next.js 16 (App Router) + React 19 + TypeScript, Supabase backend
> (Postgres + RLS + Realtime), Tailwind v4, deployed on Vercel. Middleware lives in
> `proxy.ts` (Next 16 renamed it). Migrations in `supabase/migrations/` are applied by
> hand. See `00-INDEX.md` for the full map.
>
> **Do not touch the logo or product name** — a rebrand is planned post-launch.

---

## B1 — Push reminders effectively never fire 🔴 CRITICAL

### The bug

`app/api/cron/reminders/route.ts` is written to run **every 5 minutes**. Its header
comment says so, and its logic proves it: `timeWindow()` builds a **±2 minute** set of
`HH:MM` strings around "now" and only notifies habits whose `reminder_time` falls
inside that window.

```ts
// app/api/cron/reminders/route.ts
function timeWindow(nowHHMM: string): string[] {
  // returns 5 slots: now-2min … now+2min
}
...
const dueHabits = (byUser[userId] ?? []).filter(
  (h) => !userDone.has(h.id) && h.reminder_time && window.includes(h.reminder_time.slice(0, 5))
);
```

But `vercel.json` schedules it **once a day**:

```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }] }
```

**Result:** a habit only ever gets a reminder if its `reminder_time` happens to land in
the 5-minute window around 09:00 UTC. Every other reminder time is silently dropped.
The feature is advertised in `README.md` and in the settings UI, and it does not work.

### Why it is scheduled daily

Vercel's **Hobby plan allows cron jobs to run at most once per day.** Minute-level
schedules require **Pro**. This is almost certainly why the schedule is what it is.
So this is not just a one-line fix — it is a hosting decision.

### Fix — choose one

**Option A (recommended): Vercel Pro + 5-minute cron**

1. Upgrade the Vercel project to Pro.
2. Update `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "*/5 * * * *" }
  ]
}
```

3. Confirm `CRON_SECRET` is set in Vercel env vars for **Production** and **Preview**.
   Vercel sends `Authorization: Bearer $CRON_SECRET` automatically for its own crons.
4. Verify in the Vercel dashboard → Cron Jobs that executions appear every 5 minutes
   and return 200.

**Option B: external cron (stay on Hobby)**

1. Remove the `crons` block from `vercel.json`.
2. Create a job on an external scheduler (GitHub Actions scheduled workflow,
   cron-job.org, or Supabase `pg_cron` + `pg_net`) that POSTs every 5 minutes to
   `https://{{DOMAIN}}/api/cron/reminders` with header
   `Authorization: Bearer <CRON_SECRET>`.
3. GitHub Actions version — create `.github/workflows/reminders-cron.yml`:

```yaml
name: Habit reminders
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder cron
        run: |
          curl -fsS -X POST "https://{{DOMAIN}}/api/cron/reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            --max-time 60
```

> ⚠️ GitHub Actions scheduled workflows are best-effort and can be delayed by 5–15
> minutes under load, which will cause missed reminder windows. If reminders matter to
> the product story, take Option A.

### Additional hardening while you are in this file

- The route currently loads **every habit with a reminder across all users** on every
  invocation. At 5-minute cadence that is 288 full-table scans/day. Add a filter so the
  query only returns plausible candidates, or add an index-backed query. There is
  already an index from migration `008`:
  `idx_habits_reminder_active`. Confirm the query plan uses it.
- Add a hard timeout / batch limit so a large user base cannot exceed the serverless
  function's execution limit. Process users in chunks and return a count.

### Acceptance criteria

- [ ] A habit with `reminder_time = '07:30'` and a valid push subscription receives a
      notification at 07:30 in the user's own timezone.
- [ ] A habit already completed today receives **no** notification.
- [ ] Calling the endpoint without the `Authorization` header returns 401.
- [ ] Expired push subscriptions (HTTP 410) are deleted from `push_subscriptions`.

---

## B2 — Dead navigation to a route that does not exist 🔴

`components/dashboard/DashboardApp.tsx` line ~159:

```ts
const handleSelectApp = async (app: 'habits' | 'trip') => {
  if (app === 'habits') { ... } else {
    router.push('/trip');   // ← app/trip does not exist. This 404s.
  }
};
```

There is no `app/trip/` directory. The trip planner feature was removed from the UI but
its navigation, its database tables, and its icon imports were left behind.

### Fix

1. In `components/dashboard/DashboardApp.tsx`, narrow the type to `'habits'` and delete
   the `else` branch and the now-unused `useRouter` import if nothing else uses it.
2. In `components/dashboard/FitnessSummary.tsx`, remove the leftover trip-related state
   and imports:
   - `const [tripNavOpen, setTripNavOpen] = useState(false);` (~line 1531) — delete if
     it drives nothing rendered.
   - Unused lucide imports from the top of the file: `Luggage`, `Wallet`, `Receipt`,
     `Coins`, `Compass`, `MapPin`, `ExternalLink` — **verify each with a search before
     deleting**; some may still be used elsewhere in the file.
3. Run `npm run lint` — the `no-unused-vars` rule will confirm you got them all.

### Acceptance criteria

- [ ] No reference to `/trip` remains in `app/`, `components/`, or `lib/`.
- [ ] `npm run lint` passes with no unused-import warnings in the touched files.

---

## B3 — The passcode lock screen can never render 🟠

`components/dashboard/DashboardApp.tsx` initializes:

```ts
const [activeApp, setActiveApp] = useState<'habits' | null>('habits');
```

…and then the first return branch is:

```ts
if (activeApp === 'habits') {
  return <FitnessSummary ... />;
}
if (showLockScreen) { /* ~130 lines of lock UI — unreachable */ }
```

Because `activeApp` starts as `'habits'` and nothing sets it to `null` on mount, the
lock screen branch is **dead code**. `habitsUnlockedRef.current = true` is also set
unconditionally in the mount effect. So the passcode + Face ID / Touch ID feature —
including the whole `/api/passcode/*` and `/api/passcode/webauthn/*` surface, and
migrations `020` and `021` — is inert.

### Decision required

**Option A — ship it disabled (fastest, recommended for launch).**
The feature is not advertised anywhere user-facing. Leave the API routes and DB tables
alone (harmless), but delete the unreachable UI branch and its dead state so the file
stops lying about what it does. Add a `TODO` comment pointing at this document.

**Option B — actually enable it.**
Make `activeApp` start as `null`, restore the hub/selector screen that used to call
`handleSelectApp`, and re-test the full create → unlock → biometric → reset flow. This
is real work (the hub screen no longer exists) and is **not** launch-critical.

Recommended: **Option A now**, Option B as a post-launch premium feature (it is a good
Premium differentiator — see doc `03`).

### If you take Option A

1. Delete the `if (showLockScreen) { … }` block and the `FaceIdGlyph` component if
   nothing else uses it.
2. Delete now-unused state: `showLockScreen`, `lockScreenMode`, `passcode`,
   `confirmPasscode`, `passcodeError`, `showPasscodeText`, `passcodeChecking`,
   `biometricSupported`, `biometricBusy`, and the handlers
   `handleVerifyPasscode`, `handleBiometricUnlock`, `handleEnrollBiometric`,
   `handleDisableBiometric`, `handleResetPasscode`, `handleSelectApp`, `handleBackToHub`.
3. **Keep** `/api/passcode/*` routes and migrations `020`/`021` — they are needed if
   Option B happens later, and they are not reachable without a session anyway.
4. Note in `components/settings/SecuritySettings.tsx` whether it references any of
   these endpoints — **check before deleting handlers**, that file is 487 lines and may
   own the real UI for this.

> ⚠️ Do this check first: `grep -rn "api/passcode" app components lib`. If
> `SecuritySettings.tsx` already exposes passcode setup, then the feature *is* reachable
> from Settings and only the `DashboardApp` copy is dead. In that case delete only the
> `DashboardApp` duplication.

### Acceptance criteria

- [ ] `components/dashboard/DashboardApp.tsx` is under 150 lines and every branch in it
      is reachable.
- [ ] No behavior visible to a user changed.
- [ ] `npm run typecheck` and `npm run lint` pass.

---

## B4 — Streak calculation ignores the user's timezone 🟠

`supabase/migrations/007_optimized_streaks.sql` computes streaks with:

```sql
v_today DATE := CURRENT_DATE;   -- Postgres server time = UTC
```

Every other part of the app is timezone-aware via `profiles.timezone` (default
`Asia/Kolkata`). For a user in IST (UTC+5:30), between 00:00 and 05:30 local time the
database still thinks it is *yesterday*. A habit completed at 00:30 IST can therefore
fail the `entry_date = v_today OR entry_date = v_today - 1` anchor check and the streak
can read low by one, or reset visibly on the dashboard.

There is a second, smaller issue: the trigger is

```sql
AFTER INSERT OR UPDATE OF is_completed ON public.habit_entries
```

so **deleting** an entry never refreshes the cached counters on `habits`. Streaks can
stay inflated after a delete.

### Fix

Create `supabase/migrations/029_streak_timezone_fix.sql`:

```sql
-- 029: make streak calculation timezone-aware and refresh on DELETE.

CREATE OR REPLACE FUNCTION public.calculate_streak(p_habit_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_tz     TEXT;
  v_today  DATE;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_tz
  FROM public.profiles WHERE id = p_user_id;

  -- "Today" in the user's own calendar, not the server's.
  v_today := (now() AT TIME ZONE COALESCE(v_tz, 'UTC'))::date;

  WITH completed_dates AS (
    SELECT entry_date
    FROM public.habit_entries
    WHERE habit_id = p_habit_id
      AND user_id  = p_user_id
      AND is_completed = true
    ORDER BY entry_date DESC
  ),
  date_groups AS (
    SELECT entry_date,
           entry_date + (ROW_NUMBER() OVER (ORDER BY entry_date DESC))::INT AS grp
    FROM completed_dates
  ),
  target_group AS (
    SELECT grp FROM date_groups
    WHERE entry_date = v_today OR entry_date = (v_today - 1)
    LIMIT 1
  )
  SELECT COUNT(*) INTO v_streak
  FROM date_groups
  WHERE grp = (SELECT grp FROM target_group);

  UPDATE public.habits
  SET current_streak    = COALESCE(v_streak, 0),
      longest_streak    = GREATEST(longest_streak, COALESCE(v_streak, 0)),
      total_completions = (
        SELECT COUNT(*) FROM public.habit_entries
        WHERE habit_id = p_habit_id AND is_completed = true
      ),
      updated_at = now()
  WHERE id = p_habit_id AND user_id = p_user_id;

  RETURN COALESCE(v_streak, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh on DELETE too. NEW is null on DELETE, so branch on TG_OP.
CREATE OR REPLACE FUNCTION public.refresh_habit_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.calculate_streak(OLD.habit_id, OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_streak(NEW.habit_id, NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_refresh_habit_stats ON public.habit_entries;
CREATE TRIGGER tr_refresh_habit_stats
  AFTER INSERT OR DELETE OR UPDATE OF is_completed ON public.habit_entries
  FOR EACH ROW
  EXECUTE PROCEDURE public.refresh_habit_stats();
```

> `SECURITY DEFINER` functions should have a locked `search_path`. Add
> `SET search_path = public, pg_temp` to both function definitions — Supabase's linter
> flags this and it is a genuine privilege-escalation vector.

### One-time backfill

After applying, recompute every habit once so existing rows are correct:

```sql
SELECT public.calculate_streak(id, user_id) FROM public.habits WHERE is_archived = false;
```

### Acceptance criteria

- [ ] Completing a habit at 00:30 IST extends the streak rather than breaking it.
- [ ] Deleting today's entry decrements `current_streak` on `habits`.
- [ ] `longest_streak` never decreases.
- [ ] Both functions declare `SET search_path = public, pg_temp`.

---

## B5 — Orphaned database tables and features 🟡

These tables exist in Supabase with RLS policies, indexes, and (for trips) a storage
bucket, but **nothing in the application reads or writes them**:

| Migration | Tables | Status |
|---|---|---|
| `001` | `daily_moods` | No UI |
| `010` | `expenses`, `expense_categories` | No UI |
| `011` | `goals` | No UI (but referenced by the visibility policies in `026`) |
| `014`–`019`, `022` | `trip_trips`, `trip_expenses`, `trip_bookings`, `trip_itinerary`, `trip_packing_items`, `trip_documents`, `trip_settlements` | Feature removed |

Note that `supabase/migrations/015_multiple_trips_and_travelers.sql` hardcodes personal
data as a column default:

```sql
ADD COLUMN IF NOT EXISTS travelers TEXT[] NOT NULL DEFAULT ARRAY['Mohan', 'Charles'];
```

That must not exist in a multi-tenant production database.

`lib/utils/export.ts` and `lib/utils/import.ts` both reference a `'trips'` key — check
whether the backup format still emits it, and drop it if so, or old backups will import
into nothing.

### Decision required (D6 in the index)

**Recommended: drop the trip and expense tables before launch.** Reasons: they carry
personal seed data, they expand the RLS surface you have to audit (doc `08`), they
appear in any data-export you owe users under GDPR (doc `06`), and they cannot be used.

**Keep `goals`** — migration `026` attaches visibility policies to it, and a goals
feature is a plausible near-term addition. Keep `daily_moods` for the same reason
(cheap, tiny, plausible).

### Fix (if dropping)

Create `supabase/migrations/030_drop_orphaned_features.sql`:

```sql
-- 030: remove tables for features that were never shipped / were removed.
-- Trip planner
DROP TABLE IF EXISTS public.trip_settlements   CASCADE;
DROP TABLE IF EXISTS public.trip_documents     CASCADE;
DROP TABLE IF EXISTS public.trip_packing_items CASCADE;
DROP TABLE IF EXISTS public.trip_itinerary     CASCADE;
DROP TABLE IF EXISTS public.trip_bookings      CASCADE;
DROP TABLE IF EXISTS public.trip_expenses      CASCADE;
DROP TABLE IF EXISTS public.trip_trips         CASCADE;

-- Personal expense tracker (never shipped)
DROP TABLE IF EXISTS public.expenses           CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
```

Then, **manually in the Supabase dashboard**, delete the `trip-documents` storage
bucket and its objects, plus its `storage.objects` policies from migration `014`.

> ⚠️ **Back up first.** Take a full database backup and confirm it downloads before
> running any `DROP`. See doc `10` for the backup procedure. If there is any real data
> in these tables that the owner wants, export it to CSV first.

### Also clean up

- Remove `'trips'` from the export/import allow-lists in `lib/utils/export.ts` and
  `lib/utils/import.ts` (keep import tolerant of the key so old backups don't error —
  just ignore it).
- Delete the empty directory `app/charttest/`.
- Delete `scripts/apply-trip-migration.mjs` if it only serves the dropped feature.

### Acceptance criteria

- [ ] A full backup exists and was verified before any `DROP` ran.
- [ ] `npm run build` passes.
- [ ] Exporting and re-importing a backup round-trips without errors.

---

## B6 — Hardcoded wrong domain in SEO files 🟡

Two files point at a domain that is not the production domain:

`public/robots.txt`:
```
Sitemap: https://mv-habits.app/sitemap.xml
```

`app/sitemap.ts`:
```ts
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mv-habits.app';
```

And `app/layout.tsx` hardcodes a third:
```ts
metadataBase: new URL("https://mv-habits-eight.vercel.app"),
```

Three different origins. Search engines will index the wrong one and canonical tags
will be wrong.

### Fix

1. Set `NEXT_PUBLIC_SITE_URL=https://{{DOMAIN}}` in Vercel for **Production**, and to the
   preview URL for Preview environments.
2. In `app/layout.tsx`, derive `metadataBase` from the env var:

```ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // …
  openGraph: { /* … */ url: siteUrl, /* … */ },
};
```

3. `public/robots.txt` is static and cannot read env vars. Replace it with a generated
   route — delete `public/robots.txt` and create `app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

4. Doc `12` extends `app/sitemap.ts` with the new landing-page routes. For now just
   confirm it reads `NEXT_PUBLIC_SITE_URL`.

### Acceptance criteria

- [ ] `https://{{DOMAIN}}/robots.txt` and `/sitemap.xml` both return the production origin.
- [ ] No hardcoded `vercel.app` or `mv-habits.app` URL remains in the repo.
      Verify: `grep -rn "mv-habits.app\|vercel.app" app components lib public`

---

## B7 — `/` redirects to `/login`, blocking the landing page 🟡

```ts
// app/page.tsx
import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/login'); }
```

This is correct behavior for a private tool and wrong for a product with a public
marketing site. Note that `components/landing/Navbar.tsx` **already exists** and links
to `/#features`, `/#how-it-works`, `/#pricing`, `/#faq` — a landing page was planned and
never built.

Also relevant: `proxy.ts` treats `/` as non-public. Its `PUBLIC_PATHS` set is:

```ts
const PUBLIC_PATHS = new Set([
  '/login', '/signup', '/privacy', '/terms', '/forgot-password', '/reset-password',
]);
```

`/` is not in it, so an unauthenticated visitor to `/` is redirected to `/login` by the
middleware **before** `app/page.tsx` even runs.

### Fix

This is implemented in full in doc `02`. Here, just record the two changes required:

1. Add `'/'` (and later `/pricing`, `/about`, etc.) to `PUBLIC_PATHS` in `proxy.ts`.
2. Replace `app/page.tsx` with the marketing page; redirect **signed-in** users from `/`
   to `/dashboard` instead (either in `proxy.ts` alongside the existing `isAuthPage`
   logic, or with a server-side check in the page).

Do not do this now — do it as part of doc `02` so the redirect is not removed before
there is something to show.

### Acceptance criteria

- [ ] Deferred to doc `02`. Marked here only so it is not forgotten.

---

## B8 — No account deletion 🟠 (legal blocker)

`components/settings/DataManagement.tsx` implements **export** and **import** only.
There is no way for a user to delete their account.

Under GDPR Art. 17 and India's DPDP Act 2023 this is a legal requirement once you have
users outside your own household. It is also an app-store / payment-provider review
item.

Full implementation lives in doc `06` (§4). Listed here because it is a hard blocker
for a public launch, not a nice-to-have.

---

## Summary checklist

| ID | Issue | Severity | Owner | Est. |
|---|---|---|---|---|
| B1 | Reminders never fire (cron schedule vs logic) | 🔴 Critical | 👤+🤖 | 2h + plan upgrade |
| B2 | Dead `/trip` navigation | 🔴 Broken link | 🤖 | 1h |
| B3 | Unreachable passcode lock UI | 🟠 Dead code | 🤖 ⚠️ | 2h |
| B4 | Streaks use UTC, not user timezone; no DELETE refresh | 🟠 Data correctness | 👤+🤖 | 2h |
| B5 | Orphaned tables incl. hardcoded personal data | 🟡 Cleanup / privacy | 👤 ⚠️ | 3h |
| B6 | Three different hardcoded domains | 🟡 SEO | 🤖 | 1h |
| B7 | `/` redirects to login | 🟡 | — | deferred to doc 02 |
| B8 | No account deletion | 🟠 Legal | — | deferred to doc 06 |

## Task split

> Needs from `DECISIONS.md`: `CRON_STRATEGY`, `VERCEL_PLAN`, `DROP_ORPHANED_TABLES`,
> `PASSCODE_LOCK_FEATURE`, `DOMAIN`.

### 👤 Human

- [ ] Decide `CRON_STRATEGY` and `VERCEL_PLAN` (B1) — Hobby caps cron at once-daily,
      which is the whole reason reminders are broken
- [ ] ⚠️ **Take and verify a full database backup before anything in B5.** See doc `10`
      §5. Do not let an agent run a `DROP` for you.
- [ ] ⚠️ Apply migration `029` (B4) to Supabase, then run the one-time streak backfill
- [ ] ⚠️ Apply migration `030` (B5) **only** if `DROP_ORPHANED_TABLES = yes`, and only
      after the backup is verified. Then delete the `trip-documents` storage bucket and
      its policies by hand.
- [ ] Decide `PASSCODE_LOCK_FEATURE` (B3)
- [ ] Verify on a real device that a reminder arrives at a non-09:00 time (B1)

### 🤖 Agent

- [ ] B1 — update `vercel.json` (or write the external-cron workflow); add the batching /
      timeout hardening to the reminders route
- [ ] B2 — remove the dead `/trip` navigation and the orphaned imports.
      ⚠️ **Search before deleting each lucide import** — some are used elsewhere in that
      2,137-line file.
- [ ] B3 — ⚠️ **Run `grep -rn "api/passcode" app components lib` FIRST.** If
      `components/settings/SecuritySettings.tsx` already exposes passcode setup, the
      feature *is* reachable and only the `DashboardApp` copy is dead — delete just that.
      Report what you found before deleting anything.
- [ ] B4 — write migration `029` (timezone-aware streaks + DELETE trigger +
      `SET search_path`). **Write only; do not apply.**
- [ ] B5 — write migration `030`. **Write only; do not apply.** Then clean up the
      `'trips'` key in `lib/utils/export.ts` / `import.ts`, delete the empty
      `app/charttest/` directory, and remove `scripts/apply-trip-migration.mjs`.
- [ ] B6 — `NEXT_PUBLIC_SITE_URL` as single source of truth; `app/robots.ts` replacing
      the static file; fix `metadataBase`
- [ ] `npm run typecheck && npm run lint && npm run build`

**Definition of done for this document:** `npm run typecheck && npm run lint && npm run build`
all pass, migrations `029` (and `030` if dropping) are applied to the Supabase project,
a reminder push notification has been received on a real device at a non-09:00 time, and
the status row for `01` in `00-INDEX.md` is set to ✅.

# 05 — International Readiness

> **Phase 2.** Requires doc `04`. "International" here means two separate things —
> **selling** globally (tax, currency, invoicing) and **serving** globally (timezones,
> formatting, language). This document covers both and is explicit about which parts are
> launch-critical and which are phase 2.
>
> **Repo context:** Next.js 16 App Router, `date-fns` + `date-fns-tz` already installed.
> `profiles.timezone` exists (default `'Asia/Kolkata'`). Every user-facing date is
> supposed to be computed in the user's timezone — see `app/dashboard/page.tsx` for the
> reference pattern. See `00-INDEX.md`.

---

## 1. What is already right

Credit where due — the timezone handling is better than most projects at this stage:

- `profiles.timezone` is stored per user.
- `app/dashboard/page.tsx` computes "today" with
  `formatInTimeZone(new Date(), userTz, 'yyyy-MM-dd')`.
- `app/api/cron/reminders/route.ts` computes each user's **local calendar date** before
  deciding whether a habit is done, with a comment explaining exactly why (a UTC date
  would re-fire reminders for IST users past midnight).
- `app/api/achievements/check/route.ts` reads the profile timezone.

## 2. What is wrong

### 2.1 Streaks compute in UTC 🔴

Covered as blocker **B4** in doc `01`. If that is not done, do it before this document.

### 2.2 The default timezone is hardcoded to `Asia/Kolkata` 🟠

It appears as a fallback in at least four places:

```
supabase/migrations/001_initial_schema.sql : timezone TEXT DEFAULT 'Asia/Kolkata'
app/dashboard/page.tsx                     : let userTz = 'Asia/Kolkata';
app/api/achievements/check/route.ts        : profile?.timezone || 'Asia/Kolkata'
```

For an international product this is wrong: a user in São Paulo who never opens settings
gets an IST calendar, and their day rolls over at 18:30 local.

**Fix:**

1. Detect the timezone in the browser at signup and store it:
   ```ts
   const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. 'Europe/Berlin'
   ```
   Write it to `profiles.timezone` in the signup flow (`app/signup/page.tsx` and the
   OAuth path in `app/auth/callback/route.ts`).
2. Change the SQL default to `'UTC'` in a new migration — a neutral default is honest,
   a wrong-continent default is not:
   ```sql
   -- 033_neutral_timezone_default.sql
   ALTER TABLE public.profiles ALTER COLUMN timezone SET DEFAULT 'UTC';
   ```
   Do **not** backfill existing rows — current users really are in IST.
3. Replace every `'Asia/Kolkata'` code fallback with `'UTC'`.
4. Add a timezone selector to Settings (`app/dashboard/settings/page.tsx`) with an
   "auto-detect" button. Validate the value against `Intl.supportedValuesOf('timeZone')`
   before saving, server-side.
5. **Detect drift**: if the browser's timezone differs from the stored one, show a
   one-line prompt — "Looks like you're in Europe/Berlin now. Update?" Travelers and
   movers otherwise get silently wrong streaks.

### 2.3 Week start day is stored but unused 🟡

`profiles.week_start_day` (integer, default `1` = Monday) exists in migration `001` and
in `types/profile.ts`, but nothing reads it. Analytics and the dashboard week strip
assume a fixed week. US, Canada, Japan, and much of Latin America start the week on
Sunday; most of Europe and India on Monday.

**Fix:** read `week_start_day` in `app/dashboard/page.tsx`, the analytics pages, and
`components/analytics/CalendarHeatmap.tsx`, and pass it to the `date-fns`
`weekStartsOn` option. Add the setting to the Settings page.

### 2.4 Locale-blind formatting 🟡

`app/dashboard/page.tsx` does:

```ts
const dayName = new Date().toLocaleDateString(undefined, { weekday: 'long' });
```

`undefined` locale on the **server** resolves to the server's locale (Vercel = `en-US`),
not the user's. Server-rendered dates will say "Monday" and "January 5" regardless of
the visitor, and can mismatch what the client would render (hydration drift).

**Fix:** decide the locale explicitly.

- Simplest correct answer for launch: **format all dates on the client** for anything
  locale-sensitive, or **pin the app to `en-US`** consistently and accept it.
- Better: store a `locale` column on `profiles` alongside `timezone`, detected at signup
  from `navigator.language`, and pass it explicitly to every `toLocaleDateString` /
  `Intl.*` call.

Do the `locale` column — it is 30 minutes of work now and unblocks §5 later.

---

## 3. Selling internationally

### 3.1 Tax — solved by the choice in doc `04`

If you use a Merchant of Record (Paddle / Lemon Squeezy / Dodo), **they are the seller
of record** and handle VAT/GST/sales-tax registration, collection, remittance, and
invoicing in every jurisdiction. That is the entire reason for the recommendation.

What you still owe:

- Your own income tax on the payouts you receive (India: business income; if exporting
  services, keep the LUT/FIRC paperwork your CA asks for).
- Accurate product tax categorization in the provider dashboard (choose "SaaS /
  digital service" — the category drives the tax rate).
- Your legal entity name and address on the site (doc `06`).

If you instead go direct with Stripe, tax becomes a whole project. Re-read doc `04` §1.

### 3.2 Currency display

At launch: **price in USD, charge in USD.** It is the least surprising option for a
global audience and the MoR handles the buyer's FX conversion at checkout.

Improvements, in order of value:

1. **Show local currency on the pricing page.** Paddle and Lemon Squeezy both expose a
   localized price API/JS that returns the buyer's price in their currency. Use it —
   seeing "₹399/mo" instead of "$4.99/mo" measurably improves conversion.
2. **Purchasing-power parity pricing** — a discount for lower-income countries. Both
   Paddle and Lemon Squeezy support per-country price overrides. Worth doing once you
   have traffic data; it is a pricing decision, not an engineering one.
3. Never store or compute money as a float. `unit_amount_cents INTEGER` in migration
   `032` is correct — keep that discipline everywhere.

Format money with `Intl.NumberFormat`, never string concatenation:

```ts
new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
```

### 3.3 Invoices

The MoR issues them. Link to the provider's customer portal from
`app/dashboard/billing/page.tsx` (doc `04` §5.3) rather than generating your own. Some
jurisdictions have strict invoice-content rules; do not hand-roll this.

---

## 4. Serving internationally

### 4.1 Performance outside your region

Supabase runs in **one region**. Every database read pays the round trip from the Vercel
edge to that region. A user in Brazil hitting a Singapore database feels it on every
page.

- Pick the Supabase region closest to your expected majority of users. Changing it later
  means a migration, so decide before launch.
- Vercel serves the Next.js app from a CDN globally — static assets are fine.
- Server components that make 3 sequential Supabase queries pay 3 round trips. Note that
  `app/dashboard/page.tsx` already batches with `Promise.all` — **keep that pattern** in
  any new page. Audit new server components for sequential awaits.
- Consider Supabase read replicas later if you get real international traffic.

### 4.2 Right-to-left languages

Not needed at launch (English only). When it matters: the layout uses Tailwind
directional utilities (`pl-`, `ml-`, `left-`) extensively, including fixed positioning in
`components/layout/Sidebar.tsx`. RTL would be a real refactor to logical properties
(`ps-`, `ms-`, `start-`). Note it, do not do it now.

### 4.3 Language / i18n — **phase 2, not launch**

Launching English-only is the right call. Translating before you have users translates
guesses. But **do not paint yourself into a corner**: the app currently has user-facing
strings hardcoded inline across ~60 components, and retrofitting i18n later is a large,
boring, error-prone job.

Cheap insurance to take now (a few hours):

- Put all **new** user-facing strings (landing page, billing UI, emails, error messages)
  in a single module per area, e.g. `lib/copy/landing.ts`, `lib/copy/billing.ts`, as
  plain exported objects. No i18n library yet — just centralization.
- When you do adopt `next-intl`, those modules become the first message catalogs and the
  migration is mechanical.

Full i18n plan for later, when justified:

1. `next-intl` with the App Router `[locale]` segment.
2. Locale detection: `Accept-Language` header → user preference in `profiles.locale` →
   fallback `en`.
3. Extract existing strings progressively — highest-traffic screens first (dashboard,
   settings, auth).
4. `hreflang` tags + per-locale sitemaps (doc `12`).
5. Translate the landing page first; it is what drives acquisition.

Languages worth doing first, by habit-app market size: Spanish, Portuguese (BR), German,
French, Japanese.

---

## 5. Data residency and privacy by region

- **EU users**: GDPR applies regardless of where you are hosted. Covered in doc `06`.
  You need a lawful basis, a privacy policy naming subprocessors, data-subject rights,
  and DPAs with Supabase, Vercel, and the payment provider.
- **India (DPDP Act 2023)**: applies to you as the data fiduciary. Covered in doc `06`.
- **California (CCPA/CPRA)**: a "Do Not Sell or Share My Personal Information" link is
  required only if you sell/share data. You do not — state that explicitly in the
  privacy policy and skip the link.
- **Storing EU data outside the EU is allowed** with the right transfer mechanism
  (SCCs), which your subprocessors provide in their DPAs. You do not need an EU region.

---

## 6. Task list

> Needs from `DECISIONS.md`: `SUPABASE_REGION`, `PAYMENT_PROVIDER`, `CURRENCY`.

### 👤 Human

- [ ] Confirm `SUPABASE_REGION` in `DECISIONS.md` — ⚠️ **cannot be changed later without
      a full migration**
- [ ] ⚠️ Apply migration `033` to Supabase
- [ ] Set the product tax category in the payment provider dashboard
- [ ] Verify reminders arrive at the right local time using three test accounts in three
      different timezones *(needs real devices / real push subscriptions)*

### 🤖 Agent — launch-critical

- [ ] Confirm doc `01` B4 (timezone-aware streaks) is already done; if not, stop and say so
- [ ] Detect and store timezone at signup (both the email path in `app/signup/page.tsx`
      and the OAuth path in `app/auth/callback/route.ts`)
- [ ] Write migration `033` — default `timezone` to `'UTC'`; add `locale TEXT` to
      `profiles`. **Write only; do not apply.**
- [ ] Replace all `'Asia/Kolkata'` code fallbacks with `'UTC'` *(leave migration `001`
      alone — never edit an applied migration)*
- [ ] Timezone selector + auto-detect in Settings, validated server-side against
      `Intl.supportedValuesOf('timeZone')`
- [ ] Timezone-drift prompt when browser TZ ≠ stored TZ
- [ ] Money formatted only via `Intl.NumberFormat`; integers only in the DB
- [ ] `npm run typecheck && npm run lint && npm run build`

### 🤖 Agent — should do at launch

- [ ] Wire `week_start_day` into the dashboard, analytics, and heatmap
- [ ] Store `locale` at signup; pass it explicitly to every date/number format call
- [ ] Localized price display on the pricing page via the provider's API

### ⏭️ Phase 2 (post-launch — do not start now)

- [ ] Centralize new copy in `lib/copy/*` modules
- [ ] `next-intl` + `[locale]` routing
- [ ] Translate the landing page
- [ ] PPP pricing by country
- [ ] RTL support

## 7. Acceptance criteria

- [ ] A new signup from a browser set to `America/New_York` gets
      `profiles.timezone = 'America/New_York'`, not `'Asia/Kolkata'`.
- [ ] Completing a habit at 23:55 and again at 00:05 local time counts as **two**
      different days, for a user in any timezone.
- [ ] Reminders arrive at the configured local time for users in at least three
      different timezones (test with three seeded accounts).
- [ ] A user with `week_start_day = 0` sees weeks starting Sunday everywhere.
- [ ] No `'Asia/Kolkata'` literal remains outside migration `001`. Verify:
      `grep -rn "Asia/Kolkata" app components lib`
- [ ] Prices render correctly formatted for `en-US`, `de-DE`, and `en-IN` locales.

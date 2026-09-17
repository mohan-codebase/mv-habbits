# 12 — SEO, Discoverability, and First-Run Experience

> **Phase 1** (SEO parts run alongside doc `02`; onboarding parts can come later).
>
> **Repo context:** Next.js 16 App Router with the Metadata API. `app/layout.tsx` sets
> global metadata (title, description, OpenGraph, Twitter card, `appleWebApp`).
> `app/sitemap.ts` and `public/robots.txt` exist but point at wrong domains (doc `01`
> §B6). `public/manifest.json` is complete, with shortcuts and maskable icons.
> `components/onboarding/OnboardingWizard.tsx` exists and is rendered from
> `components/dashboard/TodayHabits.tsx`. See `00-INDEX.md`.
>
> **⚠️ Do not create new logos or OG artwork that bakes in the current name/mark** —
> a rebrand is coming. Use the existing `app/opengraph-image.png` and existing icons.

---

## 1. Current state

| Item | Status |
|---|---|
| Global metadata | 🟨 Good, but `metadataBase` hardcodes a `vercel.app` URL |
| Per-page metadata | 🔴 Mostly missing — most dashboard and public pages have none |
| `app/opengraph-image.png` | ✅ Exists |
| Sitemap | 🟨 Exists; wrong default domain; missing new routes |
| `robots.txt` | 🟨 Static file with a hardcoded wrong sitemap URL |
| Structured data (JSON-LD) | ❌ None |
| Canonical URLs | ❌ None |
| PWA manifest | ✅ Complete and well-formed |
| Onboarding wizard | ✅ Exists, wired into `TodayHabits` |
| Empty states | 🟨 `components/ui/EmptyState.tsx` exists — verify coverage |

---

## 2. Fix the domain inconsistency first

Three different origins are hardcoded across the repo. This is doc `01` §B6 — do it
there or here, but do it before anything else in this document, or you will generate
canonical tags and OG URLs pointing at the wrong site.

Summary of the fix:
- `NEXT_PUBLIC_SITE_URL` becomes the single source of truth
- `app/layout.tsx` derives `metadataBase` and OG `url` from it
- `public/robots.txt` → replaced by `app/robots.ts`
- `app/sitemap.ts` already reads the env var — just verify

---

## 3. Metadata

### 3.1 Public pages — each needs its own

Add `export const metadata` to every public route. These are the pages search engines
will index.

| Route | Title pattern | Notes |
|---|---|---|
| `/` | `MV Habits — Build daily habits that actually stick` | Primary landing keyword |
| `/login` | `Sign in · MV Habits` | `robots: { index: false }` |
| `/signup` | `Create your free account · MV Habits` | Index this — it converts |
| `/privacy` | `Privacy Policy · MV Habits` | |
| `/terms` | `Terms of Service · MV Habits` | |
| `/refunds` | `Refund Policy · MV Habits` | doc `06` |
| `/cookies` | `Cookie Policy · MV Habits` | doc `06` |

Every one gets `alternates: { canonical: '/path' }`.

### 3.2 Dashboard pages — do not index

All `/dashboard/*` routes are behind auth. `robots.txt` already disallows them, but add
belt-and-braces metadata to the dashboard layout:

```ts
// app/dashboard/layout.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
```

Note that `app/dashboard/network/page.tsx` already sets its own metadata — good pattern,
extend it to the other dashboard pages for browser-tab clarity (title only).

### 3.3 Titles

Add a title template to `app/layout.tsx` so child pages only supply their own segment:

```ts
title: {
  default: 'MV Habits — Build daily habits that actually stick',
  template: '%s · MV Habits',
},
```

Then child pages just set `title: 'Privacy Policy'`.

---

## 4. Open Graph and social cards

- `app/opengraph-image.png` already exists and is picked up automatically by Next's file
  convention. **Verify its dimensions are 1200×630** — that is the size every platform
  expects, and a wrong ratio produces an ugly crop.
- Add `app/twitter-image.png` (can be the same file) if the Twitter card renders poorly.
- Do **not** build a dynamic `opengraph-image.tsx` generator right now. It's fun, it's
  slow to get right, and the rebrand will invalidate the design.
- Test with the real validators before launch: LinkedIn Post Inspector, Facebook Sharing
  Debugger, and by pasting the link into Slack/WhatsApp/iMessage. Each caches
  aggressively — validate **after** the domain is final.

---

## 5. Structured data

Add JSON-LD to the landing page. It is what produces rich results.

```tsx
// in app/page.tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MV Habits',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, iOS, Android',
  description: 'Habit tracker for building daily routines, streaks, and consistency.',
  url: process.env.NEXT_PUBLIC_SITE_URL,
  offers: [
    { '@type': 'Offer', name: 'Free',    price: '0',    priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Premium', price: '4.99', priceCurrency: 'USD' },
  ],
};

// render:
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

> ⚠️ Two things. First, the prices must come from `lib/pricing.ts` (doc `03`), not be
> retyped here — mismatched structured data is worse than none. Second, this uses
> `dangerouslySetInnerHTML`; that is safe **only** because the content is a
> server-controlled constant. Never interpolate user data into it. Also confirm the
> inline script is permitted by the CSP in `next.config.ts` (`script-src` currently
> allows `'unsafe-inline'`, so it works today — if doc `08` §4 adds nonces, this tag
> needs the nonce).

Also add `FAQPage` JSON-LD matching the FAQ section from doc `02` §3.6 — FAQ rich
results take up real estate in search listings.

**Do not** add `AggregateRating` or `Review` markup until you have genuine reviews.
Fabricating them violates Google's guidelines and risks a manual penalty.

---

## 6. Sitemap

Extend `app/sitemap.ts` once the new pages exist:

```ts
const routes = ['', '/login', '/signup', '/privacy', '/terms', '/refunds', '/cookies'];
```

Set sensible priorities: `/` at 1.0, `/signup` at 0.9, legal pages at 0.3. Do not include
`/dashboard/*`.

---

## 7. Content and discoverability (post-launch, but plan now)

A habit tracker cannot rank on "habit tracker" — that SERP is owned by apps with a
decade of domain authority and app-store presence. Realistic paths:

1. **Long-tail content** — `/blog/*` targeting specific intent: "how to build a morning
   routine that sticks", "why habit streaks break at day 21", "habit tracking for ADHD".
   These convert far better than head terms.
2. **Product Hunt launch** — meaningful traffic spike and durable backlink. Prepare the
   assets in advance; do not launch there on day one, launch once the funnel is proven.
3. **Reddit / HN** — participate honestly, don't spam. r/getdisciplined, r/productivity.
4. **App directories** — AlternativeTo, SaaSHub, there's a long tail of these.
5. **PWA install** is your app-store substitute. Make the install prompt good — that's
   §8.

None of this is engineering work. Skip it until the product converts.

---

## 8. First-run experience

This is where most of the actual growth lever sits. A habit app lives or dies on whether
a new user completes their **first check-in**.

### 8.1 Audit the existing wizard

`components/onboarding/OnboardingWizard.tsx` (419 lines) is rendered from
`components/dashboard/TodayHabits.tsx`. Before changing anything, verify:

- [ ] When does it trigger? Only for users with zero habits, or every visit?
- [ ] Can it be dismissed and re-opened?
- [ ] Does it persist progress if the user abandons midway?
- [ ] Does it end with the user having created a habit, or just having read screens?

### 8.2 What the first run should accomplish

In order, and nothing more:

1. **Set timezone** (silently, auto-detected — doc `05` §2.2). No screen for this.
2. **Create the first habit.** Offer 6–8 one-tap templates (Drink water, Read 10 pages,
   Exercise, Meditate, Sleep by 11, No phone in bed) plus "Something else". Template
   choice beats a blank form by a wide margin.
3. **Complete the first check-in immediately.** Do not wait for tomorrow. The user should
   feel the core loop within 60 seconds of signing up.
4. **Ask for push permission — but not yet.** Ask on day 2 or after the second check-in,
   framed with why. Asking on first load gets denied, and browser permission denials are
   effectively permanent.

### 8.3 Empty states

`components/ui/EmptyState.tsx` exists. Verify every list has one and that each includes
an action, not just an illustration:

- [ ] Dashboard with no habits → template picker
- [ ] Analytics with insufficient data → "Check in for 7 days to unlock trends" + progress
- [ ] Achievements with none unlocked → show the nearest one and how far away it is
- [ ] Notes with none → explain that notes attach to check-ins
- [ ] Feed with no connections → link to Network
- [ ] Network with no friends → explain the invite flow

### 8.4 PWA install prompt

`components/ui/InstallPwaPrompt.tsx` and `components/settings/PwaSettingsCard.tsx`
already exist. Installed users retain dramatically better — this is worth tuning.

- [ ] Do not show it on first load. Show after the second or third check-in.
- [ ] iOS cannot use `beforeinstallprompt` — it needs manual "Share → Add to Home
      Screen" instructions. Verify the component detects iOS and shows the right copy.
- [ ] Dismissal must persist. Do not re-prompt every session.

---

## 9. Task list

> Needs from `DECISIONS.md`: `DOMAIN`, `SITE_URL`, pricing (for the JSON-LD offers).

### 👤 Human

- [ ] Validate OG cards on LinkedIn Post Inspector, Facebook Sharing Debugger, and by
      pasting the link into Slack / WhatsApp / iMessage. ⚠️ Do this **after** the domain
      is final — every one of these caches aggressively.
- [ ] Run Google's Rich Results Test against the live landing page
- [ ] Time a real first-run: sign up as a new user and confirm you reach a completed
      check-in in under 60 seconds without reading instructions
- [ ] Verify the PWA install flow on a real iPhone (iOS needs manual "Share → Add to Home
      Screen" — there is no `beforeinstallprompt`)

### 🤖 Agent

- [ ] Fix the domain inconsistency (doc `01` §B6) — prerequisite for everything else here
- [ ] Add the title template to `app/layout.tsx`
- [ ] Add metadata + canonical to all 7 public routes
- [ ] `robots: { index: false }` on `/login` and the dashboard layout
- [ ] Check `app/opengraph-image.png` dimensions; report if not 1200×630.
      ⚠️ **Do not generate replacement artwork** — a rebrand is planned.
- [ ] `SoftwareApplication` + `FAQPage` JSON-LD on the landing page. ⚠️ Prices must be
      imported from `lib/pricing.ts`, never retyped — mismatched structured data is worse
      than none.
- [ ] Extend `app/sitemap.ts` with the new routes
- [ ] Audit `components/onboarding/OnboardingWizard.tsx` against §8.1 and **report what
      it currently does** before changing it
- [ ] Add one-tap habit templates (6–8 options + "Something else")
- [ ] Make the first run end in a completed check-in
- [ ] Defer the push-permission ask to after the second check-in
- [ ] Verify all six empty states have actions; add the missing ones
- [ ] Tune the PWA install prompt timing; confirm iOS detection and instructions; make
      dismissal persist
- [ ] `npm run typecheck && npm run lint && npm run build`

## 10. Acceptance criteria

- [ ] Every public page has a unique title, description, and canonical URL.
- [ ] No `/dashboard/*` route is indexable.
- [ ] `sitemap.xml` and `robots.txt` both serve the production domain.
- [ ] Google's Rich Results Test validates the JSON-LD with no errors.
- [ ] Sharing the landing URL in Slack, WhatsApp, and LinkedIn renders a correct card.
- [ ] A brand-new user reaches their **first completed check-in in under 60 seconds**
      without reading instructions.
- [ ] Every empty state offers a next action.
- [ ] Lighthouse SEO ≥ 95 on `/`.

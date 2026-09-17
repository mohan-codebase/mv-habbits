# 02 — Public Landing Page

> **Phase 1.** Requires doc `01` complete.
>
> **Repo context:** Next.js 16 App Router + React 19 + TypeScript, Tailwind CSS v4 with
> CSS custom properties defined in `app/globals.css` (~1,380 lines of design tokens).
> Framer Motion v12 available. Lucide React for icons. Supabase auth; middleware is
> `proxy.ts`. See `00-INDEX.md`.
>
> **⚠️ Do not touch the logo or the product name.** A rebrand is planned after launch.
> Use `components/ui/AppLogo.tsx` as-is. Do not design a new mark, do not write a new
> tagline that depends on the current name.

---

## 1. Current state

- `app/page.tsx` is **four lines**: `redirect('/login')`.
- `proxy.ts` does not list `/` in `PUBLIC_PATHS`, so unauthenticated visitors are
  bounced to `/login` before the page renders.
- **`components/landing/Navbar.tsx` already exists** and is already used by
  `app/privacy/page.tsx` and `app/terms/page.tsx`. It links to:
  ```ts
  const NAV_LINKS = [
    { label: 'Features',     href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Pricing',      href: '/#pricing' },
    { label: 'FAQ',          href: '/#faq' },
  ];
  ```
  **Those four anchors are the contract.** The landing page must provide section IDs
  matching them exactly, or the existing nav links are broken.
- There is **no footer component**. Privacy and Terms pages end without one.
- `app/privacy/page.tsx` and `app/terms/page.tsx` are well-built and establish the
  visual language for public pages: `PageHero` + `Section` primitives, `bg-bg-secondary`
  hero band, `clamp()` typography, `Outfit` for headings, `IBM Plex Mono` for eyebrow
  labels. **Match that language.** Read those two files before writing anything.

---

## 2. What to build

### 2.1 Routing changes

**`proxy.ts`** — add the public marketing routes:

```ts
const PUBLIC_PATHS = new Set([
  '/',                  // ← new
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/refunds',           // ← new, created in doc 06
  '/forgot-password',
  '/reset-password',
]);
```

Then send signed-in users straight to the app instead of showing them marketing:

```ts
// after the existing isAuthPage handling in proxy.ts
if (user && pathname === '/') {
  const url = request.nextUrl.clone();
  url.pathname = '/dashboard';
  return NextResponse.redirect(url);
}
```

**`app/page.tsx`** — replace the redirect with the marketing page. Keep it a **server
component**. Push interactivity into small client children so the landing page ships
almost no JavaScript.

### 2.2 Create `lib/brand.ts`

One place for the strings the rebrand will change:

```ts
/**
 * Centralized brand strings. The product name and logo are changing after launch —
 * new code should import from here rather than hardcoding, so the rename is a
 * one-file diff. Existing hardcoded occurrences are intentionally left alone.
 */
export const PRODUCT_NAME = 'MV Habits';
export const PRODUCT_TAGLINE = 'Build daily habits that actually stick';
export const SUPPORT_EMAIL = '{{SUPPORT_EMAIL}}';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
```

### 2.3 Page structure

Build these sections in order, in `app/page.tsx`, extracting each into
`components/landing/` as its own file.

| # | Section | `id` | Client JS? |
|---|---|---|---|
| 1 | Navbar | — | already exists |
| 2 | Hero | — | no |
| 3 | Social proof / trust strip | — | no |
| 4 | Features | `features` | no |
| 5 | How it works | `how-it-works` | no |
| 6 | Pricing | `pricing` | yes (monthly/yearly toggle) |
| 7 | FAQ | `faq` | yes (accordion) |
| 8 | Final CTA | — | no |
| 9 | Footer | — | no |

---

## 3. Section-by-section spec

### 3.1 Hero

- **Headline** — the outcome, not the feature. Use the existing metadata line from
  `app/layout.tsx` as the anchor: *"Build daily habits that actually stick."*
- **Subhead** — one sentence, concrete. Mention what makes it different: real-time sync
  across devices, streaks that survive timezones, analytics that show *why* you slip.
- **Primary CTA** → `/signup`, label "Start free".
- **Secondary CTA** → `#pricing` or "See how it works" → `#how-it-works`.
- **Visual** — a product screenshot. Take a real one of `/dashboard` with seeded demo
  data. Do **not** build an animated fake dashboard; it costs days and converts no
  better than a clean static shot. Save to `public/marketing/hero-dashboard.png` and
  serve with `next/image`, `priority`, explicit `width`/`height`.
- **No signup form in the hero** — the app already has a good `/signup` page.

Constraints:
- Largest Contentful Paint must be the headline or the hero image, and must be < 2.5s.
- The hero must not import Framer Motion. Static CSS transitions only.

### 3.2 Trust strip

Below the hero, one quiet row. Since there are no customer logos yet, use factual
signals only — **do not fabricate testimonials, user counts, or ratings.** Acceptable:

- "Your data is yours — export anytime"
- "Works offline as an installable app"
- "No ads, no data selling"
- "Built on Supabase + Vercel"

Replace with real testimonials once you have them.

### 3.3 Features (`id="features"`)

Six cards, three columns on desktop, one on mobile. Each: Lucide icon, 3–5 word title,
one to two sentence body. Draw only from what actually ships today:

| Icon | Title | Body |
|---|---|---|
| `Flame` | Streaks that don't lie | Timezone-aware streak tracking, so midnight in your city is midnight. |
| `BarChart3` | Analytics that explain | Year heatmap, weekday patterns, category breakdown — see when you slip and why. |
| `Zap` | Instant everything | Optimistic toggles that snap immediately and sync across every device in real time. |
| `Bell` | Reminders that arrive | Per-habit reminder times, delivered as native push notifications. |
| `Trophy` | 18 achievements | Streak milestones, perfect weeks, comeback runs — progress you can see. |
| `Sparkles` | AI habit coach | Weekly, personalized insights grounded in your own numbers. |

> The AI coach card is Premium-only (doc `03`). Mark it with a small "Premium" pill.

Rules:
- Every claim must be true of the shipped app. If doc `01` disabled something, do not
  list it.
- No stock illustrations. Icon + text is enough.

### 3.4 How it works (`id="how-it-works"`)

Three steps, numbered, horizontal on desktop:

1. **Add your habits** — Name it, pick a cadence, set a reminder. Takes a minute.
2. **Check in daily** — One tap. Works on your phone as an installed app.
3. **Watch the pattern** — Streaks, heatmaps, and weekly insights show what's working.

### 3.5 Pricing (`id="pricing"`)

> **Depends on doc `03`.** Do not invent prices here. Read
> `03-pricing-and-feature-gating.md` §2 and render exactly that matrix. If doc `03` is
> not done yet, build the section with the layout complete and the numbers pulled from
> a single constants file so they can be filled in without touching JSX.

Requirements:
- Two cards: **Free** and **Premium**. Do not add a third tier at launch.
- Monthly / Yearly toggle. Show the yearly saving as a percentage badge.
- Currency: display in USD at launch. Doc `05` covers local currency display.
- Premium card visually emphasized (border in `var(--accent-primary)`), labeled
  "Most popular" only if that becomes true.
- Each feature line: check icon for included, muted dash for not included.
- CTA on both cards → `/signup?plan=free` / `/signup?plan=premium`. The `plan` query
  param is read after signup to route into checkout (doc `04` §5).
- Below the cards, one line: "Cancel anytime. {{N}}-day refund policy." linking to
  `/refunds` (doc `06`).

Put the numbers in `lib/pricing.ts` so doc `03` and doc `04` share one source:

```ts
export const PLANS = {
  free:    { id: 'free',    name: 'Free',    monthly: 0, yearly: 0 },
  premium: { id: 'premium', name: 'Premium', monthly: 0, yearly: 0 }, // ← fill from doc 03
} as const;
```

### 3.6 FAQ (`id="faq"`)

Accordion, one client component. Minimum questions:

1. Is my data private? → yes, row-level isolation, never sold, export anytime.
2. Can I use it on my phone? → yes, installable PWA, iOS and Android.
3. What happens if I cancel? → keep account and data on Free, Premium features lock.
4. Do you offer refunds? → link `/refunds`.
5. Does it work offline? → be honest: check-ins require a connection today.
6. Can I export my data? → yes, JSON / CSV / Excel / PDF.
7. Who can see my habits? → only you. There is no sharing feature — habits are
   private, enforced by RLS (do not promise friends/family sharing; it was removed)
   per habit.

Use native `<details>`/`<summary>` styled with CSS rather than a JS accordion — it is
accessible for free, works without JavaScript, and adds zero bundle.

### 3.7 Final CTA

One band, `var(--bg-secondary)`, headline + single "Start free" button → `/signup`.

### 3.8 Footer — `components/landing/Footer.tsx`

Four columns on desktop, stacked on mobile:

- **Product**: Features, Pricing, FAQ, Sign in, Sign up
- **Legal**: Privacy, Terms, Refunds, Cookie policy *(doc 06 creates the missing ones)*
- **Support**: Contact ({{SUPPORT_EMAIL}}), Status page *(doc 09)*
- **Bottom bar**: `© {year} {{LEGAL_ENTITY}}. All rights reserved.` — the legal entity
  name is required on a commercial site, and by payment providers.

Then **add the footer to `app/privacy/page.tsx` and `app/terms/page.tsx`** — they
currently have none, which is a dead end for anyone who lands there from search.

---

## 4. Design constraints

- **Reuse the existing token system.** `var(--bg-primary)`, `var(--bg-secondary)`,
  `var(--bg-card)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`,
  `var(--accent-primary)`, `var(--border-subtle)`, `var(--border-default)`. Do not add
  hex colors. Do not add a second font.
- **Light and dark must both work.** The app has a real theme system
  (`components/ui/ThemeProvider.tsx`) with a pre-paint bootstrap. Test both.
- **Fonts already loaded** in `app/layout.tsx`: Inter (body), Outfit (headings),
  IBM Plex Mono (eyebrow labels). Use those three, no more.
- **Responsive** at 375px, 768px, 1280px, 1920px. No horizontal scroll at any width.
- **Motion**: at most a subtle fade-up on scroll for section entry, and only if it costs
  no layout shift. Respect `prefers-reduced-motion`.

## 5. Performance budget

The landing page is the only page most visitors will ever see.

- Lighthouse Performance ≥ 90 on mobile.
- Cumulative Layout Shift < 0.1 — every image needs explicit dimensions.
- Total client JS for `/` under 100 KB gzipped. Only the pricing toggle should be a
  client component; use `<details>` for FAQ.
- Do **not** import `framer-motion` at the top of `app/page.tsx` — it pulls a large
  bundle into the critical path.
- Convert the hero screenshot to AVIF/WebP; `next.config.ts` already sets
  `formats: ['image/avif', 'image/webp']`.

## 6. Accessibility

- One `<h1>` (the hero headline). Sections use `<h2>`, cards `<h3>`. No skipped levels.
- All interactive elements reachable and visible on keyboard focus.
- Contrast ≥ 4.5:1 for body text in **both** themes — check `--text-muted` on
  `--bg-secondary` specifically, muted-on-muted is where these break.
- The mobile nav in `Navbar.tsx` locks body scroll — confirm focus is trapped in the
  open menu and `Esc` closes it.
- Every image has meaningful `alt`; decorative ones get `alt=""`.

## 7. Metadata

Update `app/layout.tsx` metadata to use `NEXT_PUBLIC_SITE_URL` (doc `01` §B6), then add
page-level metadata in `app/page.tsx`:

```ts
export const metadata: Metadata = {
  title: 'MV Habits — Build daily habits that actually stick',
  description: 'Track habits, keep streaks, and see the patterns behind your consistency. Free to start.',
  alternates: { canonical: '/' },
};
```

Full SEO treatment (OG images, structured data) is doc `12`.

---

## 8. Task list

> Needs from `DECISIONS.md`: `DOMAIN`, `SUPPORT_EMAIL`, `LEGAL_ENTITY`,
> `PREMIUM_MONTHLY_USD`, `PREMIUM_YEARLY_USD`. If any is `TODO`, build the layout with
> the value read from `lib/pricing.ts` / `lib/brand.ts` and leave those constants at
> `TODO(DECISIONS.md)` — do not invent a price, a domain, or a company name.

### 👤 Human

- [ ] Fill `PREMIUM_MONTHLY_USD`, `PREMIUM_YEARLY_USD`, `LEGAL_ENTITY`, `SUPPORT_EMAIL`
      in `DECISIONS.md`
- [ ] Capture the hero screenshot of `/dashboard` with presentable demo data and save it
      to `public/marketing/hero-dashboard.png` *(an agent cannot take a screenshot of a
      logged-in app)*
- [ ] Review the finished page on a real phone, in both light and dark themes
- [ ] Approve the marketing copy — every claim must be true of the shipped app

### 🤖 Agent

- [ ] Read `app/privacy/page.tsx` and `app/terms/page.tsx` to absorb the visual language
- [ ] Create `lib/brand.ts` and `lib/pricing.ts`
- [ ] Add `/` and `/refunds` to `PUBLIC_PATHS` in `proxy.ts`; redirect signed-in users
      from `/` to `/dashboard`
- [ ] `components/landing/Hero.tsx`
- [ ] `components/landing/TrustStrip.tsx`
- [ ] `components/landing/Features.tsx` — `id="features"`
- [ ] `components/landing/HowItWorks.tsx` — `id="how-it-works"`
- [ ] `components/landing/Pricing.tsx` — `id="pricing"` (client component, reads `lib/pricing.ts`)
- [ ] `components/landing/Faq.tsx` — `id="faq"` (native `<details>`)
- [ ] `components/landing/FinalCta.tsx`
- [ ] `components/landing/Footer.tsx`
- [ ] Rewrite `app/page.tsx` to compose them (server component)
- [ ] Add `<Footer />` to `app/privacy/page.tsx` and `app/terms/page.tsx`
- [ ] Optimize the hero image once the human supplies it; wire `next/image` with explicit
      dimensions and `priority`
- [ ] Add page metadata
- [ ] `npm run typecheck && npm run lint && npm run build`

## 9. Acceptance criteria

- [ ] A signed-out visitor to `/` sees the marketing page, not a redirect to `/login`.
- [ ] A signed-in visitor to `/` lands on `/dashboard`.
- [ ] All four `Navbar` links scroll to a real section — no dead anchors.
- [ ] Page renders correctly at 375 / 768 / 1280 / 1920 px, in both light and dark.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- [ ] `/privacy` and `/terms` have a working footer.
- [ ] No claim on the page is false. Every advertised feature works in the shipped app.
- [ ] `npm run typecheck && npm run lint && npm run build` all pass.

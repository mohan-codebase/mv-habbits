# MV Habits

Premium habit tracker for routines, streaks, and self-growth. Built on Next.js 16 + Supabase + Tailwind v4.

## Features

- **Realtime sync** — Supabase Realtime keeps every device in lockstep.
- **Analytics & heatmaps** — year-long heatmap, weekday patterns, category breakdown, leaderboard.
- **Achievements** — streak milestones, perfect week/month, comeback kid, consistency king.
- **Optimistic UI** — toggles snap instantly, server reconciles in the background.
- **Push reminders** — per-habit reminder time, timezone-aware, web push via VAPID.
- **Backup / restore** — export to JSON or CSV, import a previous backup.
- **Light + dark themes** — pre-paint theme bootstrap, no flash.

## Tech stack

- **Framework** — [Next.js 16 App Router](https://nextjs.org/) (React 19)
- **Database & auth** — [Supabase](https://supabase.com/) (Postgres + RLS + Realtime)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com/) + design tokens in `app/globals.css`
- **Animations** — [Framer Motion](https://www.framer.com/motion/)
- **Forms** — [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts** — [Recharts](https://recharts.org/)
- **Push** — [web-push](https://github.com/web-push-libs/web-push) + Vercel Cron

## Getting started

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key.
3. Apply migrations in Supabase (`supabase/migrations/*.sql` in numeric order).
4. `npm run dev` — open http://localhost:3000

## Environment variables

| Var | Required | Notes |
|-----|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | for cron only | Used by `/api/cron/reminders` to read all users |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | for push | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | for push | `mailto:you@example.com` |
| `CRON_SECRET` | for cron auth | Bearer token for cron endpoint |
| `NEXT_PUBLIC_SITE_URL` | prod | Canonical site URL for OAuth redirects |

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build (typecheck + lint enforced)
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

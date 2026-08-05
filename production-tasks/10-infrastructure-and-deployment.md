# 10 — Infrastructure and Deployment

> **Phase 4.** Some items here (Supabase environments, backups) should be done **earlier**
> if you are about to run destructive migrations from doc `01` §B5.
>
> **Repo context:** Next.js 16 on Vercel, Supabase (Postgres + Auth + Storage + Realtime).
> Migrations in `supabase/migrations/` numbered `001`–`028` and applied **by hand**.
> `vercel.json` defines one cron. See `00-INDEX.md`.

---

## 1. Current state

| Item | Status |
|---|---|
| Environments | 🔴 **One Supabase project.** Development runs against production data. |
| Migration workflow | 🔴 Hand-applied SQL. No record of what's applied where. |
| Backups | ⬜ Unverified — Supabase free tier has limited retention and **no PITR** |
| Custom domain | ⬜ Not configured |
| Env var management | 🟨 Local `.env` files; Vercel side unverified |
| `.env.example` | 🔴 Missing — `README.md` tells you to copy a file that doesn't exist |
| Cron | 🟨 One job, misconfigured (doc `01` §B1) |
| Storage buckets | 🟨 Created manually via migrations; needs verification |
| CI/CD | 🟨 Vercel auto-deploy on push; no checks gate it (doc `11`) |
| Rollback plan | ❌ None |

---

## 2. 🔴 Environment separation

Right now there is one Supabase project. That means local development, preview
deployments, and production all read and write the **same database**. A test run of
`lib/utils/import.ts`, or a stray `DELETE`, hits real data.

### Set up three environments

| Environment | Supabase project | Vercel | Data |
|---|---|---|---|
| Local | `productivity-dev` | `npm run dev` | Seeded fake |
| Preview | `productivity-staging` | Vercel Preview (per-PR) | Seeded fake |
| Production | `productivity-prod` (the existing one) | Vercel Production | Real |

Steps:

1. Create two new Supabase projects. Choose the **same region** as production for
   staging so performance characteristics match.
2. Apply migrations `001`→latest to both, in numeric order.
3. Write `scripts/seed.mjs` — creates 2–3 test users with habits, entries spread across
   90 days, achievements, and a friendship. You need this for doc `11` tests anyway.
4. Set Vercel environment variables **per environment** (§4).
5. Point local `.env.local` at the dev project. Never at production.

> If cost is the objection: Supabase's free tier allows multiple projects and free
> projects pause after a week of inactivity (fine for dev/staging — they wake on
> request). This is close to free.

---

## 3. 🔴 Migration workflow

Hand-applying SQL through the dashboard has already produced drift risk: nothing records
which of `001`–`028` are actually applied to the live database.

### Adopt the Supabase CLI

```bash
npm i -D supabase
npx supabase init          # creates supabase/config.toml — keep the existing migrations dir
npx supabase link --project-ref <prod-ref>
```

The existing files in `supabase/migrations/` already follow a sortable naming scheme.
The CLI expects `<timestamp>_name.sql`; `001_…`–`028_…` sort correctly too, so you can
either keep the numeric convention or rename. **Keep it** — renaming risks re-running
applied migrations. New migrations continue as `029_…`, `030_…`.

### First: reconcile what's actually applied

Before automating anything, verify the production schema matches the migration files:

```bash
npx supabase db diff --linked > /tmp/drift.sql
```

If `drift.sql` is non-empty, production and the repo disagree. Resolve it deliberately —
usually by writing a new migration that codifies whatever production already has — before
proceeding. Do not "fix" it by editing old migration files.

### Then: the rule

- Every schema change is a **new numbered file**. Never edit an applied migration.
- Apply to dev → staging → production, in that order.
- Migrations must be **idempotent** where practical (`IF NOT EXISTS`, `DROP POLICY IF
  EXISTS` — the existing files already do this well).
- Migrations must be **backward compatible with the currently deployed code**, because
  the migration runs before the new deployment finishes. Adding a NOT NULL column with
  no default will break the running app. Use the expand/contract pattern: add nullable →
  deploy code → backfill → add constraint.
- Record applied migrations. The CLI's `supabase_migrations.schema_migrations` table
  does this once you're using it.

---

## 4. Environment variable matrix

Create `.env.example` in the repo root (keys only, **no values**):

```bash
# ── Supabase ──────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only — cron + billing webhook

# ── Site ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=

# ── Push notifications ────────────────────────────────────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=                      # mailto:you@example.com

# ── Cron ──────────────────────────────────────────────────────────────
CRON_SECRET=

# ── AI coach ──────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=

# ── Billing (doc 04) ──────────────────────────────────────────────────
BILLING_PROVIDER=
PADDLE_ENV=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_ID_MONTHLY=
PADDLE_PRICE_ID_YEARLY=

# ── Email (doc 07) ────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=

# ── Rate limiting (doc 08) ────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Observability (doc 09) ────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

> **Note the naming inconsistency to resolve.** `proxy.ts` reads
> `NEXT_PUBLIC_SUPABASE_ANON_KEY || NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the local
> `.env` files use `PUBLISHABLE_KEY`. Pick one name, use it everywhere, and delete the
> fallback. Divergent env-var names are how production outages start.

Set all of these in Vercel for **Production**, **Preview**, and **Development** scopes,
pointing at the corresponding Supabase project and at sandbox billing/email credentials
for non-production.

Checklist:
- [ ] No secret carries the `NEXT_PUBLIC_` prefix
- [ ] Preview uses sandbox billing credentials — a real charge from a preview deploy is
      a very bad day
- [ ] `CRON_SECRET` differs per environment
- [ ] `.env.example` committed; real `.env*` files remain gitignored

---

## 5. Backups and recovery 🔴

**Do this before running any `DROP` from doc `01` §B5.**

- [ ] Confirm which Supabase plan you're on and what backup retention it gives. The free
      tier's daily backups have short retention and **no point-in-time recovery**. For a
      paid product, **Pro with PITR is the right call** — it is the difference between
      losing a day and losing minutes.
- [ ] Take a manual backup now and **verify it restores** into the dev project. An
      unverified backup is not a backup.
- [ ] Schedule an independent weekly logical dump:
      ```bash
      pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl -Fc -f "backup-$(date +%F).dump"
      ```
      Store it somewhere that is not Supabase (S3, Backblaze, encrypted). If your
      Supabase account is compromised or suspended, in-platform backups go with it.
- [ ] Back up **Storage** separately — database backups do not include bucket objects.
- [ ] Write the restore procedure down, with commands, in this repo. Test it once.
- [ ] Set a recovery objective: e.g. RPO 1 hour, RTO 4 hours. Know what you're promising.

---

## 6. Domain and DNS

- [ ] Register / point `{{DOMAIN}}`
- [ ] Add it in Vercel → Project → Domains
- [ ] Decide apex vs `www` and 301-redirect the other (Vercel handles this)
- [ ] Verify TLS certificate issues automatically
- [ ] DNS records needed:
  - `A` / `CNAME` → Vercel
  - `TXT` SPF, `CNAME` DKIM, `TXT` `_dmarc` → email (doc `07`)
  - `TXT` domain verification for the payment provider, if requested
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://{{DOMAIN}}` in Vercel Production
- [ ] Update Supabase Site URL + redirect allow-list (doc `07` §5.1)
- [ ] Update `metadataBase`, sitemap, and robots (doc `01` §B6)
- [ ] HSTS is already set with `preload` in `next.config.ts` — **note that submitting to
      the HSTS preload list is effectively irreversible.** Only submit once you are
      certain every subdomain will always be HTTPS.

---

## 7. Vercel configuration

- [ ] **Plan**: Pro if you need 5-minute crons (doc `01` §B1, decision D5)
- [ ] Production branch = `main`
- [ ] Preview deployments enabled for PRs
- [ ] Node version pinned in `package.json` `engines`, matching Vercel's setting
- [ ] Function region set close to the Supabase region — a Washington function talking to
      a Singapore database adds ~200ms to every query
- [ ] Deployment protection on Preview (password or Vercel auth) so staging isn't indexed
- [ ] `vercel.json` cron updated per doc `01`; add the billing reconciliation cron
      (doc `04` §10) and the deletion-execution cron (doc `06` §4.3):

```json
{
  "crons": [
    { "path": "/api/cron/reminders",           "schedule": "*/5 * * * *" },
    { "path": "/api/cron/reconcile-billing",   "schedule": "0 3 * * *" },
    { "path": "/api/cron/execute-deletions",   "schedule": "0 4 * * *" }
  ]
}
```

> Vercel Hobby allows 2 cron jobs at daily granularity. The above needs **Pro**.

---

## 8. Supabase configuration

- [ ] Plan: Pro for PITR, larger limits, and no auto-pausing
- [ ] Region confirmed (doc `05` §4.1)
- [ ] **Storage buckets** — verify they exist with correct policies. Migration `024`
      created habit videos; migration `014` created trip documents (delete that bucket if
      you dropped trips per doc `01` §B5). Confirm:
      - bucket is **not public** unless intended
      - `storage.objects` policies restrict paths to `auth.uid()`
      - a file size limit and allowed MIME types are set on the bucket
- [ ] **Realtime** — confirm the publication includes `habit_entries` (the app subscribes
      to it in `lib/hooks/useRealtimeEntries.ts`) and that `REPLICA IDENTITY FULL` is set
      (migration `005` does this). If you dropped trip tables, remove them from the
      publication.
- [ ] Connection pooling — use the pooler connection string for serverless
- [ ] Enable the Supabase Security and Performance advisors; resolve findings (doc `08`)
- [ ] Set up database alerts (doc `09` §7)

---

## 9. Deployment and rollback

### Deploy procedure

1. Merge to `main` → Vercel builds and deploys.
2. **Migrations are not automatic.** Apply them manually (or via CI) **before** merging
   code that depends on them, following the backward-compatibility rule in §3.
3. Watch Sentry and the health endpoint for 15 minutes after deploy.

### Rollback

- **Code**: Vercel → Deployments → previous deployment → "Promote to Production".
  Instant, and it is why backward-compatible migrations matter — the old code must still
  work against the new schema.
- **Database**: there is no automatic rollback. Every migration that could lose data
  needs a written down-path before it is applied. For destructive changes, take a manual
  backup immediately before.
- **Write the rollback step into each migration's header comment.**

### Deployment checklist (per release)

- [ ] `npm run typecheck && npm run lint && npm run build` pass locally
- [ ] Migrations applied to staging, and exercised there
- [ ] Preview deployment tested against staging data
- [ ] Migration is backward compatible with the currently live code
- [ ] Env vars added for any new service
- [ ] Post-deploy: health check green, Sentry quiet, a real signup works

---

## 10. Cost model

Know what launch costs before it surprises you.

| Service | Tier needed | Rough monthly |
|---|---|---|
| Vercel | Pro (for cron frequency) | $20 |
| Supabase | Pro (PITR, no pausing) | $25 |
| Email (Resend) | Free → paid at ~3k/mo | $0–20 |
| Upstash Redis | Free tier likely sufficient | $0–10 |
| Sentry | Free tier (5k errors) | $0–26 |
| Analytics (PostHog) | Free tier (1M events) | $0 |
| Uptime monitoring | Free tier | $0 |
| Domain | — | ~$1 |
| **Fixed total** | | **~$50–100/mo** |
| Anthropic (AI coach) | Usage-based | **variable — see below** |
| Payment provider | ~5% of revenue | variable |

> ⚠️ **The AI coach is the one unbounded cost.** `app/api/coach/route.ts` calls
> `claude-opus-4-8` with `max_tokens: 1024` and adaptive thinking. It caches per ISO week
> per user, which is good, but Opus is the expensive model. At scale, consider:
> switching to a smaller model for this task, keeping it Premium-only (doc `03` — already
> planned), and adding the rate limit from doc `08`. Set a **spend alert** on the
> Anthropic account before launch.

Set billing alerts on every one of these accounts.

---

## 11. Task list

> Needs from `DECISIONS.md`: `DOMAIN`, `VERCEL_PLAN`, `SUPABASE_PLAN`, `SUPABASE_REGION`,
> `VERCEL_FUNCTION_REGION`, `NODE_VERSION`, `CRON_STRATEGY`.
>
> **This document is mostly human work** — it is account, DNS, and dashboard
> configuration. The agent's share is scripts and config files.

### 👤 Human — this is the majority of the work here

- [ ] 🔴 Create dev + staging Supabase projects; apply migrations `001`→latest to both
- [ ] 🔴 **Take a backup and verify it restores** into a scratch project *before* running
      any destructive migration from doc `01` §B5. An unverified backup is not a backup.
- [ ] Upgrade Supabase to Pro; verify PITR is on
- [ ] Upgrade Vercel to Pro (needed for 5-minute crons); set the function region
- [ ] Configure every env var in Vercel across Production / Preview / Development scopes.
      ⚠️ **Preview must use sandbox billing credentials.**
- [ ] Register `{DOMAIN}`; add it in Vercel; add all DNS records (Vercel + email + any
      provider verification)
- [ ] ⚠️ Decide on HSTS preload submission — **effectively irreversible.** `next.config.ts`
      already sends the `preload` directive; only submit to the list once you're certain
      every subdomain will always be HTTPS.
- [ ] Verify Storage bucket policies and the Realtime publication in the Supabase dashboard
- [ ] Schedule the weekly off-platform `pg_dump`; verify the first one lands
- [ ] Back up Storage objects separately (database backups do not include them)
- [ ] Set billing alerts on Vercel, Supabase, and **especially Anthropic** — the AI coach
      is the one unbounded cost

### 🤖 Agent

- [ ] `scripts/seed.mjs` — 2–3 test users with habits, 90 days of entries, achievements,
      and a friendship. Doc `11` depends on this. ⚠️ Must refuse to run against a
      production URL — add an explicit guard.
- [ ] Adopt the Supabase CLI; run `supabase db diff --linked` and **report** any drift.
      ⚠️ Do not "fix" drift by editing applied migrations — write a new one.
- [ ] Create `.env.example` (keys only, no values) matching §4
- [ ] Resolve the `NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `..._PUBLISHABLE_KEY` split — pick
      one name, use it everywhere, delete the fallback in `proxy.ts`
- [ ] Update `vercel.json` crons per `CRON_STRATEGY`; if `external`, write
      `.github/workflows/reminders-cron.yml` instead
- [ ] Pin `engines.node` in `package.json`
- [ ] Write the restore procedure and the deploy/rollback procedure into the repo as
      runnable commands
- [ ] `npm run typecheck && npm run lint && npm run build`

## 12. Acceptance criteria

- [ ] Local development cannot reach production data.
- [ ] `supabase db diff --linked` returns empty against production.
- [ ] A backup has been restored into a scratch project successfully.
- [ ] `{{DOMAIN}}` serves the app over HTTPS; `www` and apex resolve consistently.
- [ ] All three cron jobs execute on schedule and return 200.
- [ ] A previous deployment can be promoted and the app still works.
- [ ] Every env var in `.env.example` is set in all three Vercel scopes.
- [ ] Billing alerts are configured on Vercel, Supabase, and Anthropic.

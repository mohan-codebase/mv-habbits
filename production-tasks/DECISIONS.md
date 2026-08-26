# DECISIONS — fill this in once, then paste it with every task document

> **Read this first, agent.** The values below are the **only** source of truth for
> product names, domains, prices, legal details, and vendor choices.
>
> **If a value below still says `TODO`, you must NOT invent one.** Stop, leave a clearly
> marked `TODO(DECISIONS.md): <what you need>` comment in the code, finish everything
> else in the document, and report the gap in your final summary. Writing a plausible
> guess into a privacy policy, an invoice, a DNS record, or a price is worse than
> leaving it blank — a wrong value looks correct and ships silently.
>
> **Human:** fill in every row before starting Phase 2. Rows marked *(Phase 0/1 ok to
> defer)* can wait.

---

## 1. Identity and contact

| Key | Value | Notes |
|---|---|---|
| `PRODUCT_NAME` | `Productivity Master` | **Do not change.** Rebrand is planned post-launch. |
| `PRODUCT_TAGLINE` | `Build daily habits that actually stick` | From existing metadata |
| `DOMAIN` | `TODO` | Production domain, no protocol. e.g. `example.com` |
| `SITE_URL` | `TODO` | `https://` + DOMAIN |
| `SUPPORT_EMAIL` | `TODO` | Published on the site; goes in legal pages + `security.txt` |
| `SENDING_DOMAIN` | `TODO` | Recommended: `mail.{DOMAIN}` — keeps root domain reputation clean |

## 2. Legal entity

Required by the payment provider's KYC, by EU consumer law, and on your invoices.

| Key | Value | Notes |
|---|---|---|
| `LEGAL_ENTITY` | `TODO` | Full legal name — sole proprietor or company |
| `ENTITY_TYPE` | `TODO` | `sole-proprietor` / `private-limited` / other |
| `LEGAL_ADDRESS` | `TODO` | Full registered address. Appears in the footer and in emails. |
| `JURISDICTION` | `TODO` | Governing law for the Terms, e.g. `India` |
| `TAX_ID` | `TODO` | GSTIN / PAN / equivalent — for the payment provider only, **not** for the website |
| `GRIEVANCE_CONTACT` | `TODO` | Required by India's DPDP Act. Can be the same as SUPPORT_EMAIL. |

## 3. Pricing (decision D2 — blocks docs 02, 03, 04)

| Key | Value | Notes |
|---|---|---|
| `PREMIUM_MONTHLY_USD` | `TODO` | Recommendation in doc 03 §2: `4.99` |
| `PREMIUM_YEARLY_USD` | `TODO` | Recommendation: `39.99` (~33% off) |
| `CURRENCY` | `USD` | Display + charge currency at launch |
| `TRIAL_ENABLED` | `TODO` | `yes` / `no` |
| `TRIAL_DAYS` | `7` | Only if TRIAL_ENABLED = yes |
| `TRIAL_REQUIRES_CARD` | `no` | Card-required trials convert worse at this stage |
| `REFUND_WINDOW_DAYS` | `14` | Satisfies EU distance-selling expectations |

**Free tier limits** — confirm or edit. These are enforced in *both* `lib/pricing.ts`
and SQL triggers, so changing them later means changing two places.

| Limit | Value |
|---|---|
| `FREE_MAX_HABITS` | `5` |
| `FREE_ANALYTICS_DAYS` | `30` |
| `FREE_MAX_REMINDERS` | `1` |
| ~~`FREE_MAX_CONNECTIONS`~~ | — (social feature removed; see migration `031`) |
| `FREE_EXPORT_FORMATS` | `json` |
| `FREE_AI_COACH` | `no` |
| `FREE_VIDEO_ATTACHMENTS` | `no` |

## 4. Vendors

| Key | Value | Decision | Notes |
|---|---|---|---|
| `PAYMENT_PROVIDER` | `TODO` | D1 | Recommended: `paddle` (Merchant of Record). Fallback: `lemonsqueezy`. See doc 04 §1. |
| `PAYMENT_APPLICATION_STATUS` | `TODO` | | `not-started` / `submitted` / `approved` — **longest lead time in the launch** |
| `EMAIL_PROVIDER` | `TODO` | | Recommended: `resend` |
| `ANALYTICS_PROVIDER` | `TODO` | D7 | Recommended: `posthog` (EU region, cookieless) |
| `ERROR_TRACKING` | `sentry` | | |
| `RATE_LIMIT_STORE` | `upstash-redis` | | |
| `UPTIME_MONITOR` | `TODO` | | Better Stack / UptimeRobot / Checkly |

## 5. Infrastructure

| Key | Value | Decision | Notes |
|---|---|---|---|
| `VERCEL_PLAN` | `pro` | D5 | **`pro` required** for 5-minute crons. Hobby caps cron at once-daily, which breaks reminders entirely (doc 01 §B1). |
| `SUPABASE_PLAN` | `TODO` | | `pro` recommended — PITR backups, no auto-pausing |
| `SUPABASE_REGION` | `TODO` | | Cannot be changed later without a migration. Pick closest to your expected majority of users. |
| `VERCEL_FUNCTION_REGION` | `TODO` | | Match SUPABASE_REGION or you add ~200ms to every query |
| `NODE_VERSION` | `22` | | Pin in `package.json` engines and in CI |
| `PRODUCTION_BRANCH` | `main` | | |

## 6. Scope decisions

| Key | Value | Decision | Notes |
|---|---|---|---|
| `DROP_ORPHANED_TABLES` | `yes` | D6 | `yes` recommended — trip/expense tables are unused and contain hardcoded personal seed data (doc 01 §B5). ⚠️ Destructive. |
| `KEEP_GOALS_TABLE` | `yes` | | Referenced by visibility policies in migration 026 |
| `KEEP_DAILY_MOODS_TABLE` | `yes` | | Tiny, plausible near-term feature |
| `PASSCODE_LOCK_FEATURE` | `enable` | | Doc 01 §B3 recommended `disable`, but the grep it asks for shows `SecuritySettings.tsx` already ships working setup UI — so the feature is reachable and only enforcement is dead. Wiring it up beats shipping a lock that lies. |
| `APPLE_SIGN_IN` | `TODO` | | `keep` (needs $99/yr Apple account + JWT rotation every 6 months) / `remove` |
| `CRON_STRATEGY` | `vercel-pro` | | See doc 01 §B1. Requires the Vercel project to actually be upgraded to Pro before `*/5` takes effect. |

## 7. Launch

| Key | Value |
|---|---|
| `TARGET_LAUNCH_DATE` | `TODO` |
| `LAUNCH_TYPE` | `TODO` — `soft` (handful of users) / `public` |

---

## How the agent uses this

1. Before starting a document, scan it for `{{PLACEHOLDER}}` tokens and resolve each from
   the tables above.
2. If the value is `TODO`, do not proceed with **that specific task**. Complete the rest
   of the document. List every blocked task in your final summary.
3. Never write a `TODO` value, a placeholder token, or a guessed value into: legal pages,
   email templates, DNS records, structured data, price displays, or environment
   variables.
4. When you produce a value that belongs here (e.g. you generated a VAPID keypair),
   **do not write secrets into this file.** Report them to the human to store in Vercel.

## What must never go in this file

🔒 No API keys, no secrets, no tokens, no passwords, no database URLs. This file is
committed to the repository. Secrets live in Vercel environment variables and a password
manager. See doc 10 §4 for the env var matrix.

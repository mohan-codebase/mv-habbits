# 06 — Legal and Compliance

> **Phase 2.** Requires doc `04` (you must know how you're taking money before you can
> describe it in your terms).
>
> **Repo context:** Next.js 16 App Router. `app/privacy/page.tsx` and `app/terms/page.tsx`
> already exist and are well-built (client components using `PageHero`/`Section`
> primitives and `components/landing/Navbar`). Supabase handles auth and stores all user
> data. See `00-INDEX.md`.
>
> ⚠️ **This document tells you what must be covered and builds the technical parts. It is
> not legal advice.** Before charging money, have the final privacy policy and terms
> reviewed by a lawyer in {{JURISDICTION}}. Payment providers reject applications over
> deficient legal pages, so this is also a practical gate on doc `04`.

---

## 1. Current state

| Item | Status |
|---|---|
| Privacy policy | ✅ Exists, substantial. Effective date `April 28, 2026`. **Written before payments existed** — must be updated. |
| Terms of service | ✅ Exists. Same caveat. |
| Refund / cancellation policy | ❌ Missing. Required by payment providers. |
| Cookie policy / notice | ❌ Missing. |
| Account deletion | ❌ **Missing entirely.** `components/settings/DataManagement.tsx` implements export and import only. |
| Data export | ✅ Exists (JSON/CSV via `lib/utils/export.ts`). |
| Legal entity name + address on site | ❌ Missing. Required by MoRs and by EU consumer law. |
| Subprocessor list | ❌ Missing. Required by GDPR. |
| Contact / support address | ❌ Not published. |
| DPAs signed with vendors | ❌ Not done. |

---

## 2. What every page must cover

### 2.1 Privacy policy — updates required

The existing policy predates payments, social features, and AI. Add or revise:

**Data collected.** Be specific and complete:
- Account: email, name, avatar (if OAuth), password hash (managed by Supabase Auth)
- Profile: timezone, locale, week start, notification time, tier
- Product data: habits, categories, daily entries, notes, moods, achievements, quotes saved
- Media: video attachments on entries (Supabase Storage), if the feature is live
- Social: friend and family connections, feed reactions, comments
- Security: WebAuthn credential public keys, salted passcode hash, active sessions
- Billing: **handled by the payment provider** — state that you never see or store full
  card numbers, only a customer id, subscription status, and amounts
- Technical: IP address and user agent in server logs, push subscription endpoints
- Analytics: whatever doc `09` chooses — name it explicitly

**Subprocessors.** List every vendor that touches user data, with purpose and location:

| Vendor | Purpose | Location |
|---|---|---|
| Supabase | Database, auth, storage | {{fill region}} |
| Vercel | Hosting, edge network | Global |
| {{Payment provider}} | Payments, invoicing, tax | {{fill}} |
| Anthropic | AI habit-coach insights | US |
| {{Email provider}} | Transactional email | {{fill}} |
| {{Analytics}} | Product analytics | {{fill}} |
| {{Error tracking}} | Error monitoring | {{fill}} |

> ⚠️ **The Anthropic entry is not optional.** `app/api/coach/route.ts` sends a summary of
> the user's habit data to a third-party AI. Users must be told. The route already
> builds a *compact aggregate* rather than raw entries (`lib/coach/aggregate.ts`) —
> good — but habit **names** are included, and those can be personal ("AA meeting",
> "take insulin", "therapy"). Disclose it clearly, and consider making the AI coach
> explicitly opt-in with a checkbox rather than on-by-default for Premium.

**Also cover:** lawful basis for each processing purpose (GDPR Art. 6), retention
periods, international transfer mechanism (SCCs via subprocessor DPAs), user rights and
how to exercise them, cookie/local-storage use, children's age limit, breach
notification, how policy changes are communicated, and a real contact address.

### 2.2 Terms of service — updates required

Add: subscription terms (price, interval, auto-renewal, how to cancel), the refund
policy by reference, acceptable use, that the service is provided "as is" with no
guarantee of habit outcomes, limitation of liability, account termination grounds,
**that this is not medical or health advice** (important — habit trackers attract
health/mental-health use), governing law {{JURISDICTION}}, dispute resolution, and the
legal entity's full name and address.

> The medical disclaimer matters more than it looks. People track medication, therapy,
> sobriety, and exercise in these apps. State plainly that the product does not provide
> medical advice and is not a medical device.

### 2.3 New page: `/refunds`

Create `app/refunds/page.tsx` reusing the same `PageHero`/`Section` primitives as
`app/privacy/page.tsx`. **Payment providers check for this page during review.**

Must state: refund window (14 days is a reasonable default and satisfies EU distance-
selling expectations), what qualifies, how to request ({{SUPPORT_EMAIL}}), processing
time, that cancelling stops future renewals but does not auto-refund the current period,
and how to cancel (link to the billing portal).

> **EU note:** consumers have a 14-day right of withdrawal for digital services, which
> they can waive to get immediate access. Your MoR's checkout handles the waiver
> mechanics — your policy just needs to be consistent with it.

### 2.4 New page: `/cookies` (or a section in the privacy policy)

Audit what the app actually stores client-side before writing this. Known so far:

- Supabase auth session cookies — **strictly necessary**, no consent needed
- `localStorage`: `productivity_master_theme`, `productivity_master_active_app` — strictly
  necessary / preference
- `@vercel/speed-insights` — currently loaded in `app/layout.tsx`
- Whatever analytics doc `09` adds — **this is the one that may require consent**

Run this audit yourself: load the app, open DevTools → Application → Storage, and list
everything. Document each item's name, purpose, and lifetime.

### 2.5 Cookie consent banner — only if needed

If you choose a **cookieless, no-personal-data** analytics tool (Plausible, or PostHog
configured without cookies), you can likely operate with a **notice** rather than a
consent banner. If you add anything that sets non-essential cookies or profiles users,
you need a proper consent manager with a genuine "reject all" that is as easy as
"accept all".

**Recommendation: choose cookieless analytics and avoid the banner entirely.** It is
better for conversion, better for load time, and less to get wrong.

---

## 3. Publishing the legal entity

Required by MoRs, EU consumer law, and Google Play / App Store if you ever ship there.

Add to `lib/brand.ts` (created in doc `02`):

```ts
export const LEGAL_ENTITY  = '{{LEGAL_ENTITY}}';
export const LEGAL_ADDRESS = '{{LEGAL_ADDRESS}}';
export const SUPPORT_EMAIL = '{{SUPPORT_EMAIL}}';
```

Surface it in the footer (doc `02` §3.8), in the terms, and in the privacy policy.

---

## 4. Account deletion — implementation 🔴

The hard requirement. GDPR Art. 17, India DPDP Act §12, and basic user trust.

### 4.1 What must be deleted

`ON DELETE CASCADE` from `auth.users` already covers most of it — `profiles.id`
references `auth.users(id) ON DELETE CASCADE`, and nearly every table cascades from
`profiles`. But **cascades do not cover everything**:

| Data | Cascades? | Action |
|---|---|---|
| `profiles`, `habits`, `habit_entries`, `categories`, `achievements`, `daily_moods` | ✅ | automatic |
| `push_subscriptions`, `ai_insights`, `habit_lock_credentials`, `goals` | ✅ verify each | automatic |
| `friends`, `families`, `family_members` | ⚠️ **verify** — `friends` references `auth.users`, and family ownership may orphan a family | handle explicitly |
| `feed_reactions`, `feed_comments` | ⚠️ verify | handle explicitly |
| `subscriptions`, `billing_events` (doc `04`) | ⚠️ **must be retained** | see §4.2 |
| Supabase **Storage** objects (habit videos, any receipts) | ❌ **No cascade** | delete explicitly |
| `auth.users` row itself | — | requires service role |

**Storage is the one people forget.** Migration `024` created a habit-videos bucket with
paths keyed by user. Those files survive account deletion unless you delete them.

### 4.2 What must be retained, and why

Deleting everything is not actually compliant — tax law requires keeping transaction
records (typically 7–10 years). GDPR's erasure right yields to a legal obligation.

So: **retain billing records, anonymized.** Keep `subscriptions` and `billing_events`
rows but null out or hash any direct identifier, and set `user_id` to null with a
retained `deleted_user_hash`. State this retention in the privacy policy.

### 4.3 Implementation

**Migration `034_account_deletion.sql`** — add a deletion-request table and audit log:

```sql
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  email_hash   TEXT NOT NULL,             -- sha256, for support lookups without storing email
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  execute_at   TIMESTAMPTZ NOT NULL,      -- requested_at + grace period
  executed_at  TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
-- Service role only. No user policies.
```

**`DELETE /api/account`** — the request endpoint:

1. Require an authenticated session.
2. **Re-authenticate**: require the user to type their password (or complete a WebAuthn
   assertion for OAuth users) in the same request. Never delete an account on a single
   click from an existing session.
3. Require typing a confirmation phrase (e.g. their email address) in the UI.
4. Insert a `deletion_requests` row with `execute_at = now() + 14 days`.
5. Sign the user out everywhere.
6. Send a confirmation email with a cancel link (doc `07`).

**Grace period.** 14 days, cancellable by signing back in. This prevents rage-quit and
account-takeover-driven deletion, and it is the industry norm. State it in the policy.

**`app/api/cron/execute-deletions/route.ts`** — daily cron, `CRON_SECRET`-authed, same
pattern as `app/api/cron/reminders/route.ts`:

```
for each request where execute_at <= now() and executed_at is null and cancelled_at is null:
  1. list + delete all Storage objects under the user's prefix (all buckets)
  2. cancel any active subscription with the payment provider
  3. anonymize subscriptions/billing_events: user_id = null, keep amounts + dates
  4. delete feed_comments, feed_reactions authored by the user
  5. remove friend links; transfer or delete owned families
  6. supabase.auth.admin.deleteUser(userId)   ← cascades the rest
  7. mark executed_at
```

Step 6 requires the **service role** key — `supabase.auth.admin.deleteUser()` is not
callable with the anon key.

**UI** — add a "Danger zone" to `components/settings/DataManagement.tsx` or a new
`components/settings/DeleteAccount.tsx`, placed last in Settings:

- Explain exactly what is deleted and what is retained
- Prompt them to **export their data first**, with the export button right there
- Confirmation modal: type email + password
- After request: show a persistent banner with the deletion date and a Cancel button

### 4.4 Also required: data export must be complete

`lib/utils/export.ts` already exists. Verify it covers **everything** a GDPR access
request needs: profile, habits, categories, entries (including notes), achievements,
moods, goals, social connections, saved quotes, and subscription status. Remove the
stale `'trips'` key (doc `01` §B5).

---

## 5. GDPR / DPDP checklist

- [ ] Lawful basis documented for each purpose (contract for the service; consent for
      analytics and marketing email; legitimate interest for security)
- [ ] Privacy policy names every subprocessor with purpose and location
- [ ] **DPAs signed** with Supabase, Vercel, the payment provider, the email provider,
      Anthropic, and the analytics vendor (all offer standard DPAs — sign them, keep copies)
- [ ] Right of access → data export ✅ (verify completeness)
- [ ] Right to erasure → §4 ⬜
- [ ] Right to rectification → users can edit their profile ✅
- [ ] Right to portability → JSON export ✅
- [ ] Right to object → analytics opt-out
- [ ] Breach notification process written down (72 hours to the supervisory authority)
- [ ] Records of processing activities (Art. 30) — a one-page document is fine at this size
- [ ] Age limit stated (16+ for EU without parental consent; 18+ is simplest for a paid product)
- [ ] India DPDP: notice at collection, consent, grievance officer contact published

---

## 6. Also do

- **`public/.well-known/security.txt`** — a documented way to report vulnerabilities:
  ```
  Contact: mailto:{{SUPPORT_EMAIL}}
  Expires: {{one year from now, ISO 8601}}
  Preferred-Languages: en
  ```
- **Update the effective date** on privacy and terms when you publish the revisions.
- **Version the legal pages.** Keep old versions accessible; note "Last updated" clearly.
- **Email users about material changes** before they take effect (30 days is standard).
- Add `/refunds` and `/cookies` to `PUBLIC_PATHS` in `proxy.ts` and to `app/sitemap.ts`.

---

## 7. Task list

> Needs from `DECISIONS.md`: `LEGAL_ENTITY`, `LEGAL_ADDRESS`, `JURISDICTION`,
> `SUPPORT_EMAIL`, `GRIEVANCE_CONTACT`, `REFUND_WINDOW_DAYS`, plus the full vendor list
> from §4 (they become the subprocessor table).
>
> **⚠️ Agent: legal text is not a place to be creative.** If a `DECISIONS.md` value is
> `TODO`, leave a visible `TODO(DECISIONS.md)` in the page rather than inventing a
> company name, address, or jurisdiction. A plausible-looking wrong entity name in a
> privacy policy is a legal liability, not a typo. Draft the pages; a human and a lawyer
> own the final wording.

### 👤 Human

- [ ] Fill `DECISIONS.md` §2 (legal entity) — blocks most of this document
- [ ] 🔴 **Lawyer review of the final privacy policy and terms before taking the first
      payment.** Payment providers reject applications over deficient legal pages.
- [ ] Sign DPAs with Supabase, Vercel, the payment provider, the email provider,
      Anthropic, and the analytics vendor; keep copies
- [ ] Decide the retention period for anonymized billing records (tax law, typically 7–10 years)
- [ ] ⚠️ Apply migration `034` to Supabase
- [ ] Test account deletion end to end on **staging** with a throwaway account —
      ⚠️ never test this against production data
- [ ] Publish the grievance-officer contact (India DPDP requirement)

### 🤖 Agent

- [ ] Audit client-side storage — load the app and enumerate every cookie and
      `localStorage` key with its purpose and lifetime; report the list
- [ ] Rewrite `app/privacy/page.tsx` per §2.1 (data collected, subprocessor table,
      **AI-coach disclosure**, user rights, retention)
- [ ] Rewrite `app/terms/page.tsx` per §2.2 (subscription terms, **medical disclaimer**,
      liability, entity details)
- [ ] Create `app/refunds/page.tsx`
- [ ] Create `app/cookies/page.tsx` or a privacy-policy section
- [ ] Add entity + support details to `lib/brand.ts` and the footer
- [ ] Write migration `034` — `deletion_requests`. **Write only; do not apply.**
- [ ] `DELETE /api/account` with re-authentication — ⚠️ must require password/WebAuthn
      re-auth **and** a typed confirmation; never delete on a single click
- [ ] `app/api/cron/execute-deletions/route.ts` — ⚠️ destructive job. Must delete Storage
      objects explicitly (no cascade), and must **anonymize rather than delete** billing
      records.
- [ ] `components/settings/DeleteAccount.tsx` — danger zone UI with an export-first prompt
- [ ] Verify the data export is complete; drop the stale `'trips'` key
- [ ] Add `/refunds`, `/cookies` to `PUBLIC_PATHS` and the sitemap
- [ ] `public/.well-known/security.txt`
- [ ] `npm run typecheck && npm run lint && npm run build`

## 8. Acceptance criteria

- [ ] A user can delete their account from Settings, with re-authentication and a 14-day
      grace period, and can cancel during it.
- [ ] After execution: no rows remain in any product table for that user, **and no
      objects remain in Storage under their prefix**, and their `auth.users` row is gone.
- [ ] Billing records are retained but carry no personal identifier.
- [ ] `/privacy`, `/terms`, `/refunds`, `/cookies` are all publicly reachable, load
      without a session, and are linked from the footer.
- [ ] The AI coach's use of a third party is explicitly disclosed.
- [ ] The legal entity name and address appear on the site.
- [ ] The payment provider's review passed without legal-page objections.

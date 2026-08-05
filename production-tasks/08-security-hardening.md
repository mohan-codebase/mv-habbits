# 08 — Security Hardening

> **Phase 3.** Do not launch a paid product without at least §2 (RLS audit) and §3
> (rate limiting).
>
> **Repo context:** Next.js 16 App Router + Supabase. **Authorization is enforced almost
> entirely by Postgres Row Level Security** — the 23 API route handlers check "is there a
> session" and then rely on RLS for "may this user touch this row". `next.config.ts`
> already sets CSP, HSTS, X-Frame-Options, and friends. `proxy.ts` handles session
> refresh and route gating. See `00-INDEX.md`.

---

## 1. What is already good

Give the existing work credit before changing it — several things here are done better
than typical:

- **Security headers are real** (`next.config.ts`): CSP, HSTS with preload,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying
  camera/mic/geolocation, `poweredByHeader: false`.
- **RLS is enabled on every table** with explicit per-operation policies.
- **The passcode is stored as a salted hash server-side** (`lib/passcode.ts`) and
  verified via `POST /api/passcode/verify` — the code never reaches localStorage. There
  is even a one-time cleanup in `DashboardApp.tsx` removing a legacy plaintext key.
- **Input validation with Zod** on the main mutation paths, and
  `lib/validations/habit.ts` strips HTML and control characters.
- **`safeErrorMessage()`** (`lib/utils/api.ts`) is used to avoid leaking raw DB errors.
- Secrets are not committed — `.env` and `.env.local` are gitignored and untracked.

---

## 2. 🔴 RLS audit — the most important task in this document

Because RLS *is* the authorization layer, a single wrong policy is a full data breach.
The policy surface grew a lot in migrations `025`–`027` (friends, families, visibility,
feed reactions/comments) and has never been audited as a whole.

### 2.1 The specific thing to check first

Migration `027_social_feed_reactions.sql` **replaced** the `entries_select` policy on
`habit_entries` — the table holding every check-in, every note, and video paths. The
original policy from migration `001` was simply:

```sql
CREATE POLICY "entries_select" ON public.habit_entries
  FOR SELECT USING (auth.uid() = user_id);
```

The replacement widens it to include friends'/family's entries based on the parent
habit's `visibility` column. And `app/api/social/feed/route.ts` leans on this entirely:

```ts
// Thanks to Row Level Security (RLS), this query will automatically
// ONLY return entries that the current user is allowed to see
```

**Verify by hand that the widened policy cannot leak private entries.** Specifically:

- An entry whose habit is `visibility = 'private'` must never be selectable by anyone
  but the owner — including when a friendship exists.
- `notes` is free text where users write genuinely personal things. Confirm the feed
  policy does not expose notes for habits that are merely `'public'` unless intended.
  Consider excluding `notes` from the feed query's column list regardless of policy.
- `video_path` similarly.
- A **pending** (not accepted) friend request must grant nothing. Check the policy tests
  `status = 'accepted'`.
- Removing a friend must immediately revoke access.

### 2.2 Audit method

Do not eyeball it. Create three test accounts (A, B, C) where A↔B are friends and C is
unrelated, then for **every table** run the matrix:

| | Own row | Friend's row (private) | Friend's row (friends) | Friend's row (public) | Stranger's row |
|---|---|---|---|---|---|
| SELECT | ✅ | ❌ | ✅ | ✅ | ❌ |
| INSERT | ✅ | ❌ | ❌ | ❌ | ❌ |
| UPDATE | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |

Run these **against the Supabase REST API with each user's anon-key JWT**, not through
your own API routes — that is the actual attack surface. Codify the results as automated
tests (doc `11`).

Tables to cover: `profiles`, `habits`, `habit_entries`, `categories`, `achievements`,
`daily_moods`, `goals`, `friends`, `families`, `family_members`, `feed_reactions`,
`feed_comments`, `push_subscriptions`, `ai_insights`, `habit_lock_credentials`,
`active_sessions`, `subscriptions`, `billing_events`.

### 2.3 Known issues to fix

**a) `profiles` exposes more than it should to the feed.**
`app/api/social/feed/route.ts` embeds `profiles:user_id (id, full_name, avatar_url)`.
But migration `001`'s `profiles_select` policy is `auth.uid() = id` — own row only. If
the feed's profile embed works today, something has widened `profiles` SELECT. Find out
what, and make sure it exposes **only** `id`, `full_name`, `avatar_url` — not `timezone`,
`tier`, `notification_time`, or the billing columns from doc `03`.

Preferred fix: keep `profiles` locked to the owner and create a **public view** with only
the three display columns, then select from that.

**b) The billing-column guard from doc `03`** — if doc `03` is not done, then right now
any user can `UPDATE profiles SET tier = 'premium'` with their anon key. Do doc `03` §4
before charging anyone.

**c) `SECURITY DEFINER` functions need a pinned `search_path`.**
`public.calculate_streak` and `public.refresh_habit_stats` (migration `007`) are
`SECURITY DEFINER` without `SET search_path`. A user who can create objects in a schema
earlier in the search path could hijack them. Doc `01` §B4 rewrites both — make sure the
rewrite includes `SET search_path = public, pg_temp`. Apply the same to every
`SECURITY DEFINER` function in the codebase.

**d) Run Supabase's own linter.** Dashboard → Advisors → Security. It flags missing RLS,
mutable search paths, and exposed views. Resolve every finding or write down why not.

---

## 3. 🔴 Rate limiting — there is none

`grep -rn "ratelimit\|upstash"` returns nothing. Every API route is unlimited. The
highest-risk endpoints:

| Endpoint | Risk |
|---|---|
| `POST /api/passcode/verify` | **Unlimited passcode guessing.** A 4-digit passcode falls in seconds. |
| `POST /api/billing/webhook` | Unsigned floods (signature check helps, but verification still costs CPU) |
| `GET /api/coach` | **Costs real money per call** — an Anthropic API call each time the weekly cache misses |
| `/api/entries`, `/api/habits` | Write amplification, DB cost |
| `/api/export` | Expensive queries + memory |
| `/api/social/*` | Spam, enumeration |
| Auth endpoints | Credential stuffing (Supabase has some built-in limits — raise but keep them) |

### Implementation

Use **Upstash Redis** (`@upstash/ratelimit` + `@upstash/redis`) — serverless-friendly,
free tier is generous, works from Vercel functions.

```ts
// lib/rate-limit.ts
import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const limiters = {
  /** Brute-force sensitive: passcode verification. */
  passcode: new Ratelimit({
    redis, prefix: 'rl:passcode',
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  }),
  /** Expensive: hits the Anthropic API. */
  coach: new Ratelimit({
    redis, prefix: 'rl:coach',
    limiter: Ratelimit.slidingWindow(10, '1 h'),
  }),
  /** Expensive queries. */
  export: new Ratelimit({
    redis, prefix: 'rl:export',
    limiter: Ratelimit.slidingWindow(5, '1 h'),
  }),
  /** General write endpoints. */
  write: new Ratelimit({
    redis, prefix: 'rl:write',
    limiter: Ratelimit.slidingWindow(120, '1 m'),
  }),
};

export async function enforce(limiter: Ratelimit, key: string) {
  const { success, limit, remaining, reset } = await limiter.limit(key);
  if (success) return null;
  return Response.json(
    { data: null, error: 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
      },
    },
  );
}
```

Usage in a route:

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return err('Unauthorized', 401);

const blocked = await enforce(limiters.coach, user.id);
if (blocked) return blocked;
```

**Key on the user id for authenticated routes**, and on the IP
(`req.headers.get('x-forwarded-for')`) for unauthenticated ones. Never key on something
the client controls, like a header the user can set.

### Passcode lockout — extra protection beyond rate limiting

For `POST /api/passcode/verify`, add progressive lockout on top of the rate limit:
after 5 failures, lock for 15 minutes; after 10, require full re-authentication. Track
attempts server-side in Redis keyed by user id. Return a **generic** error either way —
never reveal whether the passcode was close, or whether a passcode exists.

---

## 4. Content Security Policy

The current policy is good but has one real weakness:

```ts
`script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`
```

`'unsafe-inline'` in production means any injected `<script>` executes — it substantially
weakens XSS protection. The comment in `next.config.ts` is honest about it and points at
the fix (nonces). It is needed today for the theme-bootstrap inline script and Next's
injected scripts.

**Fix (medium effort, real benefit):** move CSP generation into `proxy.ts`, generate a
per-request nonce, put it on the response header **and** pass it to Next's script tags.
Then drop `'unsafe-inline'` from `script-src`.

If you do not do this before launch, at minimum:
- [ ] Verify no user-generated content is ever rendered with `dangerouslySetInnerHTML`.
      Check: `grep -rn "dangerouslySetInnerHTML" app components`
- [ ] Confirm habit names, notes, and comments are escaped by React (they are, by
      default — the risk is only where that default is bypassed)
- [ ] Add `report-uri`/`report-to` so you learn about violations

Also: `img-src` currently allows `https:` (any host). Tighten to the specific origins
you actually use — your domain, Supabase Storage, and the Google/Apple avatar CDNs.

---

## 5. Secrets and keys

- [ ] **Rotate every secret before launch.** The current values have lived in local
      `.env` files across a development period; treat them as compromised. Rotate:
      Supabase anon key + service role key, VAPID keypair, `CRON_SECRET`,
      `ANTHROPIC_API_KEY`.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` appears only in server code. Verify:
      `grep -rn "SERVICE_ROLE" app components lib` — hits should be limited to
      `app/api/cron/*` and `app/api/billing/webhook`.
- [ ] Confirm nothing secret carries a `NEXT_PUBLIC_` prefix:
      `grep -rn "NEXT_PUBLIC_.*\(SECRET\|SERVICE\|PRIVATE\)" .`
- [ ] Enable GitHub secret scanning + push protection on the repository.
- [ ] `.env.example` should exist with **keys only, no values** — it does not exist yet
      even though `README.md` tells you to copy it. Create it.
- [ ] Rotating the VAPID keypair invalidates all existing push subscriptions — do it
      **before** launch, not after, and clear `push_subscriptions` when you do.

---

## 6. Input validation gaps

Zod covers the main paths. Check the rest:

- [ ] Every route that accepts a body parses it with a Zod schema. Audit all 23 handlers.
- [ ] Query parameters are validated too — `app/api/entries/route.ts` takes `date`,
      `habit_id`, `from`, `to` straight from `searchParams` into a query. Supabase's
      client parameterizes these so it is not SQL injection, but malformed dates should
      400 rather than producing confusing results.
- [ ] **File uploads**: habit videos (migration `024`). Validate MIME type, enforce a max
      size, and generate the storage path server-side from the user id — never accept a
      client-supplied path. Confirm the bucket's `storage.objects` policies restrict the
      path prefix to `auth.uid()`.
- [ ] Import (`lib/utils/import.ts`) parses user-supplied JSON — cap the file size, cap
      row counts, and validate every record before insert. A malicious backup file is an
      easy DoS.
- [ ] `app/api/social/comments/route.ts` — comment length limit, and confirm rendering is
      escaped.

---

## 7. Logging hygiene

`app/api/entries/route.ts` contains diagnostic logging that should not ship:

```ts
console.error('[entries] DIAG: payload failed validation (422):', JSON.stringify(body), parsed.error.issues);
```

That writes the **full request body** — including note text — into Vercel logs.

- [ ] Remove the `DIAG:` logs, or reduce them to field names and error codes with no values.
- [ ] Never log: request bodies, tokens, emails, notes, passcodes, webhook payloads
      containing customer data.
- [ ] `app/api/billing/webhook/route.ts` (doc `04`) stores raw payloads in
      `billing_events.payload` — that table has **no** RLS policies (service role only),
      which is correct. Keep it that way.
- [ ] Doc `09` replaces ad-hoc `console.error` with structured logging.

---

## 8. Dependency and supply chain

- [ ] `npm audit --production` — resolve high and critical findings
- [ ] Enable Dependabot or Renovate for security updates
- [ ] Check for a `postinstall` script in any dependency you added recently
- [ ] `xlsx` (SheetJS) has had known vulnerabilities in the npm-published versions —
      check the current advisory status and update or replace it
- [ ] Pin the Node version in `package.json` (`"engines": { "node": "22.x" }`) so Vercel
      and CI agree

---

## 9. Misc

- [ ] `public/.well-known/security.txt` (also listed in doc `06`)
- [ ] Verify `proxy.ts` cannot be bypassed. Its matcher excludes a list of static
      extensions — confirm no app route matches the exclusion pattern. Test that
      `/dashboard/settings` while signed out redirects, and that
      `/dashboard/settings.json` or similar odd paths do not slip past.
- [ ] Disable Vercel deployment protection bypass tokens if unused.
- [ ] Turn on Supabase Auth's leaked-password protection (also in doc `07`).
- [ ] Confirm the Supabase project's database password is strong and stored in a password
      manager, and that direct database access is not exposed publicly.

---

## 10. Task list (priority order)

> **⚠️ Use a strong model for this document.** The RLS audit (§2) is judgment work, not
> pattern-matching — the question "can user B read user A's private entry" has to be
> reasoned about against five interacting policies, and a wrong answer is a data breach
> that looks like a passing test.
>
> **Agent: never run RLS tests against production.** Use the staging project from doc `10`.

### 👤 Human

- [ ] 🔴 **Rotate every secret** before launch: Supabase anon + service role key, VAPID
      keypair, `CRON_SECRET`, `ANTHROPIC_API_KEY`, payment provider keys. Treat the
      current values as compromised — they've lived in local `.env` files for months.
      ⚠️ Rotating VAPID invalidates all existing push subscriptions; clear
      `push_subscriptions` when you do, and do it **before** launch.
- [ ] Create the three test accounts (A↔B friends, C unrelated) on **staging** for the
      §2.2 matrix
- [ ] ⚠️ Apply any RLS-fixing migrations the agent writes — read each one first; these
      change who can see what
- [ ] Run Supabase Dashboard → Advisors → Security; resolve or document every finding
- [ ] Enable GitHub secret scanning + push protection on the repository
- [ ] Confirm the Supabase database password is strong and stored in a password manager

### 🤖 Agent

1. [ ] 🔴 Execute the §2.2 permission matrix against **staging**, hitting the Supabase
       REST API directly with each test user's JWT — not through the app's API routes.
       Report a pass/fail table. Do not "fix" anything until the results are reviewed.
2. [ ] 🔴 Investigate the `profiles` exposure in `app/api/social/feed/route.ts` (§2.3a) —
       find what widened the SELECT policy, then propose the public-view fix
3. [ ] 🔴 Rate limiting: `lib/rate-limit.ts` + apply to `/api/passcode/verify` (progressive
       lockout) and `/api/coach` first, then the rest
4. [ ] 🟠 Write a migration pinning `search_path` on every `SECURITY DEFINER` function.
       **Write only; do not apply.**
5. [ ] 🟠 Remove the `DIAG` logging that stringifies request bodies in
       `app/api/entries/route.ts`
6. [ ] 🟠 Validate file uploads (MIME, size, server-generated paths) and import payloads
       (size cap, row cap, per-record validation)
7. [ ] 🟡 CSP nonces in `proxy.ts` to drop `'unsafe-inline'` — ⚠️ **preserve every
       existing header and comment in `next.config.ts`**
8. [ ] 🟡 Tighten `img-src` to the specific origins actually used
9. [ ] 🟡 `npm audit --production`; add Dependabot; pin Node in `engines`
10. [ ] 🟡 Create `.env.example` (keys only, **no values**)
11. [ ] 🟡 `public/.well-known/security.txt`
12. [ ] Report: every place a secret name appears, so the human knows what to rotate
13. [ ] `npm run typecheck && npm run lint && npm run build`

## 11. Acceptance criteria

- [ ] The §2.2 matrix passes for every table, tested against the REST API directly.
- [ ] A user cannot read another user's private habit entries, notes, or videos under
      any friendship state.
- [ ] A user cannot change their own `tier`.
- [ ] `POST /api/passcode/verify` blocks after 5 wrong attempts and returns 429.
- [ ] `GET /api/coach` is rate limited per user.
- [ ] All secrets rotated; no secret is reachable from the client bundle.
- [ ] Supabase Security Advisor reports zero unresolved findings.
- [ ] No request body is written to logs.

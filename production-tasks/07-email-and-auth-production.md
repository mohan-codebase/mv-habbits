# 07 — Email and Auth in Production

> **Phase 3.** Can be done in parallel with doc `08`. **Contains a hard launch blocker
> (§2) that will break signups on day one if skipped.**
>
> **Repo context:** Supabase Auth. Email+password via
> `supabase.auth.signInWithPassword` (`app/login/page.tsx`), plus Google and Apple OAuth
> via `components/auth/SocialAuth.tsx` → `app/auth/callback/route.ts`. Pages exist for
> `/login`, `/signup`, `/forgot-password`, `/reset-password`. Middleware `proxy.ts`
> refreshes the session and gates routes. See `00-INDEX.md`.

---

## 1. Current state

| Item | Status |
|---|---|
| Email + password auth | ✅ Working |
| Google OAuth | ✅ Implemented |
| Apple OAuth | ✅ Implemented |
| Password reset flow | ✅ Pages exist |
| Transactional email sending | 🔴 **Supabase's built-in SMTP — not usable in production** |
| Email templates | ⬜ Supabase defaults, unbranded |
| Custom sending domain (SPF/DKIM/DMARC) | ⬜ Not set up |
| Product emails (welcome, trial, receipts) | ⬜ None |
| Session/JWT configuration reviewed | ⬜ Defaults |

---

## 2. 🔴 BLOCKER: Supabase's default email service is rate-limited

Supabase's built-in SMTP is explicitly **for development only** and is capped at a
handful of emails **per hour**, project-wide. It is also sent from a shared Supabase
domain with poor deliverability — a meaningful share lands in spam.

**What happens if you launch without fixing this:** signup confirmations and password
resets silently stop being delivered after the first few users of each hour. New users
cannot verify their email. They leave and do not come back. You will not get an error —
it just stops.

### Fix: configure custom SMTP

1. **Pick a provider.** Recommended: **Resend** (best developer experience, generous free
   tier, simple domain setup). Alternatives: Postmark (best deliverability for
   transactional), AWS SES (cheapest at scale, worst setup).

2. **Verify a sending domain** — use a subdomain like `mail.{{DOMAIN}}` so a
   deliverability problem never poisons your root domain's reputation.

3. **Add DNS records** (the provider generates the exact values):
   - **SPF** — `TXT` on the sending domain authorizing the provider
   - **DKIM** — `CNAME`/`TXT` records for signing
   - **DMARC** — `TXT` at `_dmarc.{{DOMAIN}}`, start at
     `v=DMARC1; p=none; rua=mailto:{{SUPPORT_EMAIL}}` and tighten to `p=quarantine`
     after a couple of weeks of clean reports

   All three are required. Gmail and Yahoo now **reject or spam-folder** bulk senders
   without them.

4. **Point Supabase at it** — Dashboard → Authentication → Emails → SMTP Settings:
   host, port `587`, username, password, sender email `noreply@mail.{{DOMAIN}}`, sender
   name (current product name).

5. **Raise the Supabase auth rate limits** once custom SMTP is on (Dashboard →
   Authentication → Rate Limits). The default is deliberately low because of the shared
   sender.

6. **Test deliverability** — send to Gmail, Outlook, Yahoo, and iCloud accounts. Check
   the spam folder for each. Run the message through a tool like mail-tester.

### Acceptance criteria for §2

- [ ] 20 signups in one hour all receive a confirmation email.
- [ ] SPF, DKIM, and DMARC all pass (check the raw headers of a received message).
- [ ] Mail arrives in the inbox, not spam, on Gmail / Outlook / iCloud.

---

## 3. Email templates

Supabase's defaults are plain and unbranded. Customize in Dashboard → Authentication →
Email Templates. Templates to write:

| Template | Notes |
|---|---|
| Confirm signup | Primary. Clear single CTA. State the link expires. |
| Magic link | Only if you enable it. |
| Reset password | Must state expiry and "ignore this if it wasn't you". |
| Change email address | Sent to both old and new addresses. |
| Reauthentication | If used. |

Rules that matter:

- **Plain HTML with inline CSS.** No external stylesheets, no web fonts, no flexbox
  tricks — email clients (Outlook especially) will mangle them.
- Include a **plain-text alternative**. Missing one hurts deliverability.
- Physical mailing address in the footer — required by CAN-SPAM for commercial mail and
  good practice for all of it.
- Logo: reference the **existing** icon by absolute URL
  (`https://{{DOMAIN}}/icons/icon-192.png`). Do not create a new one — a rebrand is
  coming (see `00-INDEX.md`).
- Keep the product name in exactly one place per template so the rename is trivial.
- Set the redirect URLs correctly (§5) or confirmation links will 404.

---

## 4. Product emails (not auth emails)

These are sent by your own code via the provider's API, not by Supabase.

| Email | Trigger | Priority |
|---|---|---|
| Welcome | After email confirmation | High — sets up the first habit, drives activation |
| Trial ending | Day 5 and day 7 of trial (doc `04` §7) | High — this is where trial revenue comes from |
| Payment failed | Provider `past_due` webhook | High — recovers involuntary churn |
| Subscription confirmed | Provider `active` webhook | Medium — receipts come from the MoR |
| Subscription cancelled | Cancellation webhook, with reactivation link | Medium |
| Account deletion requested | `DELETE /api/account` (doc `06`), with cancel link | **Required** |
| Weekly progress digest | Weekly cron, opt-in | Nice to have, strong retention lever |

Implementation:

- `lib/email/send.ts` — thin wrapper over the provider's API, server-only.
- `lib/email/templates/*.tsx` — if you want componentized emails, use `react-email`;
  otherwise plain template strings are fine at this volume.
- **Every non-transactional email needs a working unsubscribe link.** Add
  `profiles.email_preferences JSONB` and honor it. Transactional mail (receipts,
  password resets, deletion notices) does not need unsubscribe and must not be
  suppressed by it.
- Never send email from a request handler's hot path — failures should not fail the
  user's action. Fire and log.

---

## 5. OAuth production configuration 🔴

OAuth works in development because redirect URIs point at localhost. **It will break the
moment you deploy to a custom domain** unless every one of these is updated.

### 5.1 Supabase

Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://{{DOMAIN}}`
- **Redirect URLs** (allow-list — add every one):
  ```
  https://{{DOMAIN}}/auth/callback
  https://{{DOMAIN}}/reset-password
  https://*-{{your-vercel-scope}}.vercel.app/auth/callback   ← preview deployments
  http://localhost:3000/auth/callback                        ← local dev
  ```

`components/auth/SocialAuth.tsx` passes a `redirectTo`; confirm it builds from
`NEXT_PUBLIC_SITE_URL` and not a hardcoded origin. Check `lib/utils/url.ts` — that is
probably where the origin is resolved.

### 5.2 Google

Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 client:

- **Authorized JavaScript origins**: `https://{{DOMAIN}}`
- **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback`
  (Supabase's callback, **not** yours — this is the most common mistake)
- **OAuth consent screen**: publish it. While in "Testing" only allow-listed accounts can
  sign in, and there is a hard 100-user cap.
- Fill in app name, support email, logo, privacy policy URL, terms URL — Google requires
  the legal URLs, which is another reason doc `06` gates launch.
- Basic scopes (`email`, `profile`) do **not** require Google's security review.
  Do not request more.

### 5.3 Apple

Apple Sign In is the most annoying of the two:

- Requires a **paid Apple Developer account** ($99/year).
- Needs an App ID, a Services ID, a private key (`.p8`), Team ID, and Key ID.
- The client secret is a **JWT you must regenerate at most every 6 months** — Apple
  refuses longer expiries. Put a calendar reminder; this silently breaks Apple sign-in
  when it lapses.
- Apple requires a verified domain and return URL.
- Apple relays private email addresses (`@privaterelay.appleid.com`). Your email sending
  must handle that — and **if you send to relay addresses you must register your sending
  domain with Apple**, or the mail bounces.

> **Decision:** if the Apple developer account or the JWT rotation is a burden right now,
> disable Apple sign-in for launch and keep Google + email. A broken OAuth button is far
> worse than an absent one. If you disable it, remove the button from
> `components/auth/SocialAuth.tsx` rather than leaving it to fail.

---

## 6. Auth hardening

- **Password policy** — Supabase Dashboard → Authentication → Policies. Set minimum
  length 8+, enable the leaked-password check (Supabase can check against
  HaveIBeenPwned). Do not require symbol/uppercase gymnastics; length beats complexity.
- **Email confirmation required before use** — confirm it is enabled. Otherwise anyone
  can create accounts with other people's addresses.
- **Session lifetime** — default JWT expiry is 1 hour with refresh-token rotation. Fine.
  Confirm refresh token reuse detection is enabled.
- **Rate limits** on auth endpoints — Supabase provides these; raise them off the
  dev-tier defaults but keep them meaningful. Additional app-level rate limiting is doc `08`.
- **`app/api/passcode/verify/route.ts` has no brute-force protection** — a numeric
  passcode is trivially guessable at unlimited attempt rates. Doc `08` §3 handles it.
- **`active_sessions`** (migration `023`) and `components/settings/DevicesModal.tsx`
  exist — verify the "sign out other devices" flow actually revokes the session server-
  side rather than only deleting a row.
- **Signup abuse** — if you offer a free trial (doc `04` §7), disposable-email signups
  will farm it. Mitigations, in order of cost: require email confirmation before trial
  (already the case), block known disposable domains, require a card for trial (hurts
  conversion — probably not worth it at this stage).

---

## 7. Task list

> Needs from `DECISIONS.md`: `DOMAIN`, `SENDING_DOMAIN`, `SUPPORT_EMAIL`,
> `EMAIL_PROVIDER`, `LEGAL_ADDRESS` (required in email footers), `APPLE_SIGN_IN`.
>
> **Most of this document is dashboard and DNS work an agent cannot do.** The agent's
> share is the email-sending code and the template HTML. Read the split carefully — an
> agent that reports "configured custom SMTP" has hallucinated it.

### 👤 Human — this is the majority of the work here

- [ ] 🔴 Choose an email provider and verify `mail.{DOMAIN}` in their dashboard
- [ ] 🔴 Add SPF, DKIM, and DMARC DNS records; confirm all three pass. **Without these,
      Gmail and Yahoo will reject or spam-folder your mail.**
- [ ] 🔴 Configure custom SMTP in the Supabase dashboard → Authentication → Emails.
      **Skipping this caps you at a few emails per hour project-wide and signups silently
      stop working.**
- [ ] Raise the Supabase auth rate limits once custom SMTP is live
- [ ] Paste the agent's template HTML into Supabase → Authentication → Email Templates
- [ ] Set Supabase Site URL and the full redirect allow-list (§5.1)
- [ ] Update Google OAuth origins and redirect URIs; **publish the consent screen**
      (while in "Testing" there is a hard 100-user cap)
- [ ] Decide `APPLE_SIGN_IN` — configure it properly, or tell the agent to remove the
      button. A broken OAuth button is worse than an absent one.
- [ ] If keeping Apple: set a calendar reminder to rotate the client-secret JWT before
      6 months — it silently breaks sign-in when it lapses
- [ ] Enable the leaked-password check and set the password policy in Supabase
- [ ] Test 20 signups within one hour; check inbox placement on Gmail, Outlook, Yahoo,
      and iCloud *(needs real mailboxes)*

### 🤖 Agent

- [ ] Write the 5 auth email templates as inline-CSS HTML + plain-text alternatives, ready
      to paste. Reference the **existing** icon by absolute URL — do not create new artwork.
- [ ] `lib/email/send.ts` — server-only wrapper over the provider API
- [ ] Templates for the product emails in §4 (welcome, trial ending, payment failed,
      deletion requested, …)
- [ ] `profiles.email_preferences` column + unsubscribe handling. ⚠️ Transactional mail
      (receipts, password resets, deletion notices) must **not** be suppressible.
- [ ] Verify `components/auth/SocialAuth.tsx` builds `redirectTo` from
      `NEXT_PUBLIC_SITE_URL` and not a hardcoded origin — check `lib/utils/url.ts`
- [ ] If `APPLE_SIGN_IN = remove`: remove the Apple button from `SocialAuth.tsx`
- [ ] Audit the device sign-out flow (`components/settings/DevicesModal.tsx` +
      `active_sessions` from migration `023`) — confirm it revokes the session
      server-side, not just deletes a row. Report findings.
- [ ] Confirm no email template contains a `localhost` or `vercel.app` link
- [ ] `npm run typecheck && npm run lint && npm run build`

## 8. Acceptance criteria

- [ ] A brand-new user can sign up, receive a confirmation email **in the inbox**,
      confirm, and land on `/dashboard`.
- [ ] Password reset works end to end on the production domain.
- [ ] Google sign-in works on production for an account that has never used the app.
- [ ] Apple sign-in works, **or** the button is removed.
- [ ] Preview deployments can still authenticate (redirect allow-list covers them).
- [ ] 20 signups within one hour all receive email.
- [ ] No email contains a `localhost` or `vercel.app` link.

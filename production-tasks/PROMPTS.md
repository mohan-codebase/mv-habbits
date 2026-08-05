# Prompts for Gemini Pro in Antigravity

> Antigravity's agent reads your workspace directly — **don't paste document contents**,
> point it at paths. Everything below assumes the repo is open as the workspace root.

---

## 1. Master prompt — use this for every document

Replace `NN` with the doc number. That's the only edit needed.

```
Read these three files in full before doing anything:
  production-tasks/00-INDEX.md      (repo context + conventions)
  production-tasks/DECISIONS.md     (the only source of truth for names/prices/vendors)
  production-tasks/NN-*.md          (your task document)

Then complete the tasks in the task document.

RULES — these override anything else:

1. SCOPE. Do only tasks under the "🤖 Agent" heading. Tasks under "👤 Human" need
   dashboard access, DNS, payments, real devices, or legal judgment. You cannot do
   them. Never claim you did. List them back to me at the end.

2. NO INVENTED VALUES. DECISIONS.md is authoritative for domains, prices, legal
   entity names, and vendor choices. If a value there is TODO, do NOT make one up.
   Write `TODO(DECISIONS.md): <what you need>` in the code, finish everything else,
   and tell me what was blocked. A guessed price or company name looks correct and
   ships silently — that is worse than a blank.

3. ⚠️ MEANS STOP. Anything marked ⚠️ is destructive or security-sensitive. Write the
   file or describe the change, then stop and ask me. Do not run it.

4. MIGRATIONS. Never apply a database migration. Write the .sql file into
   supabase/migrations/ with the next number in sequence and tell me to apply it.
   Never edit an existing migration file — they are already applied.

5. PRODUCTION IS OFF LIMITS. Never run anything against the production database or
   production credentials. Staging only.

6. BRANDING IS FROZEN. Do not rename the product, do not touch the logo, icons, or
   any file in assets/logo, public/logo, public/icons, app/icon.png,
   app/apple-icon.png, app/opengraph-image.png. A rebrand is planned separately.

7. VERIFY. After each task run `npm run typecheck` and `npm run lint`. Fix what you
   broke. Run `npm run build` before you finish.

8. STAY IN SCOPE. Do not start tasks from other task documents. Do not refactor code
   unrelated to your task.

9. INVESTIGATE BEFORE DELETING. Where the document says to verify something before
   removing it, actually run the search and report what you found first.

END YOUR RUN WITH:
  - What you completed
  - What you skipped and why
  - Every ⚠️ item waiting on my approval
  - Every 👤 Human task still pending
  - Every TODO(DECISIONS.md) you left and what value it needs
```

---

## 2. Order to run them

Follow the phases. Do not skip ahead — later docs assume earlier ones landed.

```
Phase 0   01
Phase 1   02 → 03 → 12
Phase 2   04 → 05 → 06
Phase 3   07 → 08 → 09
Phase 4   10 → 11
Phase 5   13
```

Fill in `DECISIONS.md` §1 (domain, support email) and §4 (payment provider) before
Phase 1. Fill §2 (legal entity) and §3 (prices) before Phase 2.

---

## 3. Extra line to add per document

Append these to the master prompt for the doc in question. They target the specific
place a fast model tends to go wrong.

| Doc | Add this line |
|---|---|
| `01` | `Before touching B3, run: grep -rn "api/passcode" app components lib — and report what you found BEFORE deleting anything. B5 is destructive: write migration 030 but do not apply it, and confirm with me that a verified backup exists first.` |
| `02` | `I will supply the hero screenshot separately. Wire the image tag with explicit dimensions and leave the file missing for now. Every claim on the page must be true of the shipped app — if you are unsure a feature works, leave it off and ask me.` |
| `03` | `The billing-guard trigger is the security core of the whole paywall. After writing migration 031, explain in plain language exactly how it prevents a user from setting their own tier via the Supabase REST API.` |
| `04` | `Do NOT write webhook signature verification from memory. Fetch the payment provider's current documentation first and follow it exactly — signature schemes change and a wrong implementation is a security hole that looks like working code. Show me the webhook handler for review before moving on.` |
| `05` | `Leave supabase/migrations/001_initial_schema.sql alone — it is already applied. Put the timezone default change in a new migration.` |
| `06` | `You are drafting legal text, not finalizing it. Where DECISIONS.md is TODO, leave a visible TODO marker in the page rather than inventing an entity name, address, or jurisdiction. A lawyer reviews this before launch.` |
| `07` | `Most of this document is human dashboard and DNS work. Your share is the email-sending code and template HTML. Do not report SMTP or DNS as configured — you cannot do those.` |
| `08` | `Run the RLS permission matrix against STAGING only, hitting the Supabase REST API directly with each test user's JWT — not through our API routes. Report a pass/fail table first. Do not fix anything until I review the results.` |
| `09` | `The Sentry wizard will rewrite next.config.ts. That file has hand-written CSP headers and a deliberately disabled Cache Components block with an explanatory comment. Show me the diff and preserve all of it.` |
| `10` | `This document is mostly human account and DNS work. Your share is scripts and config files. The seed script must refuse to run against a production URL — add an explicit guard.` |
| `11` | `Every test runs against staging. Add a guard that refuses to run if the Supabase URL matches production. No waitForTimeout in Playwright — this app has optimistic UI and realtime updates, arbitrary sleeps will flake.` |
| `12` | `Do not generate replacement OG artwork or icons — a rebrand is planned. Report the existing image dimensions instead. JSON-LD prices must be imported from lib/pricing.ts, never retyped.` |
| `13` | `This is a checklist for me to execute, not code to write. Read it and tell me which items you can verify from the codebase right now, and which need me.` |

---

## 4. Follow-up prompts

**When it stops mid-document**
```
Continue from where you stopped. Re-read production-tasks/NN-*.md first so you have
the full task list. Same rules as before. Tell me which checkboxes are now done.
```

**Before you approve a ⚠️ item**
```
Walk me through exactly what this change does, what it touches, and what breaks if
it is wrong. Then tell me how to undo it. Do not run it yet.
```

**When a build fails**
```
npm run build failed with the output below. Fix the root cause — do not silence it
with an eslint-disable, a `any` cast, or by deleting the failing code.

<paste output>
```

**Reviewing a document's work before moving on**
```
Re-read production-tasks/NN-*.md and check your own work against its "Acceptance
criteria" section. For each criterion tell me: met / not met / cannot verify without
me. Be honest — a false pass costs more than an admitted gap.
```

**When it claims something is done that you doubt**
```
Show me the actual file contents and the command output that prove it. If you did
not run it, say so.
```

**Updating the tracker**
```
Update the status table in production-tasks/00-INDEX.md section 6 for doc NN, and
add a short note about anything left pending.
```

---

## 5. Antigravity-specific tips

- **Use plan-first if offered.** Have it produce the plan, read the plan, then approve.
  These documents are detailed enough that a wrong plan is obvious on sight — much
  cheaper to catch there than in a 30-file diff.
- **Review every diff before accepting.** Especially in
  `components/dashboard/FitnessSummary.tsx` (2,137 lines) and `next.config.ts` — both
  have load-bearing details a model will happily flatten.
- **One document per session.** Fresh context per doc. Mixing two documents in one
  session is how scope creep and half-finished work happen.
- **Let it run the terminal** for `typecheck` / `lint` / `build`. Rule 7 is worthless if
  it can't execute.
- **Commit after each document**, on a branch. `git checkout -b prod/01-launch-blockers`.
  It gives you a clean revert point per doc rather than per session.
- **Watch for confident completion claims** on 👤 tasks — "configured custom SMTP",
  "applied the migration", "set up DNS". It cannot do those. If you see one, the run
  needs re-checking.
```

---

## 6. Cold-start prompt

If a session loses context or you're starting fresh and want it oriented first:

```
Read production-tasks/00-INDEX.md and production-tasks/DECISIONS.md.

Then tell me, in under 200 words:
  - what this project is
  - which task documents are done, in progress, and not started
  - what is blocking the next one
  - what you need from me before you can start

Do not write any code yet.
```

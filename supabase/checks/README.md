# Database cleanup runbook

Applies migrations `029`–`032`. Read this whole file before running anything.

Per `production-tasks/00-INDEX.md` §8, **a human applies migrations — always.**
An agent writes the SQL; you run it. `030` and `031` are irreversible.

## What this cleanup does

| Migration | Effect | Reversible |
|---|---|---|
| `029_streak_timezone_fix` | Makes streaks timezone-aware, adds a `DELETE` trigger, sets `search_path` on two `SECURITY DEFINER` functions | Yes — re-run `007` |
| `030_drop_orphaned_features` | Drops 9 tables: trip planner (7) + personal expenses (2) | **No** |
| `031_remove_social_features` | Rewrites 3 SELECT policies, drops 5 social tables, drops 2 `visibility` columns | **No** |
| `032_dedupe_rls_policies` | Removes 8 redundant duplicate policies on `habits` and `goals` | Yes — re-run `026` |

## Verified before writing this

- **No application code depends on any dropped table.** The only occurrences of
  `trip_trips`, `expenses`, `friends` etc. in `app/`, `components/`, `lib/`, and
  `types/` are explanatory comments in `lib/utils/export.ts` and
  `lib/utils/import.ts`. No query, no import, no type.
- **No database function, view, or trigger references them either.**
  `handle_new_user`, `calculate_streak`, `refresh_habit_stats`,
  `reorder_habits`, and the three session functions all touch only surviving
  tables.
- **`031`'s section ordering is correct and load-bearing** — it rewrites the
  policies that reference `friends` / `family_members` before dropping those
  tables. Do not reorder it.
- **The blast radius is smaller than `031`'s header implies.** `026`'s
  `DROP POLICY` never matched (wrong name — see `032`'s header), so the
  original owner-only `habits_select` from `001` has been in place the whole
  time and still is. Even if `031` §1 were skipped, `habits` would not lose
  its SELECT policy. This is a safety margin, not a reason to reorder.

## Order of operations

1. **Back up, and verify the backup downloads.** Supabase dashboard →
   Database → Backups. A backup you have not downloaded is not a backup.
   Required before `030` and `031`; `029` and `032` do not need it.

2. **Run `01_precheck.sql`** in the SQL editor. Read every result.
   **Query 2 is the gate:** `031` drops `habits.visibility` and
   `goals.visibility` on the stated assumption that every value is `'private'`,
   and nothing in the migration checks that. If any row comes back with a
   different value, real user intent lives in that column — stop and decide
   what to do with it before dropping.
   Query 1 tells you the exact row count you are about to destroy.

3. **Apply `029`.** Non-destructive, fixes a live bug. Run the one-time
   backfill at the bottom of the file.

4. **Apply `030`.** Destructive.

5. **Apply `031`.** Destructive. Run the sections **in the order written**.

6. **Apply `032`.** Non-destructive policy cleanup.

7. **Run `02_postcheck.sql`.** Query 3 is the critical one: it lists any table
   with RLS on and no SELECT policy. Expected result is zero rows. That failure
   mode shows up in the app as an empty dashboard rather than an error, so
   check it here first.

8. **Delete the `trip-documents` storage bucket** and its objects in the
   dashboard, plus the `storage.objects` policies from `014`. `CASCADE` does
   not touch storage — precheck queries 5 and 6 show you exactly what is left.

9. **Open the dashboard** and confirm habits, today's entries, and analytics
   all load.

## If something goes wrong

A missing SELECT policy is recoverable in place — postcheck query 3 prints the
fix. A table dropped that should not have been is **not** recoverable in place:
restore the backup rather than patching forward.

## Not included — decide separately

`todos`, `daily_moods`, and `goals` are also orphaned: no UI reads or writes
them. They are excluded here because all three are in the `EXPORT_TABLES` /
import list in `lib/utils/`, so dropping them means editing that code in the
same change. `030` keeps `goals` and `daily_moods` deliberately. Dropping any
of the three is a product decision, not cleanup.

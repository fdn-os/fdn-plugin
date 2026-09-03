---
name: escalate-db
description: "Move an existing Foundational builders app's database from D1 (the default edge SQLite) to Postgres/Neon, when it has outgrown D1 — pgvector / embeddings, complex analytical SQL, a Postgres extension, or data over ~10 GB. The governor does the DATA migration (copy + a value-parity gate) non-destructively; THIS skill does the CODE swap it leaves to you — the Drizzle dialect change, the flagged-column review, redeploy, verify, and the optional retire. Non-destructive and reversible until you retire the D1. Use when an app on D1 needs a Postgres capability."
argument-hint: "[project name]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, mcp__fdn-hub__whoami, mcp__fdn-hub__get_project_manifest, mcp__fdn-hub__inspect_database, mcp__fdn-hub__query_database, mcp__fdn-hub__escalate_database, mcp__fdn-hub__rollback_database_escalation, mcp__fdn-hub__retire_database_d1, mcp__fdn-hub__get_deploy_status
---

# /fdn:escalate-db — move an app from D1 to Postgres, non-destructively

> **Output style — `plain-output`.** Lead with the action. Name the thing, not the pattern —
> the reader is often not an engineer. No preamble, no narrative recap, no closing pleasantry.
> Real estimates, never "quick".
>
> **Shape.** Numbered lists by default, **five items max**, one claim each, ≤20 words a line.
> Dashes only as nested sub-points, two levels ever. Needs three lines to say → it is prose
> under a `##`, not a list item. Comparison → table. Procedure → numbered steps in run order.
> Anything complex opens with a two-sentence TL;DR.
>
> **Scan.** Bold the figures, counts and file names the reader hunts for. `✅ ❌ ⚠️` on verdict
> lines only, never decoration. Multi-step work ends with what changed — commits, PRs, files.
> One question at the end if any, never several scattered. Code, commands and paths exempt.

D1 is the right default for a Foundational builders app (per-tenant isolation for free, serverless, edge-local).
Escalate to Postgres **only when a capability demands it** — not by default:

- **pgvector / AI embeddings** — similarity search over vectors.
- **Complex analytical SQL** — window functions, CTEs, rich joins that D1's SQLite can't do well.
- **A Postgres extension** — PostGIS, `pg_trgm`, etc.
- **Scale** — a working set beyond ~10 GB, or write patterns D1's single-writer model bottlenecks.

If none of those is true, **stay on D1** — escalation adds an always-on Postgres and operational surface
you don't need. This skill will say so and stop if you can't name the capability.

## The split (read this first)

Escalation has two halves, and they have two different owners:

1. **The DATA migration — the governor's job.** `escalate_database` provisions Neon, copies every table
   and row, and runs a **value parity gate** (it compares actual values, not just row counts). A type
   mis-map ABORTS the migration with your D1 **untouched and still serving**. Only on a clean pass does the
   engine flip to `env.DATABASE_URL`. Your D1 is **retained** so you can roll back. You do not write any of
   this — you call one tool.
2. **The CODE swap — your job (this skill).** The governor copied the data losslessly, preserving SQLite's
   storage types; it did NOT rewrite your app. You change the Drizzle dialect, review the columns it
   flagged, redeploy, and verify. That's what the steps below walk.

Non-destructive throughout: the D1 is retained until you explicitly `retire_database_d1`. Before that, one
call rolls the whole thing back.

## Steps

### 1. Confirm the capability (don't escalate by default)

State which of the four triggers applies. If you can't name one, stop and tell the builder to stay on D1 —
`inspect_database` / `query_database` / `run_advisors` all already work on D1, and D1 has no idle cost.

### 2. Read the current shape

`get_project_manifest(project)` to confirm the project is on D1 (not already Postgres), and
`inspect_database(project)` to see the tables you're about to migrate. Note any tables your app treats as
booleans (columns of 0/1) or dates (text/int timestamps) — the governor will flag these, and they're where
the dialect change needs care.

### 3. Run the migration

`escalate_database(project)`. Read the result:

- **Success** → the engine has flipped; the result carries a `flags` list — the columns whose Postgres type
  you should review (§4) — and the app now reads `env.DATABASE_URL`. Your D1 is retained.
- **Parity FAILED** → the migration ABORTED, your D1 is untouched and still serving. The result lists the
  mismatches (table / column / the differing values). Fix the cause — almost always a flagged column whose
  type needs adjusting — and run `escalate_database` again (it resets and retries cleanly). Do NOT change
  your code while a migration is aborted: you're still on D1.

### 4. Swap the Drizzle dialect + address the flags

This is the code change the governor left to you. In the app's schema + db-init:

```ts
// before (D1):
import { drizzle } from "drizzle-orm/d1";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
const db = drizzle(env.APP_DB);
export const widgets = sqliteTable("widgets", {
  id: integer("id").primaryKey(),
  active: integer("active", { mode: "boolean" }),   // stored 0/1
  createdAt: text("created_at"),                     // ISO string
});

// after (Postgres):
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, text, bigint, boolean, timestamp } from "drizzle-orm/pg-core";
const db = drizzle(neon(env.DATABASE_URL));
export const widgets = pgTable("widgets", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  active: boolean("active"),                          // ← flagged: bigint 0/1 → boolean
  createdAt: timestamp("created_at", { withTimezone: true }), // ← flagged: text → timestamptz
});
```

**The flags are the map.** The governor copied every column **losslessly as its SQLite storage type**
(booleans as `bigint` 0/1, dates as `text`) because it cannot know your intent. Each flag names a column and
the type it was kept as; change the Drizzle column type to what your app actually means (`boolean`,
`timestamptz`, etc.). If a flagged column also needs the stored VALUES converted (e.g. a text date your app
wants as a real `timestamptz`), do that with a one-off SQL migration — and the value-parity gate on the
NEXT escalation would have caught it, which is why a mis-typed column shows up as a parity mismatch, not a
silent corruption.

**What the governor did NOT port (you add these back in your Drizzle schema):** the migration carries column
type, nullability, and primary key — it deliberately does **not** carry `DEFAULT` values, `CHECK`
constraints, or identity/serial sequences (they're app-semantic, and this is the D5 split). So:

- **Integer primary keys** were copied as plain `bigint` with values preserved, NOT as identity/serial. If
  your app relies on the database auto-assigning ids, add the identity/sequence in your Drizzle schema and
  **advance it past the highest copied id** or your next insert collides.
- **Column defaults + checks** — re-declare any `.default(...)` / check constraints your app depends on in
  the `pgTable` schema. Existing rows already have their values (copied verbatim); this only matters for
  future inserts.

### 5. Redeploy + verify

Redeploy the app (its next deploy picks up `env.DATABASE_URL`). Then:

- `get_deploy_status(project)` → deployed.
- `inspect_database(project)` → now shows the **Postgres** schema (Neon-first precedence).
- `query_database(project, "SELECT count(*) FROM <table>")` → matches what D1 had.
- Exercise the app's real flows — especially anything reading a flagged column.

### 6. Retire the D1 — only when you're sure (destructive)

While the D1 is retained you can `rollback_database_escalation(project)` at any time (then revert the
Drizzle change back to `sqliteTable` + `drizzle(env.APP_DB)` and redeploy). Once the app is confirmed
healthy on Postgres and you no longer want the safety net:

`retire_database_d1(project, confirm=true)` — **permanently deletes** the retained D1. After this, rollback
is no longer possible. Leave the D1 retained until you're confident; there's no cost to keeping it a while.

## Rollback (if something's wrong on Postgres)

1. `rollback_database_escalation(project)` — the engine returns to your D1 (`env.APP_DB`), which served
   throughout and is authoritative again.
2. Revert the §4 code change (`pgTable` → `sqliteTable`, `drizzle(neon(...))` → `drizzle(env.APP_DB)`) and
   redeploy.
3. The migrated Neon stays staged, so you can fix the issue and `escalate_database` again without
   re-copying from scratch.

## What this skill does NOT do

- It does not escalate by default or on a hunch — name the capability or stay on D1.
- It does not touch the data migration itself (the governor owns that, with the parity gate).
- It does not `retire_database_d1` for you — that destructive, irreversible step is always an explicit,
  confirmed decision.

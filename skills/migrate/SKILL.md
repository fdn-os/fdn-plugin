---
name: migrate
description: "Move an EXISTING app onto Foundational builders, in one of three modes. SWAP keeps the app and re-points its resources (database, storage, auth) at platform ones. PORT rebuilds it on the house stack and proves parity against the original. REARCHITECT cuts the app at a seam it already has when only part of it fits, then swaps or ports each side. Inventories the app, audits it against the platform's real constraints, and picks the mode BEFORE any code is written. Data migration and cutover are drafted for a human, never run. Use when an app already exists somewhere else and should live on Foundational builders instead."
argument-hint: "[path to the existing app, or its repo URL] [--mode swap|port|rearchitect]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, mcp__fdn-hub__whoami, mcp__fdn-hub__list_projects, mcp__fdn-hub__create_project, mcp__fdn-hub__enable_push_builds, mcp__fdn-hub__commit_source, mcp__fdn-hub__commit_file, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__get_project_logs, mcp__fdn-hub__get_project_manifest, mcp__fdn-hub__provision_database, mcp__fdn-hub__provision_storage, mcp__fdn-hub__provision_kv, mcp__fdn-hub__provision_cron, mcp__fdn-hub__provision_ai, mcp__fdn-hub__provision_realtime, mcp__fdn-hub__set_project_secret
---

# /fdn:migrate — swap the resources, port the app, or cut it in two

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

Three jobs wear the same word, and confusing them is the most expensive mistake available here.

- **SWAP** — the app is fine; its *resources* are in the wrong place. Keep the code, re-point the
  database, storage and auth at platform ones. Cheap, fast, low risk to the UI.
- **PORT** — the app cannot run here at all, so it is rebuilt on the house stack. Expensive, and the
  risk moves entirely into "does the new one still do what the old one did".
- **REARCHITECT** — the app does not move as one thing. Part of it fits and part of it does not, so
  you draw a new boundary first and *then* each piece gets its own verdict.

**Swap and port fail in opposite ways, which is why their playbooks are separate.** A swap fails on
resource *semantics* — the code is untouched and behaves differently anyway, because the new
substrate has different rules. A port fails on silent behaviour *drift* — you rewrote it, so "it
looks right" is not evidence of anything.

**Every migration runs CONCURRENTLY by default, in all three modes.** Stand the new thing up beside
the old one and move usage across in pieces. There is no hard swap until the app's owner has
approved the new build and the data is demonstrably at parity — see §8. A big-bang cutover is a
choice to find every defect at once, in production, with no way back; assume it is wrong unless the
app is trivial or genuinely cannot be run in two places.

**Rearchitect is not a third variant of those two.** It is a decision taken *before* them: cut the
app at a seam, then run swap or port on each side independently. Its own failure mode is scope —
"draw a new boundary" is one short step from "rewrite everything".

§1–§3 are shared, and §3 is where the mode is decided. After that:

| Mode | Your route through this skill |
|---|---|
| **SWAP** | §4-SWAP → §6 → §7 → §8. A swap has no separate parity section: its verification lives inside §4-SWAP, because the UI did not change and parity screenshots would prove nothing. |
| **PORT** | §4-PORT → §5-PORT → §6 → §7 → §8. |
| **REARCHITECT** | §4-REARCHITECT, which sends each piece back through §4-SWAP or §4-PORT, then §6 → §7 → §8 once. |

§6 (data), §7 (sign-off) and §8 (cutover and decommission) apply to all three, and §8 is where a
migration actually ends. Read another mode's section if you like, but do not
work it — they prescribe different verification for a reason.

## 1. Inventory — what does this app actually do

Write it into `MIGRATION.md` at the repo root:

- **Routes / screens** — every page a user can reach.
- **API surface** — every endpoint, method, and shape returned.
- **Dependencies** — anything native, anything with a postinstall, anything touching the filesystem.
- **Data stores** — databases, caches, buckets, and where they live today.
- **Auth** — how a user proves who they are, and what the app does with roles.
- **Scheduled work** — cron, queues, workers.
- **Secrets / env vars** — names only, never values.
- **Static assets** — and whether any filename has a space or non-ASCII character in it.

This list is the input to everything below. A port's parity checklist (§5-PORT) is derived from it
mechanically, so an incomplete inventory silently becomes an incomplete migration.

## 2. Fit audit — the constraints, and how to detect each

For each row: search for the signal, record a verdict, cite the `file:line`. A verdict without
evidence is a guess.

| Constraint | What it breaks | Detect by |
|---|---|---|
| **Workers runtime — no Node APIs** | `fs`, `net`, `child_process`, native modules. `pg` does NOT run here — `@neondatabase/serverless` (HTTP) is the substitute. | node builtins; `pg`, `sharp`, `canvas`, `bcrypt` |
| **~30s CPU per request** | report generation, image processing, unbounded loops | loops over full result sets; sync crypto/compression |
| **Postgres over HTTP** | long-lived connections, `LISTEN/NOTIFY`, cross-request transactions, pooling | `pool`, a client held across handlers |
| **KV: eventually consistent, NO compare-and-set, 60s min TTL** | locks, uniqueness guarantees, exact rate limits | `SETNX`-style locking, dedup-by-cache |
| **Storage: 16 MB/object · 1000 objects · 256 MB** | video, large exports, unbounded uploads | upload handlers with no size cap |
| **Uploads go through your own route** | `presign_object_url` is a build-time tool; a deployed worker cannot call an MCP tool | any direct-to-bucket signing design |
| **Realtime: fire-and-forget, NO database change feed** | anything on Supabase Realtime row-change semantics | `.on('postgres_changes')` |
| **Cron: 5-minute granularity, UTC, no backfill** | sub-minute scheduling, catch-up logic | `* * * * *` |
| **AI: allowlisted models, spend cap, server-side only** | a specific third-party model | OpenAI/Anthropic SDK calls |
| **Auth is org Access on the gated host** | own accounts, passwords, invite flows, per-tenant roles | a `users` table with a password column |
| **Two URLs only** | per-tenant subdomains, mixed public/private in one app | subdomain routing, `Host` branching |
| **Bundle 10 MB / 200 files · `commit_source` 400 files / 4 MiB** | heavy frontends, monorepos, committed binaries | `du -sh dist`; any binary in source |

## 3. GATE — pick the mode, then stop

Present the audit. Choose with `AskUserQuestion`, and do not proceed past an unresolved
does-not-fit.

**SWAP if** the app already runs (or nearly runs) on Workers and every does-not-fit is a *resource*
— the database is in someone's Supabase, files are in a personal S3, it has its own login. The UI
and the logic stay.

**PORT if** the stack itself cannot run here — Rails, Django, a Next app leaning on Node APIs — or
the app was going to be rebuilt anyway. Porting to "tidy it up" is a choice to spend weeks; make it
deliberately.

**REARCHITECT if the does-not-fits CLUSTER IN ONE LAYER** rather than spreading through the app.
That is the signal, and it is visible directly in the §2 table: if every red row names the build
pipeline, or the ETL, or one subsystem — while the request path is clean — the app does not have a
migration problem, it has a boundary problem.

The question that separates it from port: *"if I deleted this one layer, would the rest fit?"* Yes
means rearchitect. No means port.

**"Leave it where it is" is NOT one of the outcomes.** Moving customer apps onto Foundational builders is a
CTO mandate on data governance and security, not a cost or convenience call: company data — PII,
financial records, customer detail — must not sit in individually-owned Vercel, Supabase or cloud
accounts, an app has to survive the person who built it leaving, and governance has to be structural
rather than remembered. **You are deciding HOW and WHEN, never WHETHER.**

So when a piece genuinely cannot run here — a WebSocket server, minutes of CPU, per-tenant
subdomains — the outcomes are:

- **rearchitect** around it (§4-REARCHITECT), which is usually the answer;
- **retire** the app or the feature, if nobody depends on it;
- or **record an accepted gap** with a named owner and a date, and move the data off the personal
  account in the meantime.

Naming a genuine blocker precisely is a success. Concluding "so it stays on Vercel" is not an
available ending, and neither is asking the app's authors whether they would like to migrate.

### The gate's deliverable — write it before any code

Whichever mode is chosen, produce `SPEC.md` for the target the way `/fdn:ideate` would, plus two
sections the ordinary flow has no need for:

```markdown
## Deliberately not migrated
- <feature> — <which constraint, and what was decided instead>

## Capabilities
- database | storage | kv | realtime | ai | cron — needed or not, one line of why
```

**"Deliberately not migrated" is what stops a later reader filing an intentional gap as a bug.** In
rearchitect mode it also records what stayed behind the seam, and what was dropped outright.

Shape the capabilities list to match `get_project_manifest`, which reports the same shape for a live
project. §7 then compares planned against actual, so a half-finished build shows up as a difference
rather than a mystery.

---

# 4-SWAP. Re-point the resources

The code is not the risky part; the substrate is. Work one resource at a time, and after each one
confirm the app still behaves — a swap that changes two things at once cannot be bisected.

### The traps, each of which has actually bitten

- **RLS.** Granting `pg_read_all_data` is *not enough* to read a Supabase-style database: row-level
  security still filters every row, so queries return **zero rows and no error**. It needs
  `BYPASSRLS`. A silent empty result is the single most misleading failure in a swap.
- **Substrate drift is found by RUNNING the import, not by reading migrations.** A column-by-column
  diff of both live catalogs on the dispatch migration found 12 divergences across 186 shared
  columns — one of them blocking (`NOT NULL` vs nullable) that aborted the COPY and cascaded into
  five foreign-key failures. Diff the catalogs, do not trust the migration history.
- **Type contracts break quietly.** `numeric` comes back from the Neon HTTP driver as a **string**.
  Anything typed `number` is now lying. Cast at the query (`::float8`) rather than at the call site.
- **Ordering inside the schema change.** A regex `CHECK` that only made sense on `text` must be
  dropped *before* retyping the column, or the migration fails at a point that reads as a data
  problem.
- **Auth is not a resource swap.** Mapping the app's own accounts onto org Access changes who can see
  what. Put the mapping in front of a human; never convert it silently.

### The order

1. Provision the target resources (`provision_database`, `provision_storage`, …) and get the schema
   live on **empty** tables first.
2. Diff the catalogs, column by column, until the diff is empty. Fix the schema, not the data.
3. Swap ONE resource, deploy, confirm behaviour, then the next.
4. Draft the data migration — do not run it (§6).

### Verifying a swap

The UI did not change, so parity screenshots prove nothing. What you verify is that **the same
inputs still produce the same outputs against a different backend**: row counts per table, foreign
keys intact, a spot-check of aggregates, and every endpoint from §1 returning the same shape.

---

# 4-PORT. Rebuild on the house stack, then prove parity

Scaffold from the house template, port surface by surface in §1's order — data layer, then API, then
screens — committing each separately so a bisect lands on one screen rather than "the port".

## 5-PORT. Parity — the part that is actually hard

**An overflow audit is not a parity check.** On the dispatch port the viewport audit reached **80/80
while the two apps still looked obviously different on a phone** — it cannot see a missing column, a
24-hour clock where the reference shows 12-hour, or five filter chips where there should be six.
Passing it was necessary and nowhere near sufficient.

What works is a **structural inventory diff**, per screen per viewport, as a set difference — so a
missing column is a line of output rather than something a reviewer has to notice. Compare six
dimensions, all of them chrome, never data:

| Dimension | Catches |
|---|---|
| `nav` | a missing date, overflow menu, avatar |
| `headings` | the mobile/desktop pair where one should be hidden |
| `columns` (`th`, `[role=columnheader]`) | **the highest-signal difference** — a missing "Packed" column |
| `controls` (buttons, chips, `select`, `summary`) | "All statuses" vs "All delivery methods" |
| `placeholders` | search copy drift |
| time-like strings | a 24-hour clock against a 12-hour one |

Reference implementation: `ernest-dispatch/scripts/parity-compare.mjs` — stitches reference and port
side by side per viewport and emits the inventory diff. Stitching renders both PNGs into an HTML
page and screenshots that, so it needs no image-processing dependency.

### Three filters, each learned from a wrong finding reaching the top of a report

- **Exclude dev-tooling overlays.** The Next.js dev overlay was read as reference UI, and
  *"Manage MCP & Webhooks missing from port"* was reported as the single highest-impact defect on
  **all 16 screens**. It was a toolbar.
- **Exclude identity-derived text.** The two sides authenticate as different principals, so avatars
  read `PH` and `··` — a permanent, meaningless difference reported on **13 of 16 screens**.
  Chasing it is how you "fix" a component that was already correct.
- **Force both sides to the same theme.** Comparing a light port against a dark reference makes
  every difference look like a difference.

### Row data will not match, and must not

The reference typically has no backend while the port has real rows, so content is incomparable by
construction — and that is fine, because the gaps live in the chrome. **Do not "fix" this by
pointing the reference at production.** That puts real customer data into comparison screenshots,
permanently, in a repo. Compare against a seeded copy with invented data.

---

---

# 4-REARCHITECT. Cut at the seam, then swap or port each side

The app is not one thing. Split it, and each piece gets its own verdict — **stays where it is**,
swaps, ports, or is dropped.

### Find the seam that already exists — do not invent one

The good cut is almost always a boundary the app has already grown, informally, and worked around.
Look for the place where a subsystem *already* hands data to another through a serialised payload:
a snapshot file, a cache key, a nightly export, a queue message, a table nothing else writes.

A seam you invent is a refactor. A seam you *discover* is a decomposition, and the difference is
weeks.

> **Worked example — `grain-dashboards`.** Every does-not-fit named the build pipeline: ~15 upstream
> integrations, two Python scripts, 9.1 MB of committed snapshot against a 10 MB bundle cap. The
> request path was clean — it read a snapshot, and nothing under `app/` or `lib/` imported `pg`.
> Delete the pipeline and the rest fits, so: rearchitect.
>
> The seam was already there. `lib/snapshot-store.ts` published snapshots hourly through Upstash
> Redis so every Lambda could pick them up — a publish/subscribe boundary in all but name, built to
> work around Vercel's per-Lambda bundling. Cutting there meant the ETL stayed put and published to
> R2, while the dashboard migrated and read it. That one cut resolved the bundle cap, the repo size
> AND the Python scripts.

### Write the contract before you move anything

The seam is now an interface, so name it explicitly in `MIGRATION.md`: **who writes, who reads, the
payload shape, how often, and what the reader does when the payload is absent or stale.**

That last one is not optional. A boundary that was internal had no failure mode; the moment it spans
two systems it has several. Decide *now* whether a stale snapshot serves stale data or an error —
the Vercel version of this failed open to the bundled copy on purpose, and said so in its header.

### Then, per piece

| Piece | Usual verdict |
|---|---|
| The part that fits | **swap** or **port** — take it back through §4-SWAP or §4-PORT |
| The part that does not | **stays where it is**, now publishing across the seam |
| The part nobody uses | **dropped** — record it in §3's "deliberately not migrated" |

Run the pieces **one at a time**, with the seam in place and working before the second piece moves.
Both sides changing at once is not bisectable.

### Verifying a rearchitect

The pieces are verified by their own mode's rules. What is new — and what nothing else in this skill
covers — is **the seam itself**:

- The writer's payload and the reader's expectation agree, checked as a contract test on **both**
  sides, not by eyeballing one sample.
- The reader behaves correctly when the payload is **absent, stale, and malformed**. Test all three;
  the first deploy will hit at least one.
- Freshness is what you claimed it is. "Hourly" is a promise about the seam, and it is now a
  distributed one.

**The scope check, every time:** rearchitect is the mode that quietly becomes a rewrite. If the plan
grows a second new boundary, stop and re-read §3 — a second seam usually means the honest answer was
port all along.

## 6. Data — draft it, do not run it (all modes)

Write `MIGRATION-DATA.md`: the schema mapping old → new, what moves, what is deliberately left
behind, the order of operations, and a rollback. Then stop.

**This skill does not run data migrations and does not perform cutovers.** Not because automating
them is hard, but because the failure is unrecoverable and the judgement is not a coding judgement.

Where a real import is needed, model it on `ernest-dispatch/scripts/import-production.mjs`:
`--plan` before `--truncate`, a bounded window rather than everything, and a verification pass —
that run moved 634,461 rows across 20 tables and proved it with row counts, zero orphan child rows,
and recomputed geography coordinates agreeing to 1e-9.

## 7. UAT and sign-off (all modes)

Seed enough invented data that every screen has something to show, including empty, one row, many
rows, and the error path. Then verify with evidence, not status fields:

- `get_deploy_status` must reach `deployed` naming **your** commit.
- `get_project_manifest` must match the manifest §3 planned — a difference is a half-finished build.
- `get_project_logs` shows what the app actually served.
- **`curl` proves nothing.** Every `*.{zone}` host 302s to SSO whether the app is healthy or dead.
  An app has been reported "shipped and green" on a `curl` while serving `app not found` to every
  visitor. Open it in a signed-in browser.

Close with: what moved, what was deliberately dropped, what is still unverified, and who accepted it.

## 8. Cutover — owner approval, data parity, then detach

Migration ends here, and it does not end when the new app works.

### The two gates, in order

**Gate 1 — the owner approves the new build.** The mandate settled *whether* the app moves; it did
not settle whether *this* build is a faithful replacement. That judgement belongs to whoever owns
the app, on the evidence your mode produced — §4-SWAP's same-inputs-same-outputs checks or §5-PORT's
parity diff, plus §7's UAT — and on their own use of it.
Do not move traffic on your own assessment that it looks right.

**Gate 2 — data is demonstrably at parity.** Not "the migration script ran". Show it: row counts per
table, foreign keys intact, aggregates agreeing, and the newest record on both sides. If the two
systems have been running concurrently with writes on both, reconcile before cutting, not after.

Both gates pass before any traffic moves. Record who approved and against what evidence.

### Then detach — and this is the part that satisfies the mandate

Standing the new app up changes nothing about governance while the old one still holds the data. The
migration is complete when the old system is **empty and unreachable**, not when the new one is
live:

1. Point users at the new app; leave the old one reachable but read-only for a short, agreed window.
2. Stop the old app's writes and scheduled jobs, so the two cannot diverge.
3. **Revoke its credentials** — the upstream API keys, database users and OAuth clients held in the
   personal account. Rotate anything that was shared between old and new.
4. **Delete the data from the personal account**, and confirm it is gone. Until this step, PII and
   financial records are still sitting where the mandate says they must not.
5. Retire the old deployment and record the date.

A migration parked at step 1 has doubled the number of places the data lives. That is worse than
where it started, so do not leave it parked: agree the window up front and hold to it.

## Anti-patterns

- **Porting when a swap would do.** The most expensive error available. Ask what is actually wrong
  with the app — usually it is where the data lives, not the code.
- **Porting when only one layer is the problem.** If deleting a single subsystem would make the rest
  fit, that is a boundary problem, not a migration problem. Rearchitect instead.
- **Inventing a seam instead of finding one.** A discovered boundary is a decomposition; an invented
  one is a refactor wearing a migration's clothes.
- **A second new boundary.** One seam is a rearchitect; two is a rewrite that has not admitted it.
- **Leaving the seam's failure modes undecided.** An internal boundary had none. A distributed one
  has absent, stale and malformed, and the first deploy will find one of them.
- **Swapping when the stack cannot run here.** The mirror image: months of workarounds around a
  constraint that a rebuild removes in a week.
- **Treating an overflow audit as a parity check.** 80/80 and visibly different.
- **Chasing a difference that is tooling or identity.** Filter them once, at the source.
- **Diffing against production.** The fastest route to customer data in a repo.
- **Trusting a migration history over the live catalogs.** Drift is found by running the import.
- **A silent empty result treated as "no data".** In a swap it usually means RLS.
- **Auto-running the data migration.** The one step where being wrong is unrecoverable.
- **Migrating an app nobody opens.** Ask who uses it and how often — then RETIRE it. Unused is a
  reason to delete, never a reason to leave company data in a personal account.
- **A hard swap.** Concurrent by default. A big-bang cutover finds every defect at once, in
  production, with no way back.
- **Cutting over on your own judgement.** The owner approves the build; you do not get to decide it
  looks close enough.
- **Calling it done when the new app is live.** It is done when the OLD one is empty, unreachable and
  its credentials are revoked. Anything short of that has increased the number of places the data
  lives, which is the opposite of the point.
- **Treating the move as optional.** The mandate decides whether; this skill decides how. An audit
  that ends "it may not be worth it" has answered a question nobody asked, and invites the app's
  authors to decline something that is not theirs to decline.

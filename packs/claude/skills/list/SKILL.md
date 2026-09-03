---
name: list
description: "Show the saved sessions for a Foundational builders project — what was saved, when, on which branch, and what each left open — so you can pick the one to hand to /fdn:load. With --projects, lists every project in the local index instead. Invoke when returning to work and unsure which save to resume from, or which projects exist on this machine."
argument-hint: "[--projects] [--all]"
allowed-tools: Read, Grep, Glob, Bash, mcp__fdn-hub__list_projects
---

# /fdn:list — what can I load?

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

A picker, not a report. Its whole job is to let you choose an argument for `/fdn:load`.

## Default — saved sessions for the anchored project

Requires an anchor (`.fdn/project.json` in the cwd or a parent). Reads
`<project-dir>/.fdn/sessions/INDEX.md` for the arc and each `<date>-<slug>.md` for its frontmatter.

Newest first, capped at 10 unless `--all`:

```
<project> — 7 saved sessions

  2026-07-28  packing-routes      feat/packing@a1b2c3d   3 commits
              Open: wire the photo upload to APP_BUCKET
  2026-07-27  schema-v2           main@9f8e7d6           1 commit
              Open: backfill trips.driver_id before the next deploy
  ...

  load the newest:  /fdn:load
  load a specific:  /fdn:load packing-routes
```

If a save's `head` SHA is no longer in the repo — rebased away, or never pushed — mark it. A save
pointing at a commit that does not exist will mislead `/fdn:load`, and it is better to know here.

If `.fdn/sessions/` does not exist, say so and name the consequence: `/fdn:load` will fall back to
reconstructing from platform state, which is weaker than a save. Suggest `/fdn:save` at the end of this
session.

## `--projects` — every project in the local index

Reads `~/.fdn-os/projects.json`, and cross-checks it against the platform:

```
list_projects
```

```
  ernest-grain-dispatch   ~/Projects/fdn/apps/ernest-grain-dispatch    4 saves    ✓ on platform
  ernest-ember-orders     ~/Projects/fdn/apps/ernest-ember-orders       0 saves    ✓ on platform
  old-experiment          ~/Projects/fdn/apps/old-experiment          — path missing
  proj-a                  (not in index)                                     ✓ on platform
```

Three disagreements are worth surfacing rather than hiding, because each means something different:

- **path missing** — the folder was moved or deleted; the index entry is stale. `/fdn:project <name>`
  repairs it.
- **not in index** — the project exists on the platform but has no local folder registered here.
  Either it lives on another machine, or it was created outside the chain.
- **in index, not on platform** — deleted (possibly soft-deleted, with a 7-day restore window) or
  created under a different account.

## Anti-patterns

- **Printing the full body of every save.** This is a picker. One line of context each; `/fdn:load` is
  where the detail belongs.
- **Hiding the disagreements.** A stale index entry silently omitted is how someone concludes a
  project is gone.
- **Reading only `INDEX.md`.** It is a convenience; the `<slug>.md` files are the record. If they
  disagree, the files win and the index needs regenerating.

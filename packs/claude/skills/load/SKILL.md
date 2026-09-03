---
name: load
description: "Pick a Foundational builders project back up. Restores the newest /fdn:save session record — or a named one — and when no save exists, reconstructs the state from the platform itself: deploy status, live tiers, provisioned primitives, the deploy journal and ADRs. Invoke at the start of a session on an existing project, after a /compact, or before continuing work someone else left. Replaces /fdn:resume, whose reconstruction is the fallback path here."
argument-hint: "[save-slug | --latest | --project <name>]"
allowed-tools: Read, Grep, Glob, Bash, mcp__fdn-hub__whoami, mcp__fdn-hub__list_projects, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__publish_status, mcp__fdn-hub__list_cron_jobs, mcp__fdn-hub__list_project_secrets, mcp__fdn-hub__get_storage_usage, mcp__fdn-hub__get_kv_usage, mcp__fdn-hub__get_realtime_usage, mcp__fdn-hub__get_ai_usage, mcp__fdn-hub__get_project_logs
---

# /fdn:load — restore the session, or reconstruct it

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

**Two paths, and which one ran must be stated in the output.** A restored save and a reconstruction
carry very different confidence, and a reader who cannot tell them apart will over-trust the second.

It is **read-only**. It changes nothing.

Requires an anchored project (`.fdn/project.json` in the cwd or a parent), or `--project <name>` to
resolve one through the index. No anchor and no argument → stop and say to run `/fdn:project`.

## Path A — a save exists

`<project-dir>/.fdn/sessions/` holds them; `INDEX.md` is the arc.

- bare or `--latest` → the newest record
- `<save-slug>` → that record

Read it, then **verify it against reality before presenting it**. A save is a claim about a moment
that has since passed:

```bash
git log --oneline -1                       # does HEAD match the record's `head`?
git status --porcelain                     # uncommitted work the save does not know about?
git log --oneline <saved-head>..HEAD       # commits since the save
```

and `publish_status` / `get_deploy_status` for the live version. **Where the save and reality
disagree, reality wins and the disagreement is itself a finding** — it usually means someone else
worked here, or the save was written without committing.

## Path B — no save exists

This is the reconstruction path, and it is the only path available for a project you did not save:
someone else's, a fresh clone, a machine change. Read the platform's own state.

### 1. Identity and what exists

```
whoami
list_projects
```

### 2. Platform state — the part memory gets wrong

```
get_deploy_status <project>      # upload vs git-push, and whether the last build succeeded
publish_status <project>         # which tiers are live, at which version
list_cron_jobs <project>         # scheduled work, and whether it actually runs
list_project_secrets <project>   # NAMES only — values are never returned
get_storage_usage / get_kv_usage / get_realtime_usage / get_ai_usage
```

Record **which primitives are provisioned**, because that bounds what the code may assume. An app with
no `APP_KV` has no working cache path whatever the code says.

**A green reading is not evidence of work.** A cron job that reports healthy may be pointed at a tier
with no live version. A `get_kv_usage` of zero keys means a coded cache path has never fired. Say what
the numbers actually show.

### 3. The code, and whether it matches what is deployed

1. A local working copy.
2. `fdn-os/<project>` — `get_deploy_status` returns the link.
3. Failing both, the deployed bundle is the only source of truth. **Say so plainly** — and if the repo
   holds only `_worker.js`, `assets/` and `index.html`, there is no source and reconstruction means
   reading minified output. That has already happened once on this platform.

Then compare the deployed version against the local build and say which is ahead.

### 4. The written record the chain leaves

- **`.fdn/deploys/`** — `/fdn:deploy` writes `<version>.md` plus `INDEX.md`. Read the index for the arc,
  the newest entry for detail. If its newest version disagrees with the live version, say so.
- **`docs/decisions/NNN-slug.md`** — ADRs from `/fdn:harden` §9. Re-litigating a settled decision wastes
  the session and can undo a fix.
- **The docs `/fdn:harden` §8 persists** — README, the route/`/api` contract surface, operational notes,
  and a **State of play** section listing what is deliberately not done. Read it before concluding
  anything is missing.
- **`/fdn:harden`'s report itself is emitted, not written to a file.** If a harden pass ran, its
  findings are gone unless someone copied them into an ADR or a PR body.
- `git log --oneline -20`, `gh pr list`, and `get_project_logs <project>` — the only runtime debugging
  surface, and the fastest route to what is actually broken now.

## Emit the brief

```markdown
## <project> — loaded

**Source:** <save `<slug>` from <date> | reconstructed from platform state — no save found>

**What it is:** <one paragraph. Say whether this came from a spec, a save, or was inferred from code.>

**Deployed:** <tier(s), version(s), the URL that serves> · last build <status>
**Local vs deployed:** <in sync | local ahead by N | deployed ahead>
**Since the save:** <commits, uncommitted work, or "save matches HEAD">   ← Path A only

**Provisioned:** <db / storage / kv / cron / realtime / ai, with anything at or near a cap>

**Open:** <from the save's Open section, or recovered from ADRs, PRs and harden docs>

**Careful of:** <app-specific traps>

**Unknown:** <what you could NOT establish, and why>
```

`Unknown` is mandatory and must not default to empty. "I could not determine X" is the most useful
line in the brief, because it is what the reader would otherwise assume.

## Verifying a live app

An SSO-gated host returns **302 to any unauthenticated request**, including for hosts that do not
exist — so a 302 proves nothing. Use the Access service token, reading it from the environment at the
point of use:

```bash
set -a; . "${GRAIN_ENVRC:-$HOME/Projects/grain/.envrc}" >/dev/null 2>&1; set +a
curl -s -o /tmp/app.html -w '%{http_code}\n' \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  https://{project}.{zone}/
```

A service token is a different principal from a signed-in human: it proves the app *serves*, not what
a given user sees. Never echo the secret.

## Anti-patterns

- **Presenting a restored save as current truth.** Verify against git and the platform first; the save
  describes a moment that has passed.
- **Not saying which path ran.** A reconstruction is a hypothesis; a save is a record. Label it.
- **Treating a healthy-looking cron or health endpoint as evidence.** Both have reported green while
  doing nothing on this platform.
- **Filling `Unknown` with "nothing".** If you established everything, say what you checked.
- **Making changes.** This skill reads. Fixing is the next skill's job, after a human sees the brief.

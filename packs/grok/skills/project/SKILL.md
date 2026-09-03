---
name: project
description: "Anchor this session on a Foundational builders project — find it, or repair a stale/moved anchor. Resolves a project name to a folder on disk via `.fdn/project.json` or the local index, falling back to the platform itself (`list_projects`) when there is no filesystem, as on Claude Desktop. Creating a NEW project is `/fdn:ideate`'s job (project + repo + push-builds CI + spec commit + this same anchor); this skill points there rather than duplicating it. Invoke before /fdn:build, /fdn:save, /fdn:load or /fdn:list when the session is not already inside a project folder, or when an anchor looks stale."
argument-hint: "<project-name> [--path <dir>]"
allowed-tools: Read, Write, Edit, Bash, Glob, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__list_projects
---

# /fdn:project — anchor the session on one project

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

Everything else in the chain needs to know *which app you mean*. This establishes that, once, and
writes it down where the other skills can find it.

## The anchor is the FOLDER, not a global setting — but the platform is the real source of truth

`<project-dir>/.fdn/project.json` is the local anchor. `~/.fdn-os/projects.json` is only an
**index** — a name→path lookup so `/fdn:project <name>` can find a folder you created weeks ago. Both
are an OPTIONAL local convenience layered over the platform, not the only way a project is found: the
platform's own project record (`whoami` / `list_projects`) is the actual source of truth for
project↔owner, and always resolves even when the two files below cannot exist.

The folder-anchor split is deliberate for Claude Code. A single global "current project" field would be
clobbered the moment two sessions run at once, and running several in parallel is normal here. With the
anchor in the folder, two sessions in two directories are independently anchored and share no mutable
state. The index is append-mostly and its worst failure is a stale path, which `/fdn:project` repairs on
next use. Steps 1–3 below are that local fast path; they are not a requirement — on Claude Desktop
there is no filesystem for any of them to exist in, and that is fine.

**Resolution order** — the first that answers wins:

1. `--path <dir>` if given. *(Claude Code only — no filesystem, no `--path`.)*
2. `.fdn/project.json` in the cwd, or in any parent directory (walk up, like git does). *(Claude Code
   only.)*
3. The name in `~/.fdn-os/projects.json`. *(Claude Code only.)*
4. **`mcp__fdn-hub__list_projects`** — if the name (or its namespaced form `<you>-<name>`) is a
   project you own, the project EXISTS and the session anchors on it in **platform-only mode**: no
   folder, no anchor file, every `/fdn:` operation that needs the platform still works. This is the step
   that makes resolution work at all on Claude Desktop, and it also catches a project that exists on the
   platform but was never locally indexed (created on another machine, or by a fresh Desktop session).
5. Nothing matched, on the platform either → this is genuinely a new project; hand off to `/fdn:ideate`
   (see "Not found" and "Creating a new project" below).

## Platform-only mode

On Claude Desktop there is no filesystem, so steps 1–3 above never answer — step 4 is the only
resolution path, and it is sufficient. "Anchored" in platform-only mode means: the project name resolved
against `list_projects`, and every subsequent `/fdn:` call in the session passes that resolved,
namespaced project id to the platform tools directly, with no folder to read or write. Say plainly when
a session is anchored this way, so a later step doesn't go looking for `.fdn/project.json` that was never
written.

## When invoked: `project <name>` (or bare, to report the current anchor)

### Bare — report, do not change anything

Print the resolved project, its folder (or "platform-only, no folder" if resolved via step 4), its git
remote if a folder exists, and whether the platform agrees: `get_deploy_status(project)`. If the folder
and the platform disagree — the repo is a different project, or the project no longer exists — say so
rather than picking one.

### Named — find or point at `/fdn:ideate`

**Found.** Print the path (Claude Code, steps 1–3) or state platform-only mode and the resolved
namespaced id (step 4). If a folder was found and the cwd is elsewhere, say so plainly and print the
`cd` rather than changing directory behind the user's back.

**Not found.** This project genuinely doesn't exist — not on disk, not in the index, and not on the
platform either (step 4 already checked `list_projects` before reaching here). Say so, and point at
`/fdn:ideate <idea>`: that is the one code path that creates a Hub project (its GitHub repo,
push-builds CI, spec commit and this same anchor). `/fdn:project` resolves and repairs; it does not
create — see "Creating a new project" below for why that split exists.

## Creating a new project — that's `/fdn:ideate`, not here

`/fdn:project` resolves an existing project to a folder or to the platform record, and repairs a stale or
moved anchor. It does **not** create projects — `create_project`, `enable_push_builds`, the source-first
repo and its spec commit are `/fdn:ideate`'s job, so there is exactly one code path that brings a project
into existence. If you land here with nothing matched, say so and point at `/fdn:ideate <idea>` rather
than improvising a second creation path — two skills independently calling `create_project` is exactly
how a typo'd name ends up as two projects instead of one.

`/fdn:ideate` writes the same two files this skill reads, in the same shape, so a project it just created
is findable by name the moment it hands off:

**`<dir>/.fdn/project.json`** — the anchor:

```json
{ "project": "<name>", "type": "app", "created": "<ISO>", "repo": "fdn-os/<name>" }
```

**`~/.fdn-os/projects.json`** — the index, merged in, never rewritten wholesale:

```json
{ "version": 1, "projects": { "<name>": { "path": "<dir>", "created": "<ISO>" } } }
```

### Hand-repairing a broken anchor

The one case this skill DOES write these files itself: the folder moved, the index went stale, or
`.fdn/project.json` was deleted, but the project still exists on the platform. Confirm with
`get_deploy_status(<name>)` that it does, then write both files directly in the shapes above, merging
into the existing `projects` map rather than rewriting it wholesale. The project already exists, so
`create_project` has no place in this repair path — invoking it here would duplicate the project, not
repair it. This repair path is **Claude Code only** — without a filesystem there is no anchor file to
repair, and there is nothing to fix: platform-only mode (step 4) already resolves the project on every
call, so there is no stale state to accumulate.

## Verify, do not assume

A resolved or repaired anchor does not mean the platform and the folder agree. In Claude Code, before
handing back:

```bash
cd <dir> && git log --oneline -1        # a commit exists
cat .fdn/project.json                    # the anchor is written
```

In platform-only mode there is no folder or anchor file to check — the verification is just
`get_deploy_status(<name>)` succeeding for the resolved id, which is what step 4 already required.

Either way, `get_deploy_status(<name>)` — a project that exists on the platform reports a modality. If it
reports `upload (direct deploy)` for a project you intend to build from source, that is the state
`/fdn:deploy` § "Source belongs in git" tells you to fix; say so now rather than after the first deploy.

## Anti-patterns

- **A global "current project" file.** Two parallel sessions, one field, silent corruption. The folder
  is the local anchor for Claude Code; the platform record is the anchor for platform-only mode. Neither
  is a single mutable global.
- **Rewriting the index wholesale.** Merge. Another session may have registered a project since you
  read it.
- **Creating a project from here.** That's `/fdn:ideate`'s job now (it runs `whoami`/`list_projects`
  before `create_project`, precisely to catch a near-miss name — `ernest-grain-dispatch` and
  `ernest-grain-dispatchh` are one keystroke apart). `create_project` has no legitimate call site inside
  `/fdn:project` — finding yourself about to reach for it here means you're duplicating ideate's path.
- **Deploying before the repo exists.** That ordering is exactly how a project ends up with build
  output and no source.
- **`cd`-ing for the user.** Print the path; let them move.

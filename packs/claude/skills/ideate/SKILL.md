---
name: ideate
description: Start a new Foundational builders app end-to-end, entirely server-side. Collect the project name, type (app|dashboard|automation), description, visibility (internal|public), and sub-domain; draft a spec; create the project (and its GitHub repo) on Hub; wire it for push-builds CI; and commit the spec straight into the repo via commit_file — no clone, no local git, no filesystem needed, so this completes fully in Claude Desktop as well as Claude Code. It finishes by running /fdn:plan for you, so a plan comes out of ideating without asking for one. Run this FIRST, before /fdn:build.
argument-hint: "[one-sentence app idea] [--path <dir>]"
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion, mcp__fdn-hub__whoami, mcp__fdn-hub__create_project, mcp__fdn-hub__enable_push_builds, mcp__fdn-hub__request_custom_domain, mcp__fdn-hub__list_projects, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__commit_file
---

# /fdn:ideate — kick off a new Hub app

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

Turn an idea into a scaffolded, planned project on the Foundational builders platform. The output is a
repository — created on Hub, wired for push-builds CI, and containing a committed `SPEC.md`
— not just a plan in this chat. The spec is committed server-side, via `commit_file`, so this whole
flow needs no local git, no shell, and no filesystem: it completes identically in Claude Desktop and
Claude Code. `/fdn:build` reads that `SPEC.md` from the repo. (`Read` also loads the bundled
playbook/style-guide JSON in §2 — that's a skill resource, not a user-filesystem step, and works the
same on both surfaces. `Write`/`Edit`/`Bash` exist only for the optional local-clone appendix at the
end; the main flow below never touches them.)

## 1. Collect the five inputs

If the user gave an idea in the argument, use it to pre-fill; otherwise ask. Use **AskUserQuestion** for
the choices, plain prompts for free text. Collect:

1. **Project name** — a short human name (→ slug: lowercase, a–z/0–9/dashes). The platform namespaces it
   under the builder (e.g. `orders` → `<you>-orders`).
2. **Project type** — one of:
   - **app** — general SPA (marketing, product, tool).
   - **dashboard** — bento metric grid + charts (analytics, admin, internal).
   - **automation** — worker-centric task runner + minimal UI (jobs, webhooks, ETL).
3. **Description / prompt** — what it does, key screens, the data it shows, any integrations.
4. **Visibility** — **internal** (SSO-gated) or **public** (no auth). Public requires admin approval;
   default to internal.
5. **Sub-domain** — default `{project}.{zone}`; or request a custom `<project>.fdnl.work`.

## 2. Resolve the playbook + style guide

Read the playbook for the chosen type from `${CLAUDE_PLUGIN_ROOT}/playbooks/<type>.json` — it names the
default `styleGuide`, template, and stack. If the user has a brand in mind, let them pick a different
style guide from `${CLAUDE_PLUGIN_ROOT}/style-guides/*.json` (e.g. `ember`). Record the choices in the spec.

## 3. Draft the base spec

Draft `SPEC.md` now, as a string held in the conversation; it's committed straight into the repo in
§5 via `commit_file`, once the repo exists — there is no scratch directory or local file to write it
into first and then move.

```markdown
# <Project name>
- slug: <you>-<slug>
- type: <app|dashboard|automation>
- visibility: <internal|public>
- subdomain: {project}.{zone} | <project>.fdnl.work
- playbook: <type>
- styleGuide: <id>

## Goal
<one paragraph>

## Screens / routes
- / — <...>
- /... — <...>

## Data model (sketch)
- <table>: <fields>

## API (/api/*)
- GET /api/... — <...>

## Notes / integrations
<...>
```
Base the screens/data/API on the description — be concrete so `/fdn:build` has a real target.

**Scope v1 small.** Steer the spec toward ONE screen, ONE primary action, ONE visible outcome —
invented sample data, no login/roles yet. List only that path under Screens/routes and Data model;
park anything else the user mentioned under Notes as a later version. Expand once the owner has seen
v1 working, not before.

## 4. Create the project + (optional) custom domain

- `mcp__fdn-hub__whoami` to confirm identity + quota, then `mcp__fdn-hub__list_projects` to
  check for a name one keystroke off an existing one — a typo silently creating a near-duplicate project
  is worse than the extra call. Only then `mcp__fdn-hub__create_project` with the short name.
  Report the namespaced id it returns. `create_project` also creates `fdn-os/<project>` on
  GitHub as a side effect (best-effort), so the repo exists from this point on.
- `mcp__fdn-hub__enable_push_builds(project)` right away, on the still-empty repo. This scaffolds
  `.github/workflows/deploy.yml` + `grain.json` and seals a CI deploy key as a repo secret, so a push to
  this SAME repo — this session's first commit and every later one — builds and deploys with no separate
  wiring step. Doing it now, before there is any source to push, closes the window where the repo exists
  but a push into it wouldn't build.
- If a `fdnl.work` sub-domain was requested, call `mcp__fdn-hub__request_custom_domain` (it goes
  to the admin approval queue — note that to the user).

## 5. Commit the spec — server-side

Commit the `SPEC.md` drafted in §3 straight into `fdn-os/<project>` with `commit_file` — no
clone, no local git, no filesystem write:

```
mcp__fdn-hub__commit_file(
  project: "<project>",
  path: "SPEC.md",
  content: <the SPEC.md drafted in §3>,
  message: "spec: <project name>"
)
```

The platform commits it with its own GitHub App credentials, so this step is identical in Claude
Desktop (no filesystem, no shell, no token ever reaching the client) and Claude Code — there is
nothing here that only works on one surface. `/fdn:ideate` still ends with **a repository containing
the plan**, not a spec that only ever lived in this chat: any session, on either surface, can now
pick the project up from exactly what's committed.

`commit_file` never clobbers: if `SPEC.md` already exists in the repo — a re-run, or a project someone
else started — the tool leaves it untouched and reports that it already existed. That is the correct
outcome for a re-run, not a failure. Say so plainly and move on; do not try to overwrite it a second
way.

## 6. Write the anchor — optional, local checkouts only

**The platform is the source of truth for project↔owner** — `whoami` / `list_projects` already answer
"which project, whose." The anchor files below are an *optional local convenience* for Claude Code
sessions that keep a checkout; they are not required for the project to exist or to be found.

On Claude Desktop there is no filesystem, so skip this section entirely — nothing was skipped that
matters, because §5 already committed the spec and §4 already wired the repo. Only if this session is
actually working in a local folder (see the optional appendix at the end, or an explicit `--path <dir>`)
write `<dir>/.fdn/project.json`:

```json
{ "project": "<project>", "type": "<app|dashboard|automation>", "created": "<ISO>", "repo": "fdn-os/<project>" }
```

and merge an entry into `~/.fdn-os/projects.json` (create it if absent) — merge into the
existing `projects` map, never rewrite the file wholesale, or a concurrent session's entry is lost:

```json
{ "version": 1, "projects": { "<project>": { "path": "<dir>", "created": "<ISO>" } } }
```

This is the exact anchor `/fdn:project` reads and writes — see its "The anchor is the FOLDER" section for
the full contract. It exists for Claude Code because folder-scoped anchoring lets parallel sessions in
different directories stay independent — a single global "current project" field would be clobbered the
moment two sessions ran at once. It has no equivalent on Desktop, and needs none there: there is only
ever one session, and the platform's own project record already answers "which project."

Commit `.fdn/project.json` with the project, if it was written.

## 7. Verify, do not assume

`enable_push_builds` now reports what actually landed — read the report from §4 before handing off. It
must show `.github/workflows/deploy.yml` present, `grain.json` present, and the `FDN_DEPLOY_TOKEN`
deploy secret sealed. If it printed an `INCOMPLETE` line instead, say so now — before the user's first
real push silently falls back to no build at all — and re-run `mcp__fdn-hub__enable_push_builds`
(it is idempotent, so re-running IS the verification) rather than proceeding on a guess.

Then confirm the platform agrees: `get_deploy_status(<project>)` should report `deploy source:
git-push`. Both checks are pure platform calls — nothing here needs `gh`, a clone, or a shell, on
either surface.

## Plan it — run `/fdn:plan` now, without being asked

Once the project exists and its spec is committed, **invoke `/fdn:plan` yourself**. Do not stop
and ask whether the user wants a plan; ideating and then planning is one motion, and
`/fdn:ideate` is the surface for both. The user should never have to know `/fdn:plan` exists to
get a plan.

Pass it the spec you just wrote. It produces a one-page `PLAN.md` — what we're building, the
steps, what it needs, what to watch for, and how we'll know it's done. Show it and get a yes
before handing off to `/fdn:build`.

Skip it only if the spec is a single obvious change with one step. Then say so in one line
rather than producing a plan with one item in it.

## 8. Hand off

Tell the user the project is created, the repo is wired for push-builds, and the spec is committed.
What happens next splits by surface — be honest about it rather than promising one thing everywhere:

- **Claude Code**, with a checkout and a build toolchain: **"Run `/fdn:build` to build it."**
- **Claude Desktop** has no filesystem and no build toolchain, so `/fdn:build` cannot run there yet.
  `commit_file` writes one file at a time; getting a whole app's source into the repo from Desktop needs
  a multi-file commit tool that does not exist yet. Say that plainly rather than promising a `/fdn:build`
  that would dead-end the same way this skill used to.

Do NOT build or deploy here — that's `/fdn:build` and `/fdn:deploy`, and only from a surface that can
actually run them.

## Optional: work from a local clone (Claude Code only)

Nothing in §1–§8 depends on this. Claude Desktop cannot do this and does not need to — `commit_file`
already got the spec into the repo. Claude Code may still want a checkout to run a build toolchain
locally:

```bash
gh repo clone fdn-os/<project> ~/Projects/fdn/apps/<project>
```

(`--path` overrides — the same default `/fdn:project` uses, so every `/fdn:` skill agrees on where an app
lives.) Once cloned, write the anchor described in §6 into that folder.

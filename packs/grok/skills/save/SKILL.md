---
name: save
description: "Save the state of a Foundational builders working session so a later session can pick it up exactly — groups the working diff into meaningful commits, pushes them, and writes a session record into the project. Invoke before ending a session, before switching projects, or at any point worth returning to. Read back by /fdn:load and listed by /fdn:list."
argument-hint: "[a short label for this save]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__publish_status
---

# /fdn:save — commit the work, then write down what it was

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

Two halves, and the order matters. **Commit and push first**, so the session record can point at real
SHAs. Then write the record.

Requires an anchored project — `.fdn/project.json` in the cwd or a parent. If there is none, stop and
say to run `/fdn:project <name>` first. Do not guess which project this is.

## 1. Group the working diff into meaningful commits

Not one `git add -A` sweep. Read the diff and cluster it by **concern**, then make one commit per
cluster with a conventional-commit subject.

```bash
git status --porcelain
git diff --stat
git diff                 # actually read it — clustering needs to know what changed, not which files
```

Cluster by what the change *is*, not by directory: a route and its test and its migration are usually
**one** commit; two unrelated fixes in the same file are **two**. Typical clusters: a feature slice, a
bug fix, a schema migration, a refactor, docs, config.

Commit each with **explicit pathspecs**:

```bash
git add <the files for this cluster> && git commit -q -m "feat(orders): add delivery status filter"
```

Never `git add -A` and never `git add .` — a blind add sweeps unrelated work, and in a repo with a
sibling worktree it sweeps someone else's.

**If the diff genuinely is one concern, one commit is the right answer.** Do not manufacture splits.
Say what you clustered and why, so the grouping is reviewable rather than mysterious.

### Before committing, check what you are about to commit

```bash
git diff --cached --name-only
git diff --cached | grep -nE '(API_KEY|SECRET|TOKEN|PASSWORD|BEGIN [A-Z ]*PRIVATE KEY)' || echo clean
```

A secret in a commit is in the history even after you delete it. If the grep hits, stop and fix before
committing — do not commit and amend.

`dist/` must not appear. If it does, `.gitignore` is wrong; fix that first (see `/fdn:deploy` §
"Source belongs in git").

## 2. Push

```bash
git push -u origin "$(git branch --show-current)"
```

If the push fails because the remote has moved, rebase and re-run — do not force. If there is no
remote yet, say so and print the `gh repo create` line rather than inventing one.

## 3. Read the deployed state for the record

```
get_deploy_status <project>   # modality, and whether the last build succeeded
publish_status <project>      # which tiers are live, at which version
```

These go in the record's frontmatter. A save that guesses the live version sends the next session to
the wrong build.

## 4. Write the session record

`<project-dir>/.fdn/sessions/<ISO-date>-<slug>.md`, where `<slug>` is the label argument or a short
derivation of what was done:

```markdown
---
project: <project>
saved: <ISO timestamp>
slug: <slug>
branch: <branch>
head: <sha>
commits: [<sha>, <sha>]
live-version: <from publish_status, or "none">
---

# <one line: what this session was for>

## What changed
<the clusters you committed, one line each, with their SHAs>

## State right now
- builds: <yes/no — and the command you ran to know>
- tests: <what ran, and the real result>
- deployed: <version + tier, or "not deployed since these changes">

## Open — what the next session should pick up
<the actual next step, specific enough to act on without re-deriving it>

## Careful of
<traps a later session would otherwise rediscover>

## Unknown
<what you could not establish. Mandatory; "nothing" is only valid with what you checked.>
```

Then append one line to `<project-dir>/.fdn/sessions/INDEX.md`:

`- <ISO> · <slug> · <branch>@<short-sha> · <one-line summary>`

Commit the record itself (`.fdn/sessions/*`) — it belongs with the code, survives a machine change, and
is reviewable in a PR. It must never contain secrets, tokens or customer data.

## 5. Report

Print the commits made, the push result, and the save path. If anything did **not** happen — the push
failed, tests were not run, a cluster was left uncommitted — say so explicitly. A save that claims a
clean state it did not verify is worse than no save, because the next session will trust it.

## Anti-patterns

- **`git add -A`.** The reason this skill exists is to produce a reviewable history, and a blind add
  destroys that in one command.
- **Writing the record before committing.** Then its SHAs are wrong or absent.
- **A save that says "all tests pass" without running them.** State what you ran and what it printed.
- **Splitting a single concern to look thorough**, or lumping five concerns to save time. Both make
  the history useless in the way that matters — reading it later.
- **Committing `dist/`.** Build output in the repo is how a project ends up with only build output.

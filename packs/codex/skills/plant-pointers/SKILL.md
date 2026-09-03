---
name: plant-pointers
description: "Plant four managed Claude/Grok rules pointers (symlinks, never copies) for Foundational L1 and this organisation's L2. Fetches the Artifacts SHA via Hub, extracts seat-local, and runs the writer. Invoke on a laptop seat after Hub login, when rules links are missing, or after org instructions change. Does not rewrite ~/.claude/CLAUDE.md (L3) or project-root files (L4)."
argument-hint: ""
allowed-tools: Read, Bash, mcp__fdn-hub__whoami, mcp__fdn-hub__list_orgs, mcp__fdn-hub__select_org, mcp__fdn-hub__get_org_instructions
---

# /fdn:plant-pointers — plant L1 and L2 harness pointers

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

TL;DR: Claude and Grok should load Foundational’s constitution (L1) and this organisation’s
standards (L2) through **four named pointers**. The extract lives under `~/.fdn/extract/`. Home
only gets symlinks. Run the writer — never `ln -s` by hand.

This is a **laptop seat**. No filesystem (Claude Desktop) → stop; the writer cannot plant home
links. Do not install hourly systemd or launchd. VPS pull is PARK.

## Pointers (never copies)

| Slot | Target |
|---|---|
| `~/.claude/rules/L1-platform.md` | `<L1 extract>/CLAUDE.md` |
| `~/.claude/rules/L2-org.md` | `<L2 extract>/CLAUDE.md` |
| `~/.grok/rules/L1-platform.md` | `<L1 extract>/AGENTS.md` |
| `~/.grok/rules/L2-org.md` | `<L2 extract>/AGENTS.md` |

L3 (`~/.claude/CLAUDE.md` / user AGENTS.md) is the person’s. L4 (project-root) is the project’s.
Do not open, stitch, or rewrite them. Do not invent `~/.codex/rules/`.

## When invoked

### 1. Resolve the organisation

`whoami` / `list_orgs`. `select_org` only if Hub requires it. **Never hardcode** an org id.

### 2. Fetch L2 (Hub)

Prefer a Hub read that returns `{ sha, claudeMd, agentsMd }` for the selected org
(`get_org_instructions` when that tool exists).

- Do **not** call `list_skills` to dump every skill body.
- Do **not** call `complete_org_grant`.
- Do **not** clone Artifacts, `git pull`, or read a clone. The session never reads the clone.
- If Hub has no instruction files (empty or tool missing): **fail-closed**. No extract swap, no
  pointer plant, yesterday stays. Say that org instructions are not on Hub yet.

Write the two files into a **temp dir**, not into `~/.claude/rules/` or `~/.grok/rules/`.

### 3. Fetch L1

When Hub exposes a published L1 delivery SHA + files, use that pin. If the fetched SHA does not
match the pin, skip L1 (no dangling L1 link).

Until a published pin exists, L1 source is this plugin’s `CLAUDE.md` + `AGENTS.md` (plugin root /
`fdn-skills/`). If those files are missing, skip L1 pointers and still plant L2.

### 4. Run the writer

Locate `scripts/plant-pointers.mjs` from `CLAUDE_PLUGIN_ROOT` or by walking up from this skill to
the plugin root. Then:

```bash
node "$PLUGIN_ROOT/scripts/plant-pointers.mjs" \
  --org "$ORG" \
  --l1-source "$L1_SOURCE" \
  --l1-sha "$L1_SHA" \
  --l2-source "$L2_TMP" \
  --l2-sha "$L2_SHA" \
  --require-l2
```

Omit `--l1-source` / `--l1-sha` when skipping L1. Pass `--l1-pin` when a delivery pin exists.

The writer: extracts L1 then L2 under `~/.fdn/extract/l1` and `~/.fdn/extract/l2/<org>`, stamps the
SHA, plants the four managed symlinks. Same SHA → no-op. Empty source is not a delete. An occupied
**unmanaged** slot (real file, or symlink whose target is not this extract) is left untouched and
fails that slot — never overwrite it to make the run green.

### 5. Print

The four slots and the two SHAs. `✅` if all four planted (or L1 skipped on purpose). `❌` on an
occupied unmanaged path — name the path.

Do **not** print minted repo tokens, `accountId`, grant JSON, or Hub secrets.

## Anti-patterns

- **Hand `ln -s` / copying extract bytes into `~/.claude/rules/` or `~/.grok/rules/`.** The next
  extract would be invisible. The writer is the only planter.
- **Rewriting L3 or L4.** Those files are the user’s.
- **`git pull` of main, cloning Artifacts into a session-visible path.** Never GitHub as VCS. Never Grain.
- **Hourly systemd / launchd.** PARK. Not this command.
- **Dumping `list_skills` bodies** to plant two pointers.
- **Hardcoding an org.**

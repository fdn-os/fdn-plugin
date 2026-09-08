# Model Routing

Which model does the work, and which checks it. Effort is part of the seat.

**Home:** fdn-os-config `.claude/references/model-routing.md`. Deployed: `~/.claude/references/model-routing.md`.

This file is the only place these preferences are named. Skills, agents, banners, Claude Code Dynamic Workflow, and Grok Build workflows Read it and walk the lists. They do not vendor model ids. This file is the routing pin rule. It supersedes older "at or above the named model" pin language for these seats.

## Window vs seats

- **Main context window** — this conversation, in whichever harness (CLI or Desktop). Interactive work lives here.
- **Seat type** — planner, executor, challenger, verifier.
- **Seat instance** — one isolated, non-interactive invocation of the selected matrix model, launched through a CLI subprocess, Claude `agent()` / `claude -p`, Grok `agent()`, `codex exec` / a spawned Codex agent, or a Cursor parallel/cloud **launcher**. Cursor names the launcher, never the seat's model. The window is not a seat instance.

Interview and Design stay in the window because they are interactive with the user. They are not seats.

Planner, executor, challenger, and verifier are always standalone headless instances. Never in the window, even when the window is already Fable 5.1 `xhigh`.

### Preferred main window

Suggestion only. Never switch `/model` unless asked. Lookup: `preferred-day-to-day-model`.

| Harness | Preferred window |
|---------|------------------|
| Claude Code (CLI or Desktop) | Opus 4.8 (`claude-opus-4-8`) `xhigh` |
| Codex | Astra (`gpt-6-astra`) `xhigh` |
| Grok Build | Grok 4.6 (`grok-4.6`) `xhigh` |
| Cursor CLI | Grok 4.6 (`grok-4.6`) `xhigh`. If this harness cannot hold that pin, this harness's strongest, disclosed |

### What each seat is

| Seat | Who |
|------|-----|
| Planner | Writes the Detailed Plan (steps, files, checks) |
| Executor | Builds |
| Challenger | Stress-tests a plan or build |
| Verifier | Confirms the work survives the challenge. Independent of the author on the first pass. Always a **separate seat instance** from the challenger |

Challenger and verifier are always two isolated launches. They may share a model. They must never share an instance. Same model, two seats is not a collision.

## Probe the execution host

Agentic inference and seat processes never run on the MacBook. The laptop may run only client UI, terminal, SSH/mosh transport, or a launcher that controls a VPS, Mac Mini, or Cursor cloud workspace. Probe and launch seats in that execution environment.

| How they are working | Execution host |
|----------------------|----------------|
| Session already on a VPS or Mac Mini | That box |
| Terminal, SSH or mosh into a VPS or Mac Mini | That VPS or Mini |
| Claude Code Desktop, accessing a VPS or Mac Mini | That VPS or Mini |
| Cursor CLI | Its targeted cloud workspace or remote VPS/Mini. If it targets the MacBook, unusable for seats |
| Cursor cloud agent | That agent's cloud workspace |

A row is usable when a **fresh isolated** launch can hold the exact pin, either via a logged-in CLI on that host or via this harness's native isolated agent. Prefer the native isolated launcher when both exist. If a native `agent()` cannot express the exact id (Opus 4.8 vs Opus 5), use `claude -p`. If neither can hold the pin, the row is unusable. Launch fail → disclose, continue down. If every row is unusable, disclose the exhausted list and stop. Never move the seat into the window.

**Codex pin.** Every Codex launch is `{model, xhigh, fast}`. Fast is `-c service_tier="fast" --enable fast_mode`. `--enable fast_mode` alone is not the pin. The banner does not print Fast; attest it from argv. Claude and Grok have no Fast axis. Codex `ultra` and Astra `max` stay off unless the user names them. This is a launcher property, not a per-row suffix, so matrix cells stay `Astra (gpt-6-astra) xhigh` (ADR-041).

**Claude-only host** (only Claude logged in on the execution host, any transport): skip Grok and Codex rows. Claude rows still launch as above.

Cursor is a **launcher**, never a matrix row. A Cursor agent launches seats; it never fills one.

A transport-only helper whose job is to open or manage an SSH or mosh hop uses light Claude and is not an executor seat. A session whose own shell is already on the VPS or Mini is not that helper. Seats on that box walk these lists normally.

## The matrix

Same lists on every harness. Walk 1 → 2 → 3. First usable row wins. Disclose every skip. Launch it headless.

Lookups name the **list**, not row 1: `preferred-planning-model`, `preferred-executor-model`, `preferred-challenger-model`, `preferred-verifier-model`. Frontend artifacts use `preferred-frontend-model`, not the executor list.

**Own land.** Author model means every exact model id that materially produced the plan or build being checked, in the window or a seat. First pass: challenger and verifier skip those ids. If none remain, second pass: first usable author-model row, fresh instance, disclosed. Then stop. The challenger's critique is not the artifact and does not disqualify that model from the verifier seat. Haiku is never a checker.

Opus 4.8 on executor vs Opus 5 on the check lists is deliberate. Verifier matches Challenger until they need to diverge.

| Seat | 1 | 2 | 3 |
|------|---|---|---|
| Planner | Fable 5.1 (`claude-fable-5-1`) `xhigh` | Astra (`gpt-6-astra`) `xhigh` | Grok 4.6 (`grok-4.6`) `xhigh` |
| Executor | Grok 4.6 (`grok-4.6`) `xhigh` | Astra (`gpt-6-astra`) `xhigh` | Opus 4.8 (`claude-opus-4-8`) `xhigh` |
| Challenger | Astra (`gpt-6-astra`) `xhigh` | Fable 5.1 (`claude-fable-5-1`) `xhigh` | Opus 5 (`claude-opus-5`) `xhigh` |
| Verifier | Astra (`gpt-6-astra`) `xhigh` | Fable 5.1 (`claude-fable-5-1`) `xhigh` | Opus 5 (`claude-opus-5`) `xhigh` |

**Astra-unusable substitute.** If an Astra row cannot hold the pin (Codex missing, CLI older than 0.153.4, or HTTP 400 "requires a newer version of Codex"), walk Sol (`gpt-5.6-sol`) as that row under the same Codex pin, disclosed, then continue.

What a later touch re-tests, one premise per list:

- **Planner.** Fable holds the plan seat by the user's direction (ADR-074, 2026-08-13; 5.1 pin, ADR-038). The advisor design keeps Fable in the judgment seats, and the plan is one of them (fable-advisor ADR-030). Row 2 is Astra as the OpenAI fallback, not a judgment upgrade (ADR-039).
- **Executor.** Grok 4.6 leads when its CLI is present (ADR-074). Astra is the Codex fallback in Sol's old slot (ADR-039). Opus 4.8 is the Claude-only build row (fable-advisor ADR-030, codex-absent case). The Opus 4.8 build versus Opus 5 check split above is recorded as deliberate; no further reason is on record (ADR-037).
- **Challenger and verifier.** Independence from the doer is what the check seats buy: judge quality probed flat across the strong tiers (fable-advisor ADR-030, 2026-07-09), and a vendor split is a pairing, not a law (ADR-027). Astra checks Grok-built work. Opus 5 checks work whose authors already occupy the earlier check rows (ADR-039, restating ADR-074).
- **Never in the window.** The check seats spawn nonparticipating for cold independence, so a checker never grades the conversation it sat in (fable-advisor SKILL.md; ADR-027). Why the plan and build seats also leave the window is not on record (ADR-037).

## Derived examples

Non-normative. Outcomes of the walk when every row 1 is usable and authorship is as shown. The lists and own land are authoritative. On any fallback, re-derive.

Interview and Design always stay in the window.

| Case | Planner | Executor |
|------|---------|----------|
| Multi-CLI host (Claude + Grok + Codex) | Fable 5.1 | Grok 4.6 |
| Claude-only host (any transport) | Fable 5.1 | Opus 4.8 |

| Case | Build: challenger → verifier | Plan: challenger → verifier |
|------|------------------------------|------------------------------|
| Multi-CLI host | Astra → fresh Astra | Astra → fresh Astra |
| Claude-only host | Fable 5.1 → fresh Fable 5.1 | Opus 5 → fresh Opus 5 |

## Apply

Any model, any harness, any workflow. Precedence below never moves a seat into the window.

1. Name the window. Do not change `/model` unless asked.
2. Probe the execution host.
3. Interview or Design: stay in the window.
4. For planner, executor, challenger, or verifier: walk that list. Launch the winner headless. If the list is exhausted, stop. Challenger and verifier are always two launches, even when the winning model is the same.
5. Own land applies to challenger and verifier (first pass, then second pass, then stop).
6. Pin `{model, effort}`. Codex rows also pin Fast. If a required pin cannot be enforced, the row is unusable.

**Collision:** checker second-pass using the authoring model. Surface it. Do not silently treat it as independent. Reusing the challenger's conversation as the verifier is forbidden.

**Workflows and launchers.** Every harness walks the seat list on the execution host. For each winning row, use this harness's native isolated agent only if it can enforce that row's exact pin (`{model, effort}`, and Fast on Codex); otherwise use that row's logged-in CLI. Claude Code Dynamic Workflow and Grok Build are workflow languages. Codex uses `codex exec` or spawned agents. Cursor parallel/cloud agents are launchers. Cursor is never a matrix row.

User pins are exact inside that model family, not an order across vendors.

## Launch a seat headless

A seat is a fresh process on the execution host, pinned by argv. Before anything it returns is trusted, check what the launcher itself reports against the pin. Claude and Grok report the served model in their result JSON. Codex reports the requested model and effort in its launch banner; that banner is the record of what was asked, not proof of what was served. The seat's own prose is never the record.

### Claude seats

```
claude -p --model <exact id> --effort xhigh --output-format json \
  [--permission-mode acceptEdits] [--max-turns <n>] < <brief>.md > <run>.json 2> <run>.err
```

- Pin the exact id (`claude-fable-5-1`, `claude-opus-5`), never an alias. An alias resolves to "latest" and defeats the check below.
- `--effort` takes low, medium, high, xhigh, max. The result does not echo effort, so the argv is the record.
- Verify from the result JSON: `modelUsage` keys are exactly the pinned id, `is_error` is false, and `subtype` does not contain `fallback`. The answer is the `result` field. Cost is `total_cost_usd`.
- One run in the trawl returned an empty `modelUsage` and a null top-level `model` on an otherwise clean result. When that happens, open the transcript at `~/.claude/projects/<encoded cwd>/<session_id>.jsonl` and count `message.model` on the assistant lines. Do not grep the raw transcript for `fallback`. The session's own injected instructions can contain the word.
- `--no-session-persistence` deletes the transcript, so leave it off when the transcript check matters.
- The brief goes on stdin. A positional `"$(cat brief.md)"` argument returned exit 0 with empty output in about a second. Stdin worked every time it was tried.
- Never pass `--bare`. It skips keychain auth and the seat exits 1 at once.
- `--max-turns` truncates a seat that needs more turns. One run needed five. Size it generously or leave it off.
- A headless seat cannot answer a permission prompt. A build seat names a `--permission-mode` so its edits are not denied. A check seat needs none.

### Codex seats

```
codex exec -m <exact id> -c model_reasoning_effort="xhigh" -c service_tier="fast" \
  --enable fast_mode --color never \
  -s <read-only|workspace-write> -C <dir> -o <run>.last.md - < <brief>.md > <run>.log 2>&1
```

- Pin model, effort, and Fast on argv. The config file is not the record. A bare `codex exec` ran at effort `none` on 2026-07-07. Typical ids: `gpt-6-astra`, or `gpt-5.6-sol` when the Astra substitute fires.
- Fast is both flags. `--enable fast_mode` without `-c service_tier="fast"` is not the pin. On this host, 2026-09-07, `response.completed` reported `service_tier="priority"` (the Fast request value) only when `service_tier` was on argv. The banner still does not print Fast; attest Fast from argv.
- The second-opinion wrappers bake both Fast flags and refuse `--fast-mode off`.
- Astra requires Codex CLI 0.153.4 or newer. On 0.147.0 the banner still printed `model: gpt-6-astra`, then HTTP 400 "requires a newer version of Codex". That error makes the row unusable. Use the Sol substitute.
- Verify from the log before trusting the run: the `model:` line reads the pin and the `reasoning effort:` line reads `xhigh`. Fast is not in the banner.
- Pass `--color never`. Claude Code's shell exports `FORCE_COLOR=3`, which makes codex color the banner even into a file, and a line-start match on `model:` then finds nothing.
- `-C` must name a git repository, or pass `--skip-git-repo-check`. Codex refuses a plain directory with "Not inside a trusted directory".
- `-s read-only` for check seats. `-s workspace-write` for build seats, with `--add-dir` for any second path. A worktree's git metadata lives in the main repo's `.git/worktrees/`, outside a worktree-only grant, so the orchestrator commits.
- A read-only seat cannot run bats. Three check seats reported an unwritable temp dir. Say so in the brief.
- Give `-o` a path the seat never writes itself. The last-message write replaced a review the seat had written with its own tools.
- The brief goes on stdin, as above. With a positional prompt and no stdin redirect, a seat printed "Reading additional input from stdin" and ran inconsistently until stdin came from `/dev/null`.
- `codex exec resume` rejects `--sandbox`. Launch fresh in the same directory instead.
- `codex exec` outlives a killed parent and has finished its deliverable after one. Before a re-dispatch, `pgrep -f "codex exec"` and wait on a live one.
- The second-opinion skill ships two wrappers. `run-codex.sh` kills the seat at `SO_TIMEOUT`, default 540 seconds, and returns nothing without its end marker; it discarded a finished review once. `launch-codex.sh` detaches with `nohup`, verifies the banner, and returns before the seat finishes; the caller polls. Seats at `xhigh` have run 13 to 18 minutes on this fleet. Use the detached wrapper. Neither wrapper passes `--color never`, so from a Claude Code shell unset `FORCE_COLOR` before calling one, or its banner check never matches.

### Grok seats

```
grok --prompt-file <brief>.md -m grok-4.6 --reasoning-effort xhigh --output-format json \
  [--max-turns <n>] > <run>.json 2> <run>.err
```

- `--prompt-file <path>` runs one turn from a brief on disk. `-p "<prompt>"` is the inline form.
- Verify from the JSON: the `modelUsage` key reads `grok-4.6-build`. The served id carries a `-build` suffix, so an exact match against `grok-4.6` is wrong. The answer is the `text` field. Cost is `total_cost_usd`.
- Effort is not echoed; the argv is the record.
- `--always-approve` auto-approves every tool execution. A seat that only read one file did not need it in a probe on this host.

### Every launcher

- One brief per seat, on disk: intent, boundaries, return contract. Paths, not pasted content, when the content is large. Never a secret.
- Launch in the background with the output paths fixed first, and wait on the process. Seats in the trawl ran 5 to 28 minutes, and a 540-second cap killed one. Use the harness's own background-and-poll primitive; several sessions hand-rolled poll loops that duplicated it.
- Keep the argv beside the result. Claude and Grok do not echo effort, so for them the argv is the only record of it. Codex also prints it in the banner.
- Read the launcher's `--help` before composing the command. The sessions that did caught flag names up front.
- Never trust a `serving_model=` line in the seat's prose. A Sol seat whose banner read `gpt-5.6-sol` printed `serving_model=gpt-5`.

### Seen on this fleet

Trawl of Grok Build and Claude Code transcripts, 2026-08-20 to 2026-09-03, about 45 launches. Every failure named above was seen at least once. Fable seats: 3 hard errors in about 19 launches, all `--bare` or a positional prompt. Sol seats: 3 failures in about 25. No mid-run model swap was observed. Every clean Fable check read exactly the pinned id. The one recorded swap scare was a raw-text grep for `fallback` that hit the session's own injected instructions. Evidence is in ADR-038.

Astra headless pin, 2026-09-06, this host: Codex 0.147.0 failed closed with the 400 above. Codex 0.153.4 served `gpt-6-astra` at `xhigh` without Fast. Evidence is in ADR-039.

Astra Fast headless pin, 2026-09-07, this host: same CLI with `-c service_tier="fast" --enable fast_mode` served `gpt-6-astra` at `xhigh`. SessionConfiguredEvent and `response.completed` both read `service_tier="priority"`. Evidence is in ADR-041.

## Other dispatches

| Role | Model |
|------|-------|
| Mechanical transform | Haiku 4.5 (`claude-haiku-4-5`) `high` |
| SSH transport helper | light Claude (Haiku 4.5, or host Claude default). Never Grok or Codex |
| Scout | Luna (`gpt-5.6-luna`) `xhigh`, read-only. Fallback Sonnet 5 (`claude-sonnet-5`) `high`. Codex efforts used here: `xhigh` default, `ultra` reserved |
| Frontend / FDS web artifacts | Astra (`gpt-6-astra`) `xhigh`. Fallback Fable 5.1 (`claude-fable-5-1`) `xhigh`. Lookup: `preferred-frontend-model`. Do not walk the executor list for this work (ADR-040) |
| Hardest single-shot reasoning, excluding Interview and Design | Walk the planner list, headless, one-line why |
| Codex `ultra` / Astra `max` | Do not pin unless the user names it |

## Precedence (model choice only)

1. The user's explicit word
2. A skill's ratified seat-to-list mapping (name a seat, not a model id)
3. Open `/fable-advisor` coverage, that workflow only
4. This file

Deterministic tests decide every gate. Model output is advisory.

If this file cannot be read: "your strongest reasoning model at its highest setting."

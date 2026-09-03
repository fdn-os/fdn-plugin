---
name: debug
description: "Work out why a Foundational builders app is broken, and prove it before fixing it. Grounds the failure in facts first — what was actually seen, which version is actually live, the app's own logs, the data — then builds a check that fails on demand, and only then forms three explanations, testing the least likely first so the favourite theory cannot go unchallenged. Use when the app is broken, a page is blank, a save does nothing, a deploy did not take, or someone says debug this / why is this failing / it used to work."
incorporates: mattpocock/skills (engineering/diagnosing-bugs) — the feedback-loop discipline, repro minimisation, instrumentation hygiene, and the post-mortem
argument-hint: "<what is broken, in the words of whoever saw it> [--path <dir>]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, AskUserQuestion, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__get_project_logs, mcp__fdn-hub__get_project_manifest, mcp__fdn-hub__query_database
---

# debug — facts first, then a check that fails, then kill your favourite theory last

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

Find the cause, prove it, then fix it. Three orderings carry this skill: **facts before
explanations**, **a check that fails before any theory**, and **the least likely explanation tested
first**. All three exist to stop the same thing — shipping a plausible fix for the wrong cause, so
the bug comes back next week wearing a different hat.

## When to use this

- Something in the app is broken, blank, slow, or silently doing nothing.
- A save appears to work and the data is not there afterwards.
- "It used to work" / "why is this failing" / "debug this".

## When not to

- The cause is already known and agreed. Just fix it.
- It is a change you want, not a fault. That is `/fdn:plan` or `/fdn:build`.
- A typo already identified by the person reporting it.

## Before you paste anything: redact

This skill has you paste logs, outputs and error text. **Replace every secret with `<REDACTED>`
first** — API keys, tokens, connection strings, customer names, phone numbers, addresses. App logs
carry real user data, and a log dump pasted into a chat is a copy of that data that outlives the
bug.

If the redacted version is not enough to work out the cause, say so and ask. Never un-redact.

## Phase 1 — facts, no explanations yet

**Do not theorise until this phase is finished.** A theory formed in the first minute turns the rest
of the investigation into a search for evidence that it was right.

### 1a. What was actually seen

Get it in the words of whoever saw it, not a paraphrase:

1. What they did, click by click — the exact page, the exact button.
2. What happened, and what they expected instead.
3. When it last worked, if it ever did.
4. Whether it happens every time, or once in a while.
5. A screenshot or the URL from the address bar, if there is one.

"It's broken" is not step 1. Ask.

### 1b. Which version is actually live

The single most common wasted hour is debugging code that is not the code running.

```
get_deploy_status
```

Compare what is deployed against what you are reading. If they differ, stop — there is no bug to
find until they match.

### 1c. What the app itself says

```
get_project_logs
get_project_manifest
```

The logs tell you whether the server was even reached and what it said. The manifest tells you what
this project actually has — a database, storage, a scheduled job — so you do not spend twenty
minutes on a query against a database that was never provisioned.

Then the browser, for anything the person sees rather than the server does: open the page, take the
**Console** tab and the **Network** tab. A red line in Console and a failed request in Network are
two different bugs, and knowing which one you have decides everything after.

### 1d. The data, when the complaint is about data

```
query_database
```

Read the rows before believing any story about them. "The export is missing yesterday" is a
different bug depending on whether yesterday's rows exist.

### 1e. Five cheap checks that are very often the whole answer

These are **facts, each one lookup deep** — not theories. Run them before building anything:

| Check | How you know | If it's this |
|---|---|---|
| The deploy never landed | `get_deploy_status` shows an older version or a failed build | Redeploy; read the build log for why |
| A secret is missing or wrong | Logs show an auth or connection error from the server | Set it, redeploy — a secret change needs one |
| The database was never provisioned | The manifest lists no database | Provision it, then re-run the failing action |
| The browser is showing an old copy | It works in a private window and not the normal one | Hard-refresh; then look at cache headers |
| Front end and server disagree on a route | Network tab shows **404** on an `/api/…` call | Fix whichever end is wrong — do not add a redirect |

If one of these is it, say which, fix it, and stop. Do not run the rest of the skill for form's sake.

## Phase 2 — a check that fails on demand

**Gate: do not form a single explanation until you have this.** Without it you cannot tell a fix
from a coincidence.

A check is anything that takes **under a minute** and comes back red right now:

1. Run it locally and click the exact path — `npm run dev`, then the steps from 1a.
2. Hit the failing endpoint directly — `curl -s localhost:5173/api/orders | head`.
3. Run the query that returns the wrong rows.
4. A test that reproduces it, if the repo has tests.

Then **make it smaller.** Strip everything the failure does not need — fewer rows, one record, no
login, one field. A repro you can run in four seconds gets run forty times; one that takes two
minutes gets run twice, and the second time you will guess instead.

Write down the smallest thing that still fails. That sentence is the bug.

## Phase 3 — exactly three explanations, least likely first

Write three. Not one, not "it's probably the cache".

Then **test them in reverse order of how likely you think they are.** The most likely one is the one
you will unconsciously go easy on, so it goes last, when the other two are already dead and it has
to survive on evidence rather than on being your idea.

For each: name the observation that would **rule it out**, then go and look for that observation.
An explanation nothing could disprove is not an explanation.

If all three die, you have learned something real — go back to Phase 1 with it. Do not invent a
fourth to avoid admitting the first three were wrong.

## Phase 4 — fix it, then prove it

1. Make the smallest change that addresses the **cause**, not the symptom.
2. Run the Phase 2 check. It must go **green** — the same check, unchanged.
3. Break the fix on purpose and confirm the check goes red again. A check that passes both ways was
   never testing anything.
4. Remove every log line, timer and print you added while investigating. Debug output shipped to
   production is how the next person's logs become unreadable.
5. Run the app once, end to end, the way a person uses it. A fix that satisfies the check and breaks
   the page next door is not a fix.

## Phase 5 — one paragraph, then decide where it lives

Say plainly: what broke, why it broke, what it would have taken to notice it sooner. Two or three
sentences.

Then place it, if it belongs anywhere:

- A wrong assumption about how the app should behave → `SPEC.md`.
- A decision someone will otherwise reverse by accident → an ADR under `docs/decisions/`.
- Something that will break the same way again → say so to `/fdn:harden` as a gate to add.

If it does not belong anywhere, say that too, and stop.

## Report

1. **Cause** — one sentence, plus the evidence line that proves it.
2. **Fix** — the file and what changed.
3. **Proof** — the check, red before and green after, quoted.
4. **Ruled out** — the two explanations that died, and what killed them.
5. **Not verified** — in those words, anything you did not check.

Never report a cause you did not prove. "Probably the cache" with a fix attached is a guess with a
commit hash, and it is how the same bug gets fixed three times.

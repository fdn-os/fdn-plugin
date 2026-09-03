---
name: plan
description: Write a short, plain plan for a piece of work on a Foundational builders app — new feature, change, or fix. One page, no jargon, steps someone can actually follow. Lighter than /100x:plan-hard, which is for multi-phase engineering work. Run before /fdn:build.
argument-hint: "[what you want to build or change, in a sentence]"
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, mcp__fdn-hub__get_project_manifest
---

# /fdn:plan — decide what we're building, in one page

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

For work on a Foundational builders app: a new feature, a change, a fix. Produces a plan the person
who asked for it can read and agree with, before anything gets built.

**Not** `/100x:plan-hard`. That one is for multi-phase engineering with seams, rollback
playbooks and regression matrices. This is for "add a CSV export to the tracker" — most of
what gets built here.

Output goes in the project folder as `PLAN.md` and `/fdn:build` reads it.

## Two ways you get here

1. **Automatically, from `/fdn:ideate`** — the usual one. Ideate finishes by running this
   itself, so a plan falls out of starting a project without anyone asking for one.
   `/fdn:ideate` stays the only command a new builder needs to know.
2. **Directly** — when the idea already exists and only the build needs planning: the
   thinking happened in a doc or a conversation, or it's a change to an app that is already
   live. There is nothing to ideate; skip to the plan.

Either way the output is identical. If you arrived by route 2, check for an existing
`SPEC.md` first and extend it rather than restating it.

## Before you write anything

1. Run `get_project_manifest` on the project. It tells you what already exists — database,
   storage, cron, realtime — so the plan doesn't propose provisioning something that's
   already there, or assume something that isn't.
2. Read `SPEC.md` if there is one. The plan extends it; it does not restate it.
3. If the request is genuinely ambiguous, ask **one** question with two or three concrete
   options. Not a questionnaire — a choice.

## The plan

Five headings. That is the whole format.

```markdown
# <what we're building>

<One sentence. What a person will be able to do that they can't today.>

## Steps
1. <a thing that gets done>
2. <the next thing>
3. …

## What it needs
<Only what has to be provisioned or changed: "a database table for exports",
"nothing new". Skip the heading if the answer is nothing.>

## Watch out for
<Only where it changes a step. If nothing, delete this heading — do not write "N/A".>

## Done when
<How we'll know. Something observable: "you can click Export and get a CSV of
this month's orders".>
```

### Rules for the writing

Follow `plain-output` (the block at the top of this file is the whole rule; the long form
lives at `shared/engineering/rules/plain-output.md`). The parts that bite hardest here:

- **Steps are things someone does**, in order. Not workstreams, not phases.
- **Five steps or fewer.** More than five means it is two plans — say so and pick one.
- **No status tables, no confidence scores, no phase numbering.** If the work genuinely has
  phases, it belongs in `/100x:plan-hard`.
- **Estimate in real units** if you estimate at all: "an afternoon", "about 20 minutes".
- **Name the thing, not the pattern.** "the app's own database", never "tenant-scoped D1
  binding". The reader is often not an engineer.
- If a sentence survives deleting its jargon, it did not need it.

## Length

One page. If `PLAN.md` runs past roughly 40 lines, the work is too big for this skill —
either cut the scope with the person who asked, or hand it to `/100x:plan-hard`.

## Then

Show the plan and get a yes. Do not start building off an unread plan.

Once agreed: `/fdn:build` implements it, `/fdn:deploy` ships it.

## Worked example

Request: *"can the delivery tracker email me the day's exceptions each evening?"*

```markdown
# Evening exception email for the delivery tracker

Each evening you get one email listing the deliveries that went wrong today,
so nobody has to remember to check the dashboard.

## Steps
1. Add a query that finds today's failed and late deliveries
2. Format them into a plain email — date, order, what went wrong
3. Send it on a schedule at 7pm
4. Send yourself a test one and check it reads well

## What it needs
A scheduled job. The database is already there.

## Watch out for
If a day has no exceptions, send nothing rather than an empty email —
otherwise it becomes noise and people stop opening it.

## Done when
At 7pm you get an email listing today's exceptions, and nothing on a clean day.
```

Four steps, no jargon, and the person who asked can tell you whether it's right.

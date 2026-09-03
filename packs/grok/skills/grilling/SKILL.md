---
name: grilling
description: "Interview the person relentlessly about an app idea, a change, or a decision until every branch of it is settled. Works in rounds — asks the whole settled frontier at once, each question numbered and carrying a recommended answer, so nothing gets built on a silent guess. The interview primitive behind /fdn:grill-me and /fdn:grill-with-docs. Use before /fdn:ideate to sharpen an idea, on a SPEC.md that is vague about what the app should do, or when a build keeps changing direction."
origin: "mattpocock/skills (productivity/grilling) — adapted for the /fdn: app chain"
argument-hint: "[what to grill — an idea, a SPEC.md path, or a decision]"
allowed-tools: Read, Edit, Grep, Glob, Skill, AskUserQuestion, mcp__fdn-hub__get_project_manifest
---

# grilling — ask until nothing is left assumed

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

Interview the person until you both mean the same thing. Every decision opens onto the decisions
that hang off it — picking "one form per delivery" decides what a row is, which decides what the
export contains, which decides whether yesterday's rows can be edited.

Work in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the
questions you can ask *now* without guessing at answers you have not heard yet. Ask the whole
frontier in one round, then wait.

## Ask with the picker, not with prose

**Every question goes through the picker your harness gives you** — `AskUserQuestion` on Claude Code,
`request_user_input` on Codex. The person clicks an answer instead of writing an essay, and you get an
answer you cannot misread. Whichever of the two is in your tool list is the one to call.

1. **2–3 answers per question**, each a real option, not a placeholder.
2. **Your pick goes first**, with `(Recommended)` on the end of its label.
3. **One short line per option** saying what it costs or unlocks. Plain words, their words.
4. **Never write an "Other" option** — the picker already adds one for free text.
5. **Ask them yourself.** Never hand the asking to a sub-agent; that is where answers get lost.

A round is **up to 3 questions per picker call**, so a frontier of 8 is three calls back to back — not
one question per turn, and not a wall of text. That is safe: frontier questions never depend on each
other, so nothing in call 2 is waiting on call 1.

No picker in your tool list? Only then ask in chat. This is the fallback, not a style choice — keep
the same shape, numbered, choices named, your pick stated:

```
❓ **Q1** — **<short title>**: <the question, in plain words; offer choices where there are choices>

➡️ <what you would pick, and why in one line>
```

Every answer reshapes the tree: settled decisions push the frontier outward and unblock questions
that depended on them. Recompute and ask the next round. A question whose answer depends on another
question still open **in this round** belongs to a later round.

Done when the frontier is empty. Do not start building until the person confirms you both landed in
the same place.

## Facts are your job, never theirs

If a question needs a fact you could look up — what the project already has, what the spec already
says, what the live app does today — go and get it. Never make someone answer a question you could
have answered yourself.

```
get_project_manifest        # database, storage, cron, realtime — what already exists
```

Read `SPEC.md` and any `PLAN.md` before round 1. Do not block on a lookup: only the questions
downstream of it wait, so ask the rest of the frontier now.

The **decisions** are theirs. Put each one to them and wait.

## Ask in their words, not ours

The person you are grilling runs the business the app is for. They know "a delivery went wrong";
they do not know "a row in the exceptions table". Use their vocabulary, and when the spec uses a
different word for the same thing, that mismatch **is** a frontier question — ask which one is right
and then use only that one.

If a question cannot be asked without a technical term, raise it until it can: "should yesterday's
entries still be editable?" beats anything with the word *mutable* in it.

## Where this sits in the gb chain

| When | What grilling is for |
|---|---|
| Before `/fdn:ideate` | The idea is one sentence and five decisions are hiding inside it. |
| On an existing `SPEC.md` | The spec says *what screens*, not *what happens when two people submit at once*. |
| Before `/fdn:plan` | The plan is about to fix an order of work on top of a decision nobody made. |
| Mid-`/fdn:build`, direction keeps moving | Each change of mind is an unasked question surfacing late. Stop and ask them all. |
| Before `/fdn:harden` | A version about to ship on assumptions nobody said out loud. |

It is **not** a review. `/fdn:harden` attacks the artefact — is this version correct, safe, shippable?
Grilling attacks the unknowns only the person owns — is this the thing you actually want, and did
you mean X or Y?

A question the codebase can answer is not a grilling question. A question that could be answered
"yes, that is what I want" is not one either — they already decided. What is left is the real
frontier.

## Writing the answers back

Apply answers at the end of each round, section by section — edit `SPEC.md`, do not re-write it
whole:

1. **Goal** — sharpened wording, once you know what it is really for.
2. **Screens / routes** — a screen that turned out to be two, or one nobody needs.
3. **Data model (sketch)** — what a row is, and what makes two rows the same row.
4. **API (/api/\*)** — anything the answers just added or removed.
5. **Notes / integrations** — the constraint they mentioned in passing that changes a step.

A decision that was genuinely hard to reverse gets recorded rather than absorbed — that is what
`/fdn:grill-with-docs` does as it goes, and what `/fdn:harden` §9 does at the end.

## Anti-patterns

- **Asking the whole tree at once.** Questions downstream of an unanswered one are guesses wearing a
  question mark.
- **One question per turn.** The opposite failure. The frontier is usually 3–8 wide; drip-feeding
  makes them do the scheduling. Fill the picker calls.
- **Typing the question out while the picker sits unused.** They get homework, you get an answer you
  have to interpret. Prose is for harnesses with no picker, nothing else.
- **A question with no recommendation.** The first option is your pick, marked `(Recommended)`. No
  lean means you have not done the looking-up yet.
- **Asking them a fact.** "Does this project have a database?" is a tool call, not a question.
- **Re-litigating a decision they already made.** Sharpen *how*, never argue *whether*.
- **Stopping early.** "That's probably enough" is exactly how the silent assumption gets in.

---
name: grill-me
description: A relentless interview to sharpen an app idea, a spec, or a decision before anything gets built.
origin: "mattpocock/skills (productivity/grill-me) — adapted for the /fdn: app chain"
argument-hint: "[what to grill — an idea, a SPEC.md path, or a decision]"
disable-model-invocation: true
allowed-tools: Read, Edit, Grep, Glob, Skill, AskUserQuestion
---

Run a `/fdn:grilling` session on $ARGUMENTS.

Ask through the picker your harness gives you — `AskUserQuestion` on Claude Code, `request_user_input`
on Codex — 2–3 answers per question, your pick first and marked `(Recommended)`, asked by you and not
by a sub-agent. Typing questions out in chat is the fallback for harnesses with no picker, never the
default.

If the target is a project folder or a `SPEC.md`, read the spec first and seed the questions from
what it leaves open — the Goal, the screens it names without saying what happens on them, and the
data model sketch. Write the answers back into `SPEC.md` per the contract in `/fdn:grilling`.

If there is no spec yet, that is the normal case: grill the idea, then hand the settled version to
`/fdn:ideate`.

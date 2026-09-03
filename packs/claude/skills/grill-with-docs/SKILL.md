---
name: grill-with-docs
description: A relentless interview to sharpen an app idea or spec, which also writes the decisions down as it goes — so the reasoning survives the conversation instead of being reconstructed later.
origin: "mattpocock/skills (engineering/grill-with-docs) — adapted for the /fdn: app chain"
argument-hint: "[what to grill — an idea, a SPEC.md path, or a decision]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Skill, AskUserQuestion
---

Run a `/fdn:grilling` session on $ARGUMENTS, and record as you go rather than at the end.

Ask through the picker your harness gives you — `AskUserQuestion` on Claude Code, `request_user_input`
on Codex — 2–3 answers per question, your pick first and marked `(Recommended)`, asked by you and not
by a sub-agent. Typing questions out in chat is the fallback for harnesses with no picker, never the
default. **Offering an ADR is a question too**: put it in the picker (write it / skip it), do not
narrate the offer and hope for a reply.

**A decision that is hard to reverse gets an ADR the moment it is made** — a short note under
`docs/decisions/NNN-slug.md`, numbered incrementally, in the same four parts `/fdn:harden` §9 uses:
the situation that forced a choice, what was chosen, what was rejected and why, and what it makes
easy or hard afterwards. Write it while the reasoning is still in the room. Reconstructed a week
later, the *rejected* options are the part that is always missing, and they are the part that stops
the same debate happening twice.

**A word the interview pins down goes into `SPEC.md` immediately**, in the sense the person actually
uses it. If they say "delivery" to mean the whole day's run and the spec uses it to mean one drop,
fix the spec in that round — not later.

Three tests, all of which must hold, before a decision earns an ADR:

1. Hard to reverse once built.
2. Surprising to someone who was not in this conversation.
3. The result of a real trade-off, not the only option available.

Routine choices do not get one. A folder of ADRs about naming a button is a folder nobody reads.

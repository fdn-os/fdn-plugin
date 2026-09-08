---
name: plan-and-build
description: "Universal builder for any artifact (a skill, code, a document, or a design). Use this skill to build a new artifact or to update an existing one. Designed for non-technical users, built via a guided process through three stages. Invoke with zero accompanying text — no preamble before or beside the Skill call; the welcome banner is the first painted output once the skill loads."
---

# /plan-and-build

**Version:** 5.8.8

Welcome prints `{version}` from that line. Do not Read a version file before first paint.

## Open (first paint)

The welcome is first **because** it reassures the skill loaded and orients the user. Late or missing welcome is a trust failure.

**No tools before the welcome.** The first characters of a fresh open are the opening `═` below. Do not Read, Shell, or call any other tool until that banner has been emitted. `surfaces/welcome.txt` is the same bytes; you already have them here.

Resume uses `surfaces/resume.txt` the same way (first characters are its `═`; no tools before it).

**Skill-tool loads: same zero-preamble rule, one message later.** When this skill arrives via a Skill tool call (a prose invocation rather than a typed `/plan-and-build`), the calling message carries no text at all — no orienting sentence, nothing beside the call. The welcome is then the first characters of the message after the skill content returns. The Skill call that loads this file is the one permitted pre-welcome tool use.

No preamble, no “I’ll read the skill” narration, no code fence around the banner. First characters are the welcome. Then load `modules/align.md`. Discover first. The first spoken Align turn is one grill question. Do not paint a Brief. Do not write the aligned scope and outcomes in this message. Do not paint accept or shipped.

In every message, name those asks the aligned scope and outcomes or the plan. Do not give them any other name.

```
════════════════════════════════════════════════════════════════
                      PLAN-AND-BUILD {version}
════════════════════════════════════════════════════════════════

A universal builder for any artifact (a skill, code, a document, or a design). Use this skill to build a new artifact or to update an existing one. Designed for non-technical users, built via a guided process through these three stages:

● 1. Align — Guided interview to align on the scope and outcomes of this build run

○ 2. Plan — Generation of detailed build plan based on the aligned scope and outcomes

○ 3. Build — Autonomous building and testing

Alignment starts here.

════════════════════════════════════════════════════════════════
```

Fill `{version}` from the **Version:** line above. The first paint names no model. Seats still Read `~/.claude/references/model-routing.md` before a check launch. Do not speak a window model rec. Do not copy that file's matrix into this skill.

After filling a banner title, pad that filled word or phrase in the 64-character box: leading spaces = (64 − length) // 2.

Put a **blank line between each stage row**. Then talk. No second Align welcome. No module footer. No `·`. There is no `interview.md` or `design.md`. Align is the interview. Load only `modules/align.md`.

## Three cores

This skill exists for these three. Modules are how. Skipping one is skipping the skill.

**1. Align is a deep one-question interview, then a challenged aligned scope and outcomes, until there are no open questions.**  
One question per turn. Recommend. Wait. Paint the two labels in bold, each ending with a colon: `**❓ Question N — <title>:**` then `**💡 Recommendation:**`. Body follows the colon. No blank line after the label. Question 1 may ask them to name the work. A turn with no proposed answer needs no nod-check. Whenever the recommendation is a proposed answer they can confirm, including on Question 1, the turn ends with one short check they can nod to. Rotate the wording; never the same check two turns in a row; never "Does that make sense?" Speak as to a capable adult: understandable first, concise second, never patronizing. Make the Question decidable from the page. Not every question has a concrete case; do not invent one. If they do not understand, reframe the same question more clearly. A single question may be an A/B (Matt: choices live inside one question). Never two questions. Never a compound "to reduce load." Facts you can read are this agent's job. Decisions wait. Depth is many turns, not a longer message. No question cap. The grill is done when the frontier is empty, then the four-lens challenge, then the person confirms the shown four-part aligned scope and outcomes: Goal, User journeys, What we will do, What we will not do; short `ad-approve`, bullets, bold, key points. journeys are synthesized from the grill in their words, numbered, Primary marked. A missing load-bearing journey is the next one-question grill, never auto-patched. Every admitted finding, and every new open question that challenge hits, is the next one-question grill. Repeat until no admitted load-bearing reds remain. Taste and completeness that are not in this run become **What we will not do** after that grill ("we will not do this now"). They do not hang as "saved for later." Do not nest `/grill-me`. Do not write `CONTEXT.md`. Method stolen from Matt Pocock `grilling` and `/to-spec`; not nested.

**2. Aligned scope and outcomes and the plan both take the four-lens challenge.**  
Named in the launch, this order: stress-test, Guided Emergence, Musk algorithm, coherence. First challenge of the stage: whole artifact. Later challenges: those four lenses on prior ids and the changed bytes only. Do not skip because the work is a change, a delta, existing, or short.

**3. Plan and Build are the two until-green loops, with anti-spiral built in.**  
Plan (`/to-tickets` method, extracted, not nested): this session writes the plan; one isolated four-lens challenge; Admit; repair that set; a later challenge only if something was admitted; then Build starts in the same turn, no plan-approve nod. Build (`/implement` then `/code-review` methods, extracted, not nested): this session lands the slices; a different isolated seat checks Spec (the sealed aligned scope and outcomes) and Standards (how this kind of artifact is built); Admit; repair; until both green. Stops that show the person, same shape on both: stall, cap 8, a sealed-section change. The person does not start each repair, re-challenge, or accept. Taste does not admit. Never improve a green row. Parked-only is green on these two loops. Later rounds do not restart a whole-artifact audit. Cap 8 is a backstop, not a target. Exit as soon as remaining load-bearing reds are empty. Do not paint `acceptance-blocked` while reds are still a repairable set. After both Build greens, stop authoring; a later product ask reopens Align or Plan. Live only when a journey cannot be proved from files, named checks, and this run.

## Spine

Follow the three stages **because** the user expects Align → Plan → Build. Deviating without asking erodes trust.

After the welcome, load `modules/align.md`. Plan and Build each load their own file in `modules/` when that stage starts. After painting `ad-approve`, this turn ends. Plan green does not end a turn: Build starts in it.

No module runtime.

### Seats

Single home of the seat rule. The modules point here; nothing restates it.

- **Challenger** and **verifier** are always isolated headless instances. Align and Plan are written in this session. Build is landed in this session. There is no required isolated planner or executor hop. The window does not fill a check seat.
- Before launching a check seat, Read `~/.claude/references/model-routing.md` — that deployed path only, never a second unpublished copy — and walk the list that file names for that seat. Never copy its matrix into this skill. Never vendor model ids here.
- Launch the winning row with this harness's native isolated agent only if it can hold that row's exact model, effort, and fast flag; otherwise use that row's logged-in CLI.
- A missing file or a broken symlink is a failed Read. On a failed Read: launch a fresh headless instance on this host's strongest available reasoning model at its highest effort, fast on if that launcher uses it, and disclose. If no fresh headless model can launch, disclose and stop. Never move the seat into the window.
- Challenger and verifier skip the author model on first pass, as the routing file says. Re-challenge and re-accept are always new instances, never continued or resumed.
- Every seat launch gets one spoken line — seat, row, any skip; or seat, file unreadable, model launched — and no new banner.
- Challenge-findings and the accept record (`records/acceptance/current.md`) open with `serving_model=` as the first body line after frontmatter. Plan and land records do not.
- A messaged or continued prior teammate is never a seat instance. On Claude Code, `SendMessage` to an existing agent is a resume. A seat is a new isolated launch of the winning row.
- After a seat launch, completion is a findings write whose time is after that launch. The conductor does not treat a pre-launch file as done.
- A later challenge launch receives the prior ids in its prompt, then overwrites the same findings path.
- `serving_model=` is the seat's reported name, not proof the seat was fresh or that every pin held.
- If a list is exhausted, disclose and stop. Do not invent a row. The failed-Read seat is a rule of its own, never a substitute row.

### Challenge-convergence law

Single home of the challenge-convergence law. The modules point here; nothing restates it.

The first challenge of a stage runs the four lenses on the whole artifact, in this order: stress-test, Guided Emergence, Musk algorithm, coherence. Align's first challenge is that pass on the four-part packet. Plan's first challenge is that pass on the plan. Do not skip either because the work is a change, a delta, existing, or short. Each must-fix has a stable id, the sealed key or journey it breaks, evidence, and why it blocks ship. Load-bearing includes falsehood, a missing key (a journey is a key), a will/will-not contradiction, an uncheckable will-do, safety, data-loss, and a failing acceptance journey. Taste, completeness, and "a better version" do not admit.

Every later challenge is a new isolated launch that receives the prior ids and the repair/change set, inspects only those ids and the changed bytes through the same four lenses, and does not restart a whole-artifact audit. A new key may be named only if hit while closing a prior id or checking that change set, and is not auto-admitted.

**Align:** do not auto-repair. The first Align talk is one grill question even after an already-decided file. Admitted must-fixes become the next one-question grill. After they answer, patch the aligned scope and outcomes, then a new challenger. A new key on the change set becomes the next grill, not a seal. Taste or completeness that is not this run becomes a grill into **What we will not do** ("we will not do this now"), then a new challenger. Keep going only while admitted items are closing or those questions are being asked. Stall: an admitted id still unanswered. Reopen: the packet is the wrong run. Align has no repair-round budget and no question cap.

**Plan and Build:** keep going alone while admitted items are closing. Stop and show the person only on stall (an admitted id still red after its repair), cap 8, or a sealed-section change (a repair or ask that would add, delete, or reword Goal, a journey, will-do, or will-not). A within-contract decision the packet left unsettled, or omitted coverage of an unchanged sealed commitment, is Admit and repair inside Plan, not a user stop. A path-only regression is Admit and repair, not a user stop. Build's reopen of Plan for path, checklist, or environment is path-only and autonomous; this session repairs the plan; because something was admitted, one later challenge on that set; Plan returns to Build without a nod. A later Plan challenge only if something was admitted. Plan and Build cap the repair budget at 8. After both Build greens, a later ask that changes Goal, a journey, will-do, or will-not reopens Align. A later ask that changes path, checklist, or environment reopens Plan. Do not keep building as a free-form session.

Use the existing challenge Result values. Put new-key or stall detail in the must-fix lines. Do not restart a whole-artifact audit as a new round.

### One sealed outcome

Do not modify or publish this skill while it is conducting something else. A second purpose (another product, or this skill itself) is a new `/plan-and-build`. If the person asks mid-run, say so and let them choose. One product may still produce code, docs, and records.

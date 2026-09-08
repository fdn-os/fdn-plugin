# Align guide

Judgment, not a script. There is no Brief user gate and no Brief format. This stage **is the interview** of this build run. Core 1 in SKILL.md is the law. Load `formats/alignment.md` when it is time to write, not to start.

The artifact's own long-lived design UI is out of scope. Do not invent that surface.

Do not nest another skill. Grill lives here. Method stolen from Matt Pocock `/grill-me` / `grilling` and `/to-spec` (extracted, not nested). One question per turn is this skill's override of Matt's whole-frontier round. His other defaults stand: facts vs decisions, recommend, wait, no question cap, empty frontier then confirm. Do not write `CONTEXT.md`.

## Already-decided file

Before discovery: if the user pointed at an **already-decided file** (a file they named as already decided), do not rediscover the standing why. Why: rediscovery writes new requirements and undoes a settled teardown. Read that file. Fold what it settled into the four parts (Goal, User journeys, What we will do, What we will not do). Point at the file. **Still grill every branch that file left open.** The first Align talk is still one grill question, even when that file looks complete (confirm the run is still that file, or ask the first unsettled branch). Never show the four parts as the first Align act. There is no Brief format and no `records/brief/`.

A compose, review, transcript, handoff, incident write-up, or "evidence" file is **not** this skip unless they named it as already decided. Read it as fact. It does not empty this run's frontier. It does not let the first Align talk be the four parts.

If that file says this is a different product, run ordinary Align.

If that file is incomplete, or the files it cites have changed, halt and return.

This skip is not a type. Do not detect a special path or schema. Do not paint `brief-approve`.

## Existing work

Before discovery: if they pointed at an existing artifact, folder, or sealed aligned scope and outcomes, or said to change, improve, or fix it, read that artifact and its `records/` before asking. Why: rediscovery rewrites a settled why.

The aligned scope and outcomes are this run. Goal = what will be different when this run is done. User journeys = what they can do once it is done. What we will do = the change. What we will not do = must-not-change.

Do not re-ask the standing why unless they say this is a different product. Then run ordinary Align and say so.

Existing work fills **facts**. It does not settle this run's Goal, journeys, will-do, or will-not. After the read, the first Align talk is still one grill question, never the four-part packet.

If cited files drifted, halt and return.

This is not a type, mode, or extra stage. Bare `/plan-and-build` with no pointer is a new build. Do not ask "new or change?" at every open.

## Grill

This is the interview. Do not start by writing the four parts.

Map this run as a **design tree**: Goal, then journeys, then will-do, then will-not. The **frontier** is every decision whose prerequisites are already settled. Ask **one question** from that frontier. Then wait.

Paint both labels every time, **in bold**, each ending with a colon. `Question` is what they are deciding. `Recommendation` is this agent's suggested answer, not the next step. Do not use a lone ➡️. No blank line after the label. The body follows the colon on the same line (markdown will not show a single newline).

Question 1 may ask them to name the work. A turn with no proposed answer needs no nod-check. Whenever the recommendation is a proposed answer they can confirm, including on Question 1, the turn ends with one short check they can nod to. Rotate the wording so it does not go stale. Never the same check two turns in a row. Never "Does that make sense?" Illustrations, not a script: "Do you agree?" / "That one?" / "Stay with that, or change it?" / "Does that match what you want?"

```
**❓ Question 1 — <title>:** <body. A single A/B (or named choices) is allowed here. Never a second question.>

**💡 Recommendation:** <your recommended answer>

<one short check>
```

Speak as to a capable adult. **Understandable first. Concise second.** They should be able to decide from what is on the page. Non-technical does not mean thinner.

Make the Question decidable. Use whatever fits this decision, not a required shape: a contrast (today vs this run), a named choice, one line that says what a word means, or an example when one exists. Not every question has a concrete case. Do not invent one. Do not strip the meaning to sound simple.

Do not swap a precise name for a vaguer one. Translate once, then use the short name.

Concise means no skill-preamble. Short sentences. Ordinary words. Their words.

Do not talk down. Do not make them feel small or dumb. Do not say "in simple terms," "don't worry," "as you may know," "let me explain," or "this is easy." Do not quiz. Do not praise them for understanding.

If they say they do not understand: reframe the **same question** more clearly. An example is one way, not the only way. A contrast, a definition, or the two options in their words also work. Do not invent a new branch.

A question that depends on an unanswered question belongs to a later turn. Their answer reshapes the tree. Recompute the frontier. Ask the next one question. Cover the four quadrants while you walk:

| Quadrant | Meaning |
|---|---|
| Known knowns | What they can state |
| Known unknowns | What they know is open |
| Unknown knowns | True but unsaid until surfaced |
| Unknown unknowns | Not yet seen; probe, research, or reaction |

Facts (the artifact, its `records/`, the repo, a compose, research) are this agent's job. Do not ask them. When a frontier question needs a fact, look it up. Decisions are the user's. Do not answer a decision and then show the aligned scope and outcomes. A load-bearing fact you asked is not settled by a later "yes" on the aligned scope and outcomes. If they did not answer it, do not record an answer. A nod is not "you decide." Delegation must be explicit. Facts about their work cannot be delegated. A nod on a fact you actually showed (a choice, a sample, a one-line picture) is an answer. A nod on the recommendation or on the check is an answer to that question.

Never two questions in one turn. Never a "compound choice to reduce load" that is two questions. One A/B is still one question.

Ungrillable (look, feel, layout): stop talking. Paint a throwaway. Let them react.

If they will not give a usable answer after one question, one sample or choice, and one reframe: name **one** blocker in a single sentence, then this turn ends. Do not invent the fact. Do not ask a new question. The next turn repeats only that blocker until they answer it, or they say stop.

Research is a tool for unknown unknowns, not a required open gate. If you use it, name it.

**First Align talk** after the welcome (and after reading existing work or a Brief, if any) is one grill question. Never the four-part packet. Never "here is the aligned scope and outcomes, is this aligned?" as the first Align act. "Let's go" on a records-home or product-pointer is not a nod on the four parts and is not a Brief.

No question cap (Matt). The grill is done when the frontier for this run is empty: every load-bearing branch visited, nothing left silently assumed. Then write and challenge. Show the four parts **once**, after challenge is Ready to approve. Not before. They may say stop. That is the human brake. Do not invent a wrap-up of your own.

## Write, challenge, then show

The burden is on this agent. After the frontier is empty, write the four parts (Goal, User journeys, What we will do, What we will not do) in their words. The journeys are a **synthesis** of the grill in their words (`when you …, you can …`), numbered, Primary marked, not plan steps. Not a heading dump. Not this skill's stages. Then launch the four-lens challenge. Do not paint `ad-approve` before Ready to approve.

When challenge is **Ready to approve**, paint `surfaces/challenge.txt` then `surfaces/ad-approve.txt` in the same turn: short bullets, bold on the words that matter, key points, not a dump. Same four parts. Same journeys. Then this turn ends. One check: **is this aligned, or do they need it explained further?**

- Aligned (yes, ok, looks right, a nod): that is enough. Do not ask them to say it back. Plan starts only after a later message answers the aligned scope and outcomes.
- Need more, or they correct it: revise, later-ids challenge, then show the new picture. Do not quiz.

A nod before they have been shown is not the check. If Goal, User journeys, will-do, or will-not changes after they aligned, challenge the change set, then show the new picture and check again. A trim they already named is not that. Do not print the same packet before and after a clean challenge.

There is no "saved for later" on this seal. Anything not in this run is **What we will not do**, after a grill that it is "we will not do this now."

## Scribe

Patch `records/alignment/current.md` as the four parts settle. Rewrite it at the write juncture. Do not keep a parallel Brief or turn log. Do not paint `brief-approve`. Never overwrite a dated sealed file: first bind that day is `sealed/YYYY-MM-DD.md`; if taken, `YYYY-MM-DD-2.md`, then `-3`.

## Records

After the welcome, **not before**, Read `~/.claude/references/system-of-records.md`.

If that file is missing, or its **Version** is older than **v1.5**, create or update it to v1.5 at the fdn-os-config single home (`.claude/references/system-of-records.md`) and point the workstation path at it. Then Read it again. Do not copy that file into this skill.

Name the Version you read in the aligned scope and outcomes. New work creates only the shape that Version requires. Existing `records/` (and `tests/` / `evals/` if that Version says they belong) migrates in this engagement. A migrate that would change a sealed plan → reopen Plan. If the live Version is newer than v1.5, use it (do not downgrade).

## Frameworks (apply, do not re-author)

While shaping the four parts:

- **Guided Emergence** (`~/.claude/references/guided-emergence.md`): when adding a rule the next model will still have to obey, put it where it belongs. A crutch gets a why-line.
- **Musk** (`~/.claude/references/musk-algorithm.md`): question, delete, simplify. Do not add a second system.

Point at those canon files. Do not copy them into this skill.

## Challenge loop

Independent challenge is the **challenger seat** — launch it as the Spine in SKILL.md says. You are not that seat. **Do not skip this seat.** Existing work, a delta, a short packet, a compose, and "they already aligned" are not reasons to skip.

The first Align challenge runs **four lenses on the whole four-part packet**, in this order, named in the launch:

1. Stress-test
2. Guided Emergence
3. Musk algorithm
4. Coherence — whether the whole thing holds together

Give the seat the four parts and the artifact. It writes only `records/alignment/challenge-findings.md`.

After launch, wait until that launch's findings write lands, a write after launch time per the Spine, or a short timeout.

Admit using the Spine. Taste, completeness, and "a better design" do not admit as must-fix. They are still open until grilled into **What we will not do**.

A journey is a key. A missing load-bearing journey is the next one-question grill; never auto-patch a journey.

- **Ready to approve:** no admitted must-fix, and nothing left hanging as "saved for later." Paint `surfaces/challenge.txt` (opener: Independent review of the aligned scope and outcomes.) then the short `ad-approve`. Then this turn ends. A nod on the banner is enough. Plan starts only after a later message answers the aligned scope and outcomes.
- **Fix-first:** do not paint `ad-approve`. Do not auto-repair. Do not decide remaining branches. Paint `surfaces/challenge.txt`. Each admitted must-fix is the next one-question grill. Each parked taste/completeness line is the next one-question grill: is this **we will not do this now** (write it into What we will not do) or is it in this run (write it into What we will do, still open). After they answer, patch the four parts, then a new four-lens challenger on prior ids and the changed bytes. Repeat until no open questions remain, or they say stop.
- **Reopen:** the packet is the wrong run. Say so. Grill again from the break.
- A new key hit on the change set is the next grill, not a seal.

Align has no repair-round budget, no auto-repair, and no question cap. The person is in the loop.

They approve the four parts and the approve banner.

Why this recipe exists (dose 2026-09-07): 5.8.0 Clerk Can test (session `9bdb2242`) treated a review compose plus existing `records/` as already-decided and showed the packet as the first Align act. The interview never ran. The four-lens challenge never launched. Delete the recipe when Align already grills this run's frontier one question at a time before showing the packet, always runs the four-lens challenge, and grills every leftover into will-do or will-not. One question, show-not-ask, and "a nod on a shown picture is enough" stay.

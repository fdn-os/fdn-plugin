# Plan guide

This session writes `records/plan/current.md` from the sealed four-part aligned scope and outcomes, `formats/detailed-plan.md`, the Must include list below, and the SoR Version. Do not launch an isolated planner. The isolated **challenger** still reviews the plan as the Spine in SKILL.md says.

Derive only from the four parts. Synthesize; do not interview again. A fact the plan needs is read. A decision the sealed packet does not settle but does not change (slice boundaries, blocker order, done-check shape, which file carries a commitment) is a within-contract implementation decision: this session makes it, under Admit, without the person. Only a proposed change to a sealed part (Goal, a journey, will-do, will-not) stops and shows the person. Do not pin a tool, host, file format, or tracker the four parts did not name. If they say "spreadsheet," the plan names a spreadsheet, not Sheets or Excel, unless they already named one. No ticket board or TDD loop unless a journey named it. Do not invent git-diff as the only proof, Fowler smells, or auto-commit unless this run named them. Those exclusions apply when choosing done-checks, not only at accept.

The path is vertical slices with blockers (`/to-tickets` method, extracted, not nested). Each node has an outcome, a blocked-by, and a done-check; is demoable on its own; is sized for this session to land; each names the checklist rows it evidences. Not a layer cake.

## Apply frameworks

Use Guided Emergence and Musk while detailing. Classify new plan structure as OA, scaffold, or guardrail. A scaffold needs a dated premise, a removal seam, and a post-shed add-back tripwire. Delete mirrors of the aligned scope and outcomes. The plan is the path, not a second design.

## Must include

Builder context with the four parts, the artifact. Checkable build path. Checklist covering the four parts. Acceptance journeys = the sealed User journeys, Primary marked. Deploy-like environment. How build runs: copy the Loop till green bullets from `modules/build.md` into section 6, unshortened. Challenge record. Parked list.

When the work is a change to an existing artifact: the path, checklist, and journeys cover what changed and what must still work. Untouched will-not rows may cite the standing thing; the primary journey is Live only when it cannot be proved from files, named checks, and this run; Live is for something the person must click, read, or use.

## Gate

Independent challenge is the **challenger seat** — launch it as the Spine in SKILL.md says. Name the four lenses in the launch, this order: stress-test, Guided Emergence, Musk algorithm, coherence. First challenge: those four on the whole plan. Later loops: those four on prior ids and the repair bytes only. It writes only `records/plan/challenge-findings.md`; the conductor, not the challenger, updates the plan's challenge-record section. Wait until that launch's findings write lands, a write after launch time per the Spine, or a short timeout.

Then run the loop till green. That first challenge is loop 1. Do not launch it again. Do not stop for a person on fix-first.

## Loop till green

- Frozen: the sealed aligned scope and outcomes. No new Goal, will-do, or will-not. Parked stays parked.
- **Admit:** the conductor admits the repair set from the findings, using the Spine. Taste, completeness, and "a better plan" do not admit, even if the findings file labeled them must-fix. Never improve a green row. Speak one Admit line (admitted ids, parked ids). If admission leaves no load-bearing red, that is ready to approve. Do not launch another challenger.
- **One loop** = one challenge of the current plan, then repair of **every** admitted must-fix (the repair set). Repair writes only the bytes that close that set. If an admitted id is a missing Must-include piece (a node, checklist row, or journey the sealed aligned scope and outcomes or Must include already required), adding that one piece is the repair, not extra. Extra means anything not in the admitted set. This session writes the repair (overwrites `records/plan/current.md`). Then a new challenger **only if something was admitted**. The first challenge is loop 1. Cap **8** is a backstop, not a target. Exit as soon as remaining load-bearing reds are empty. A later challenge only if something was admitted.
- **Ready:** challenge result is ready to approve, or the latest admitted set is empty (parked-only included) → paint `surfaces/challenge.txt` with opener `Independent review of the plan.` and Result **Ready. Build starts.**; seal (copy `current.md` to `sealed/YYYY-MM-DD.md` if that path is free, else `YYYY-MM-DD-2.md`, then `-3`; never overwrite); paint `surfaces/stage-transition.txt` for BUILD; load `modules/build.md`; **Build starts in this turn. No plan-approve nod**. On Plan the challenge Result value "Ready to approve" means green (existing Result values stay, per the SKILL.md law).
- **Stall:** an admitted must-fix still red after its repair → stop, named reds, shown to the person. Paint `surfaces/challenge.txt`.
- **Sealed-section change:** a repair that would add, delete, or reword Goal, a journey, will-do, or will-not → stop and show the person. Paint `surfaces/challenge.txt`. A sealed-section change is a proposed change to a sealed part. **Not a sealed-section change:** a within-contract decision the packet left unsettled, or a challenge finding that the plan omitted coverage of an unchanged sealed commitment (a missing row, node, or file for a key that already stands) → Admit, this session repairs inside Plan, no user; it does not show the person merely because it was previously undecided or unnoticed.
- **Path-only regression:** something green in the path went red → Admit, this session repairs, keep looping, no user; still red after that repair → stall.
- **Shrink:** the red set is smaller and no green turned red → keep going. No user. If the repair closed the set and the next challenge adds no load-bearing red, that is ready to approve.
- Hit 8 still red → stop, named reds, shown to the person. Paint `surfaces/challenge.txt`.
- Later challenges inspect only prior ids and the repair bytes, not a fresh whole-plan audit. This loop's 8 is the repair budget.
- Mid-loop talk: loop `n` of 8, which ids are red, what was just repaired. Terminals only: **green, Build starts**; **stalled** (named reds); **show the person** (sealed-section change).

Dose dated 2026-08-31. Same cap shape as Build. Build starts when this loop is green, in the same turn, with no later message. After Build starts, an ask that changes Goal, a journey, will-do, or will-not is reopen Align; an ask that changes path, checklist, or environment is a path-only reopen of Plan, still without a nod.

When the person asks to see the plan, show section 2 in their words (node, outcome, done-check) and where acceptance runs. A view, not a gate. The loop does not wait.

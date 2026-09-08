# Build guide

The sealed Detailed Plan is the only instruction. It is the **path**, not a harness (a harness is a program around the model). Not a second conductor or test lab.

## Run

Build starts when the Plan loop is green, in that same turn. There is no plan-approve nod and no later user message.

This session lands the slices (`/implement` method, extracted, not nested). Do not launch an isolated executor. The conductor paints loop status and also writes the files. A different isolated seat still does the Spec/Standards check.

Walk the plan’s steps in the open. That is the Build path, not an essay.

For each step: name, status, done-check, pointer to named evidence. Full logs stay in `records/`.

A step is not done until its done-check is true. Record evidence for checklist rows **the plan assigned to that step**. Do not invent a row-to-step map. Missing done-check or mapping → reopen Plan.

Honor stated dependencies (usually: make the thing, then land, then accept). Order among independent steps is judgment.

Work where the plan names. Land only as the plan names. Keep a restore point when the plan says to. Do not assume a live skill or a symlink.

Do not invent a second environment, host kit, or `tools/` tree. Build may run checks the plan named. Acceptance must use the deploy-like environment the plan named.

Illustrations, not law (the plan always wins): a skill is usually a real `/name` on each host the plan named; a web app is usually the running app at the URL the plan named; a doc is usually the reader surface the plan named.

## Repair

When a step fails, fix **that** step. No new scope, banners, stages, or engines.

Judgment may change *how* the step is fulfilled inside the sealed contract. A change to path, dependencies, done-check, checklist, or environment → reopen Plan, path-only, no nod. A change that would alter Goal, a journey, will-do, or will-not → stop and show the person.

If a node will not converge, reopen Plan.

If the plan assigns the Spec/Standards check to the same session that landed the files, that conflicts with K-ACCEPT: reopen. Do not follow it. The conductor launches the check seat. This session is never that seat.

If the plan’s acceptance environment is missing or wrong, reopen Plan. If that place is only temporarily down, block. Do not substitute a thinner place and call it green.

## Loop till green

After land, do not stop for a person. Fix and loop until the builder evaluation **and** independent accept are both green, or the loop stops. These bullets are the operational source (paste from the sealed plan; do not shorten):

- Frozen checklist: section 3. No new rows.
- **Admit:** the conductor admits the repair set from the builder eval or independent accept, using the Spine. Taste and "a nicer version" do not admit, even if that record labeled them must-fix. Never improve a green row. Speak one Admit line (admitted ids, parked ids). If admission leaves no load-bearing red, that is green. Do not open another loop.
- **One loop** = one Spec/Standards check of the current land, then repair of **every** admitted red (the repair set). Repair writes only the bytes that close that set and re-runs the done-checks it touched. The **first** check after land covers every section 3 row (Live only when a journey cannot be proved from files, named checks, and this run). **Later** checks inspect prior ids and the changed bytes only, never a whole-artifact audit. Cap **8** checks is a backstop, not a target. Exit as soon as remaining load-bearing reds are empty. If the first land evaluation is green, launch the independent Spec/Standards check in the same turn. Do not wait for the user. The first check after land is loop 1.
- **Stall:** an item that was in a repair set and is still red after that repair (builder eval or the next independent accept still names it) → stop, named reds, shown to the person, same shape as Plan. An item is not stalled merely because it was red twice while never repaired.
- **Grow:** after a repair, a sealed item that was green in the eval or accept immediately before that repair is now red → reopen Plan. A first-discovered red (never green in a prior eval or accept of this loop) is not Grow: Admit it, repair it, keep looping. Independent-accept reds that would change Goal, a journey, will-do, or will-not → stop and show the person. Independent-accept reds that change only path, checklist, or environment → reopen Plan (path-only, autonomous); the check count continues. Independent-accept reds that do not change the sealed contract → Admit, repair, keep looping.
- **Shrink:** the red set is smaller and no sealed green turned red → keep going. No user. If the repair closed the set and the next eval or accept adds no load-bearing red, that is green.
- Hit 8 still red → stop, named reds, shown to the person, same shape as Plan.
- Only the primary journey, the sealed checklist, and admitted independent-accept must-fix items may keep the loop going. Parked stays parked. If accept names only parked items, that is green. Do not open another loop for polish.
- Mid-loop talk: loop `n` of 8, which items are red, what was just repaired, whether independent accept is running. Terminals only: **both green**; **stalled** (named reds, shown); **reopen Plan** (path-only); **show the person** (sealed-section change). Do not stop when the builder eval is green. Never a 15-minute reminder.

Dose dated 2026-08-15 (accept in-loop). Parked-only is green, dose 2026-08-31: current models keep looping on taste. Independent accept runs inside the loop. It is a different seat, not a user gate.

## Records adopt

Adopt the system-of-records Version Align named. Create only the shape that Version requires. Migrate existing `records/` (and required `tests/` / `evals/`). A migrate that would change a sealed plan → reopen Plan.

## Independent accept

When the land evaluation is green, independent accept is the **verifier seat** (`/code-review` method, extracted, not nested): Spec (the sealed aligned scope and outcomes) and Standards (how this kind of artifact is built). The conductor chooses it by walking the verifier list as the Spine in SKILL.md says, and launches a fresh seat that did **not** land the files. Stay in this turn until that seat’s record exists (or a short timeout). Do not ask the user to start it. Do not paint `ready.txt`.

That seat receives the four aligned-scope-and-outcomes parts, the artifact, the sealed plan, checklist, evidence pointers, named environment, and primary journey. The first check audits every section 3 row (spot-check land evidence; re-run named checks). A later check receives the prior ids and the change set and inspects only those. Live only when a journey cannot be proved from files, named checks, and this run. It runs safety. When the plan names preserved journeys, it runs those too. It alone writes `records/acceptance/current.md`. A builder-written PASS has no standing. Do not invent TDD, git-diff as the only proof, or Fowler smells unless this run named them. When that run’s check is finished (passed, or a stop), copy to `records/acceptance/sealed/YYYY-MM-DD.md` if free, else `-2`, then `-3`. Never overwrite.

**Accept green:** paint `surfaces/acceptance-passed.txt`. That is the user terminal. It names both the green Build loop and the independent accept. Then this seat stops authoring. Do not paint `shipped.txt` here.

**Accept blocked:** do not paint `acceptance-blocked.txt` and do not stop for the user. The admitted must-fix items become the repair set. Speak one Admit line (admitted ids, parked ids), then this session repairs them. The next Spec/Standards check is a new isolated launch on prior ids and the changed bytes only. A block that would change a sealed part → stop and show the person. A block on path, checklist, or environment → reopen Plan; the check count continues. Optional depth parks.

Paint `acceptance-blocked.txt` only when the loop **stops** (stall, cap 8, or a stop that shows the person). That is the unresolvable roadblock. Painting it while remaining reds are still a repairable set is a skill break. Keep looping. Do not ask the user to start the next repair.

## Close

Paint `surfaces/shipped.txt` only after the user asks to ship, and only after that independent result is green.

After accept green, this seat stops authoring. A later ask that changes Goal, a journey, will-do, or will-not → reopen Align. A later ask that changes path, checklist, or environment → reopen Plan. Taste after green parks. Do not keep building as a free-form session.

Dose 2026-09-07 (fleet 5.7.0): first accept-block was painted and the person was asked to drive (Adelia). After green, sessions chased new product (Donovan UI, Minshan rework). Cap 8 was unused. The live control is Admit + parked-only + this close rule, not a higher cap.

# Guided Emergence

**Home:** fdn-os-config `.claude/references/guided-emergence.md`. Deployed: `~/.claude/references/guided-emergence.md`.

When you are about to add a rule the next model will still have to obey, put it where it belongs. When you next touch that rule, ask whether it should still exist. Most work adds no such rule. Then this file does not apply.

Durable structure must not constrain a stronger model when that model is available and used.

## Placement

The answer is where the thing goes. Do not label the artifact.

- **Guardrail** — a floor. It lives in infrastructure or code. A prompt is not a guardrail.
- **Scaffolding** — a crutch. It lives next to the work, with one line of why the current model fails without it. It never lives in L1.
- **Opinionated Architecture** — a value. It is stated as a principle. Numbers, counts, and recipes stay out of it so they can die separately.

Contribution is the outcome when this is well-calibrated: the work that was asked, finished. Depth that changes the answer or the risk is surfaced, not built.

## Guardrails

Prevent unacceptable outcomes. Permanent, rare, and they cannot be bypassed. Because they constrain the ceiling, each one earns its place.

Three gates. All three must pass.

1. **Severity** — the worst realistic outcome is catastrophic, not inconvenient.
2. **Irreversibility** — retry, rollback, or abort cannot undo it.
3. **Enforcement** — infrastructure or code enforces it.

A prompt-level prohibition may sit beside a floor as defense in depth. It is not the floor.

## Scaffolding

Compensates temporarily for a capability gap.

- **Operational** — steps, criteria, coordination the model cannot yet hold.
- **Defensive** — prompt-level safety. It sounds like a guardrail. It is not one.

Write why next to it: the current model fails this case without the constraint. That line is what lets a later touch delete it. A date field, a ledger, and a taxonomy tag are not required.

If you cannot remove it without breaking things, it has become architecture. Decide whether it should be.

Prefer a check over a prompt crutch. A check re-runs when the model changes. A prompt does not. A green check does not prove the crutch is unnecessary until the crutch is gone and the check still holds.

## Opinionated Architecture

Encodes values that compound with capability. A stronger model does not outgrow it. It expresses it better.

A number, count, or threshold inside it is usually scaffolding. Keep the principle. Put the specific where it can be removed.

Prefer Opinionated Architecture. Use scaffolding only when a principle cannot hold the floor.

## Shed

On touch, question the constraint you came back to. Surface the rest as findings. If the why is gone, or was never real, delete it. A smaller dose still has to earn its place.

Git undoes a cheap cut. Name an add-back condition only when failure would be quiet, costly, or contested.

Always-loaded surfaces (L1, the references it points at, skill descriptions) do not wait for touch. Comb them when a generation changes or when they start to hurt. A stronger model may propose a cut. It does not ratify, and it does not shed a floor.

A dense calcified artifact can take a Musk run. That instrument lives in `musk-algorithm.md`. This file is not that run.

Over-scaffolding has two common roots: no real reason at birth, or a reason that lapsed unshed. A wrong requirement is deleted. It is not re-tested.

# System of Records

**Version:** v1.5 | **Status:** Active | **DRI:** RF | **Date:** 2026-09-07

Per-artifact companions sit beside the work: `records/`, `tests/`, and `evals/`. This file names that map and owns `records/`.

**Home:** fdn-os-config `.claude/references/system-of-records.md`. Deployed: `~/.claude/references/system-of-records.md` (workstation), `<deploy root>/.claude/references/system-of-records.md` (fleet).

L1 says when a decision's why must be kept. `/plan-and-build` says how engagement state stays on disk. This file is the shared how for both, at the artifact.

## Companion map

Three homes beside the artifact. Same names everywhere.

```
<artifact>/
├── records/                   why, sealed aligned scope and outcomes / plan, acceptance, and ledgers
├── tests/                     deterministic proof: run it, pass or fail
└── evals/                     quality proof: judgment, behavior, scenarios
```

Create `tests/` when the first test exists. Create `evals/` when the first eval exists. Do not add empty folders to look complete.

`tests/` follows the language's runner: `test_*.py`, `*.bats`, `test-*.sh`. Do not invent a second ID scheme.

`evals/` uses `E-NNN-<slug>.md`. The number is local to the artifact. A run that needs more than one file is a folder `E-NNN-<slug>/` with the spec and results inside. Existing `E001-` names may stay.

`records/` sits beside the artifact. For a skill, that is next to `SKILL.md`.

If `records/` already exists, read what is there before changing the artifact. It may change the plan. Do not create `records/` just because the artifact is lasting.

Records are secret-free. A withheld span keeps its reason, never its value.

## Two uses

**Engagement.** The aligned scope and outcomes and the plan for this work, plus a decision when one is earned. Independent acceptance is the Build check record. Patch the live file as you go. Rewrite it at the gate (Align confirm, Plan challenge green, or a binding challenge). Transcript comb is recovery only.

**Decision.** A choice that is material, hard to reverse, or contested. Write the why while it is fresh. A small, already understood, reversible edit does not earn one.

**Ledger.** Parked findings about the artifact: known imperfections, and other ledgers only when the work produces them. Create the file when the first entry exists.

Session state and journey state are not this file. They stay with the skill that owns the run, or in git-excluded continuous-mode state.

A file that is only a plan, report, or transcript for a session and is not kept with an artifact does not need a `records/` tree of its own.

## Engagement shape

Folders use the document names in lowercase kebab-case. Each holds a live file and sealed copies only when a gate binds.

```
<work>/records/
├── alignment/                 aligned scope and outcomes
│   ├── current.md
│   ├── sealed/
│   │   └── YYYY-MM-DD.md
│   └── challenge-findings.md  first challenge; overwrite
├── plan/
│   ├── current.md
│   ├── sealed/
│   │   └── YYYY-MM-DD.md
│   └── challenge-findings.md  first challenge; overwrite
├── acceptance/                independent Spec/Standards check
│   ├── current.md             overwrite during the check loop
│   └── sealed/
│       └── YYYY-MM-DD.md      when that run's check is finished (passed, or a stop)
├── decisions/                 only after a material why
│   └── ADR-001-<slug>.md
└── ledgers/                   only after a parked finding
    └── known-imperfections.md
```

Create `alignment/`, `plan/`, and `acceptance/` when that stage first writes. Do not add empty folders to look complete.

Patch `current.md` cheaply. Rewrite it at the gate. Copy to `sealed/` only on approve or a binding challenge, or when an acceptance check is finished.

Never overwrite a dated seal. First bind that day is `YYYY-MM-DD.md`. If that path exists, write `YYYY-MM-DD-2.md`, then `-3`. Existing `brief/`, `aligned-design/`, and `detailed-plan/` may stay until that artifact's next engagement migrates. Those folder names are migrate-from only. Live engagement is aligned scope and outcomes, not Aligned Design. New work does not create `brief/`.

No draft trail. No parallel log. No checkpoint file in this convention.

Do not invent extra folders to look complete. Do not reconstruct from the transcript when disk already has the state.

A lasting skill with no engagement writes a decision only when one is earned. It does not get `alignment/`, `plan/`, or `acceptance/`.

## Decision shape

When a decision write is earned and `records/` is absent, create only:

```
<artifact>/records/
└── decisions/
    └── ADR-NNN-<slug>.md
```

One dated decision per ADR. Frontmatter: id, title, status, date, dri.

Lead with the decision. Keep the argument, evidence, alternatives, costs, and the revisit trigger. Record bodies say "the user", never a personal name. Dated attributions in frontmatter stay.

One decision per file. Supersede by annotation (`status: superseded`, `superseded_by`), never by deletion.

An existing `PURPOSE.md` may stay. Do not create one. The artifact already states what it is.

## Ledger shape

When the first parked finding exists:

```
<artifact>/records/
└── ledgers/
    └── known-imperfections.md
```

Known imperfections use that name. Another ledger kind uses `ledgers/<slug>.md`, created when its first entry exists. Do not add empty ledger files.

## What is not records

Journey progress, seal-machine files, and session recovery are not artifact records. Do not put them in `records/state/`.

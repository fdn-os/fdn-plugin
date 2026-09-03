---
name: harden
description: "The final pass before a Foundational builders app version ships — the plating. Audits correctness against what this version promised, data handling, secret storage, production requirements, performance and maintainability; adds E2E only where a flow genuinely warrants pinning. Then closes the version out: docs written so a later session resumes on solid ground, and every decision taken recorded as an incremental ADR. Use before a release, before promoting a tier, or to close out a version properly."
argument-hint: "[path to the project dir] [--tier internal|public]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, Task, AskUserQuestion, mcp__fdn-hub__get_project_logs
---

# harden — the final plating before it goes out

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

This is the last pass on the dish. The app works; this pass makes the **version** right — correct,
safe, maintainable, documented — and closes it out so the next pass starts from solid ground rather
than from archaeology.

Two halves, both required:

- **Audit** (§1–§7) — is this version fit to leave the kitchen?
- **Close out** (§8–§9) — docs and ADRs, so resuming or extending builds on foundations instead of
  re-deriving them.

Report **PASS / FAIL / NOT-RUN** per gate with the actual figure, line or status code. `NOT-RUN` is a
first-class result: reporting green on a gate you never ran converts an unknown into false confidence.
Findings marked **critical** block release; say so plainly rather than softening a FAIL into a
suggestion.

`--tier public` raises every data-handling, secret and input-validation finding by one severity —
there is no SSO gate in front of it.

## 1. Correctness against what THIS version promised

Read `SPEC.md`, the plan, and any `.fdn/deploys/*.md` snapshot **before** the code. **If none exist, say so as a
finding and name what you used instead** — in order of preference: the previous deployed artefact, the git log for
this version's range, the app's own README, the operator's brief. **If this version re-homes, ports or rewrites
earlier code, diff the built output against the last known-good artefact and report the diff size.** That diff is
the de-facto spec: it is the only thing that distinguishes an intended change from an accident, and it is where
silent regressions — a re-added dependency, a swapped asset, a dropped filter — are cheapest to find. Judge the app
against what it promised, not against what it happens to do — read the implementation first and you
will rationalise its behaviour, bugs included.

Every promised flow works end to end. Every stated non-goal is genuinely absent (scope creep arriving
by accident is a finding). Where code and spec disagree, that disagreement **is** the finding: surface
it and ask which is authoritative rather than quietly picking one.

## 2. Data handling

- **Correct at rest and in flight** — types and units consistent end to end (money in minor units, not
  floats; timestamps with an unambiguous zone). A unit mismatch that currently cancels out is a latent
  data bug, not a working system.
- **Invariants hold** — totals equal the sum of their parts; foreign keys resolve; no orphan rows.
- **Migrations are additive and safe against existing rows.** A column drop, a type narrowing or a
  NOT NULL added without a default is critical: call it out with the affected table.
- **PII and personal data** — know what the app stores, why, and for how long. Nothing personal in
  logs, URLs, query strings or analytics payloads. Where PII must be stored, note whether encryption
  at rest applies and who can read it.
- **Failure is honest** — when the database is unreachable the user sees an actionable error, never an
  empty state that reads as "no data". Silent emptiness is the most expensive data bug to diagnose.
- **Degradation is never silent.** Where the app falls back — a retried query, a dropped optional
  field, a cached or partial upstream response — the response must carry which path was taken, and any
  user-visible output built from degraded data must say so. **A well-formed response containing
  materially wrong data is worse than an error**, because an error prompts a question and confident
  wrong output does not. Trace every fallback branch and ask what a user would print, sign or act on if
  that branch won.
- **Destructive operations** are confirmed, and reversible or explicitly labelled as not.

## 3. Secrets stored correctly (critical)

- Secrets reach a tenant **only** as read-only injected bindings. Never in source, never in a client
  bundle, never in a log line, never in an error message.
- **Grep the built output and the zip**, not just the source. Enumerate exactly which files ship rather
  than trusting a glob — a wildcard sweeping in a runtime key file is the classic form of this failure.
- Anything client-side is public by definition. A key used from the browser is a leaked key, however
  it got there.
- The platform's own leak gate is not evidence you did not ship a secret — only that its patterns did
  not match yours.
- Note any secret that should be rotated because it has been in a log, a screenshot or a PR body.

## 4. Production requirements

- **Tier + auth gate** — the deployed tier matches the intended one. Verify empirically: on an
  SSO-gated host an unauthenticated **302 to Cloudflare Access is the correct, healthy result**; a
  **200 serving app content there is the FAIL**. **Then run a negative control: probe a hostname on the
  same zone that does not exist.** If it also returns 302 — which it will on a wildcard Access app such
  as `*.{zone}` — then 302 proves only that the zone is gated, **not** that your route is live, and route
  liveness is `NOT-RUN`. Never read 404/5xx as "not live" without first confirming the zone
  distinguishes the two. For `public`,
  confirm no admin routes, debug endpoints or internal identifiers are exposed.
- **Authorization, not just authentication** — the gate says who may open the app; say what any one of
  them can then *do*. Name the broadest principal the gate admits and enumerate what they can read,
  overwrite and destroy. Endpoints that mutate shared state or forward credentials are frequently
  unauthenticated *at the application layer* because the gate is assumed — call that out, and say
  whether the assumption survives a tier promotion.
- **Input validation at every boundary** (critical) — every `/api/*` handler validates shape, type and
  range before use; SQL is parameterised (string-concatenated SQL is an automatic FAIL — show the
  line); no unsanitised HTML on a user-data path; errors leak no stack traces, connection strings or
  secret names.
- **Build integrity** — typecheck and build clean; `dist/index.html` at the output root;
  `dist/assets/*.css` **non-empty** (a zero-byte stylesheet means StyleX silently emitted nothing —
  report the byte count); `_worker.js` present if the app serves `/api/*`; `base: "./"`.
- **Observability** — failures are visible to an operator, not only to the user who hit them. Check it
  concretely: **grep every `catch` in the server code.** A bare `catch {}` that discards the error, or a
  handler returning 5xx with no logging call, means that failure leaves no trace anywhere — report the
  file:line. Name the command an operator would actually run to see the error — on Foundational builders that
  command is `get_project_logs(project)`, so name it rather than writing "check the logs" — and say whether it would
  show anything.
- **Provenance** (critical, and check this FIRST) — you can tie the tree you are auditing to the
  artefact that is actually deployed: a commit, a build record, a `.fdn/deploys/` entry, or a
  byte-comparable local bundle. If you cannot, every other gate is a claim about an unknown artefact —
  name it and BLOCK.
- **Rollback** (critical) — an **immutable per-version** URL exists, distinct from the rolling
  pointer, and you tested the version you are auditing. Name the exact revert step and confirm a prior
  good version exists.
- **Accessibility + both themes** — keyboard reachable with a visible focus ring; labels on inputs and
  icon-only controls; light **and** dark verified (say which screens); no overflow at 375px;
  `prefers-reduced-motion` honoured; no layout shift from interactive state. **Verify by driving the
  built output, not by reading the CSS:** dump the actual focus order and confirm every control appears
  in it; assert `documentElement.scrollWidth === clientWidth` at 375px; screenshot each theme. Grepping
  for `:focus-visible` proves a rule exists, not that anything is reachable — a focus ring on an element
  with no `tabIndex` is a dead affordance, and only driving it will tell you.

## 5. Performance

Real figures, never adjectives: initial JS raw + gzip, CSS, largest asset, total, file count. **Then
attribute the initial bundle: bundle the largest suspected dependency alone and report its raw + gzip share.**
"jsPDF is heavy" is an adjective; "jsPDF is 247,893 of the 303,693 gzipped initial bytes, for an action behind a
button click" is a decision. Report the saving a dynamic import would yield, and the one thing blocking it. Deploy
caps are **< 10 MB zipped, < 200 files, < 5 MB per file**.

Look for the shapes that only hurt in production: N+1 queries, unbounded queries with no limit or
pagination, a heavy dependency imported statically that could be dynamic at point of use, work done
per-request that could be cached, and anything that grows with tenant data rather than staying flat.

## 6. Maintainability

The next person is a future session with none of today's context.

- Names say what things are; structure matches the app's domain, not the order it was built in.
- **No dead code from this version's own changes.** Report it with file:line and byte size,
  distinguishing what *this version* made obsolete (should be removed, by whoever holds the fix
  instruction) from pre-existing dead code (flag only). **A hardening pass deletes nothing** — see the
  closing rule.
- No copy-paste divergence: two implementations of one idea will drift, and the drift will be a bug.
- Types are honest — an `any` or a cast that suppresses a real error is a deferred failure.
- Complexity is justified. Speculative abstraction and configurability nobody asked for are findings.

## 7. Verification — E2E where it earns its place

Run whatever tests exist and report real pass/fail counts.

**Identify the flows that genuinely warrant pinning**, and say why each earns its slot. **Writing them mutates
the repo you are auditing, so ask before you do** — unless the operator has already said to add tests, specify
the suite (flow, assertions, fixture, observable) and stop. If you can verify a load-bearing flow **without**
touching the repo — an out-of-tree harness, or the built output driven against fixtures — do that and report the
real output; it is evidence, and it costs the repo nothing. The flows that earn a slot: a flow
whose silent breakage would be expensive and would not be caught by types or a unit test. The
canonical cases are the primary revenue/user path, an auth boundary, and anything that writes data.

Do **not** manufacture a suite for its own sake — tests that restate the implementation cost
maintenance and catch nothing. Equally, do not report "no tests" as though it were success: if a
load-bearing flow is unverified, name the flow and say it is unverified.

Where you do write E2E: assert observable behaviour and response shapes, select by role/label/test-id
never by CSS class (the kit's classes are compiled atomics), no whole-page snapshots (they fail on
copy tweaks and pass on logic bugs), assert invariants not fixture values, and no sleeps. Then break
each critical assertion deliberately and confirm it goes red for the right reason — a test that cannot
fail is decoration.

Also report **whether the load-bearing logic is reachable by a test at all.** A function that decides
something expensive but is module-private, or reachable only through a rendering pipeline, is a standing
finding no matter what a coverage number says — name it, and note that fixing it is a refactor, which a
hardening pass does not do.

## 8. Docs — close out so the next pass is cheap

Documentation is the deliverable that makes resumption possible. Write or update:

- **README** — what the app is, how to run and build it, the environment/bindings it needs, and how to
  deploy. Enough that a cold start needs nothing from this conversation.
- **The surface** — routes and `/api` contracts: method, path, input, success shape, error behaviour.
- **Operational notes** — what breaks in practice and what to do about it; which secrets exist and how
  they are provisioned (never their values).
- **State of play** — what this version does, what is deliberately not done yet, and the known rough
  edges. An honest limitations section prevents the next session from mistaking a gap for a bug and
  "fixing" a deliberate decision.

Docs describe **this version**. Delete what is no longer true rather than appending — stale docs are
worse than none, because they are believed.

## 9. ADRs — record the decisions, incrementally

Every decision taken during this version that a future reader would otherwise have to reverse-engineer
gets a short ADR under `docs/decisions/` (`NNN-slug.md`, numbered incrementally, newest never
renumbering old ones):

> **Context** — the situation and constraint that forced a choice.
> **Decision** — what was chosen.
> **Alternatives** — what was rejected, and why. This is the part that stops the same debate recurring.
> **Consequences** — what this makes easy, what it makes hard, and how to reverse it.

Write one when the choice was **load-bearing and non-obvious**: a data model, a boundary, a tradeoff
accepted knowingly, a dependency taken on, a constraint discovered the hard way. Do not write ADRs for
routine implementation.

**Supersede, never rewrite.** If this version reverses an earlier decision, add a new ADR that marks
the old one superseded and says what changed. The trail of reversals is the most valuable part of the
record — it is how a future session learns what was already tried.

## Report

1. **Release recommendation** — GO or BLOCK; if BLOCK, the exact gates blocking it.
2. **Gate table** — each gate → PASS / FAIL / NOT-RUN → the figure or line justifying it. **If one gate
   splits — part measured, part unverifiable — split the row rather than averaging it.** A gate reported
   PASS on the strength of its easy half is a false PASS. Omit gates that cannot fail for this class of
   app rather than padding the table with them.
3. **Critical findings** with file:line and the concrete fix.
4. **Non-critical findings**, severity-ordered.
5. **Close-out** — docs written/updated, ADRs added (with numbers), E2E added and why each earned it.
6. **What was NOT verified**, in those words.

Report first; fix on instruction. An auditor that silently edits what it audits destroys its own
evidence — and never promote a tier inside a hardening pass, since promotion is the operator's call.

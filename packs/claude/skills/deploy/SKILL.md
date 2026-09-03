---
name: deploy
description: Deploy a built Foundational builders app — zip the dist, upload + finalize via the Hub MCP, set secrets if needed, ALWAYS print the live URL, and offer to promote (internal/public). Run after /fdn:build.
argument-hint: "[path to the project dir]"
allowed-tools: Read, Bash, AskUserQuestion, mcp__fdn-hub__commit_source, mcp__fdn-hub__commit_file, mcp__fdn-hub__deploy_bundle, mcp__fdn-hub__finalize_bundle, mcp__fdn-hub__set_project_secret, mcp__fdn-hub__request_publish, mcp__fdn-hub__make_public, mcp__fdn-hub__publish_status, mcp__fdn-hub__get_project_logs, mcp__fdn-hub__get_deploy_status, mcp__fdn-hub__list_project_secrets, mcp__fdn-hub__create_version, mcp__fdn-hub__deploy_preview, mcp__fdn-hub__enable_push_builds, mcp__fdn-hub__push_to_github, mcp__fdn-hub__unpublish
---

# /fdn:deploy — ship it, and always surface the URL

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

Deploy the app to Hub and hand back a working URL. There are two paths — a cloud build
triggered by a commit, or a bundle you zip and upload — and §1 settles which one you are on before
anything else, because they diverge from §3 onward. `{project}.{zone}` follows the latest preview on
both; only the upload path also mints a per-deploy immutable `{project}-v<n>.{zone}`.

## 1. Establish the modality, then verify the build

**Which of the two deploy paths this project uses decides everything below, so settle it before you
touch a tool.** `get_deploy_status(project)` reports one of two:

| It reports | What deploys | Your route through this skill |
|---|---|---|
| `git-push` | the commit in §3 triggers a cloud build | §3 → §5 → §6. **Skip §4 entirely.** |
| `upload (direct deploy)` | you zip and upload the bundle yourself | §3 → §4 → §5 → §6. |

One call now; the alternative is finding out inside §4, by which point you have either raced your own
cloud build with a second uploaded version, or sat waiting on a build nothing triggered.

Then the build itself. On the **upload** path, confirm `<project-dir>/dist/index.html` exists and
`dist/_worker.js` is present (full-stack) if the app has a `/api`. If `dist/` is missing or stale, run
`/fdn:build` first. On the **push-builds** path the cloud builds `dist/` for you — running the build
locally is still worth it to catch a compile error before CI does, but it is not what ships.

## 2. Set secrets (only if the spec needs them)

For any API keys/tokens the worker reads: `mcp__fdn-hub__set_project_secret` (encrypted env
bindings). NEVER put secrets in the bundle or in git. The database, if the spec uses one, was already
provisioned in `/fdn:build` — `provision_database` for the default D1 (`env.APP_DB`, no secret to set),
or `provision_postgres` for the Neon escalation (`env.DATABASE_URL`) — deploy doesn't touch
backing-service provisioning.

## 3. Commit the source

**A deploy produces two artefacts, and you owe the project both: a deployed build, and the commit that
records the source it was built from.** Commit first on either path — on the upload path so that a
deploy which fails still leaves behind the source that reproduces the failure, and on the push-builds
path because this commit *is* what starts the build.

```
mcp__fdn-hub__commit_source{
  project,
  files: [ { path: "src/App.tsx", content: "…" }, … ],
  message: "feat: <what changed>"
}
```

It commits server-side using the platform's own credentials — **no local git, no `gh`, no checkout**,
so it works identically in Claude Code and Claude Desktop. Paths already in the repo are updated and
everything else is preserved, so the managed `.github/workflows/deploy.yml` and `grain.json` survive
and you may call it on every deploy.

Send **source only**: `src/`, `package.json`, config, tests, `README.md`. Never `dist/`, never
`node_modules/`, never a `.env`. Caps are 400 files and 4 MiB of decoded bytes — hitting either almost
always means a build directory got swept in.

**The house templates are entirely UTF-8 text, so a clone commits with no special handling.** That is
deliberate: the Foundational mark is an inline SVG (`src/components/FdnMark.tsx`) and the type stack is the
system UI stack, so there is no PNG and no WOFF2 to carry. Sweep the whole source tree anyway — not just
the files you edited — because an omitted file fails the build on an unresolved import, an error that
names the missing module and hides the cause.

**A binary YOU add needs `encoding: "base64"`** — committed as text it is silently corrupted:

```
files: [
  { path: "src/main.tsx",          content: "<utf-8 text>" },
  { path: "src/assets/hero.webp",  content: "<base64>", encoding: "base64" },
]
```

Treat every non-text extension this way — `.png .jpg .webp .ico .woff .woff2 .ttf .pdf`. But weigh it
first: base64 is ~1.37× the file's bytes and every one of those characters has to pass through your
context, so a 100 KB image is ~140 K characters and will not fit. Under ~30 KB, inline it. Above that,
prefer a form that has no bytes to carry (SVG for marks and icons, a system font stack for type) or
upload it to the project's own bucket with `presign_object_url` and reference the URL — do not try to
push a large binary through a commit.

> On a project with `enable_push_builds` on — the `git-push` modality you established in §1 — this
> commit **is** the deploy: it triggers the cloud build, which builds and ships the app for you. Skip
> §4 and poll `get_deploy_status(project)` until it leaves `building`; do not also upload a bundle, or
> you race your own build with a second version. Then continue at **§5**, not §6 — the snapshot is
> owed on both paths, and "Resuming on a revert" below has nothing to read without it.

## 4. Deploy the bundle

*(Upload path only — the modality you settled in §1. On `git-push`, §3 already deployed it: skip
straight to §5.)*

```bash
cd <project-dir>/dist && rm -f /tmp/gb-deploy.zip && zip -X -qr /tmp/gb-deploy.zip .
```
(index.html MUST be at the zip root.) Then:
1. `mcp__fdn-hub__deploy_bundle{project}` → returns a one-time upload URL + the version.
2. `curl -sS -X PUT --data-binary @/tmp/gb-deploy.zip "<upload-url>"` (raw zip bytes as the body).
3. `mcp__fdn-hub__finalize_bundle{project, version}` → unpacks, leak-gates, serves.

If the leak gate reports findings, STOP and fix them (a real secret/PII in the bundle) — never bypass.

Steps 1–3 need a shell. Without one (Claude Desktop), do not improvise a workaround: run
`enable_push_builds(project)` once and deploy through §3 from then on, which needs no local tooling
at all.

## 5. Save a deploy snapshot (so a revert can resume)

EVERY deploy MUST journal a snapshot in the project, so rolling back to any version resumes cleanly —
**both paths, no exceptions.** Write it the moment the deploy is live: right after `finalize_bundle`
returns on the upload path, or right after `get_deploy_status(project)` leaves `building` on the
push-builds path. "Resuming on a revert" below reads nothing but this journal; a deploy that skips it
is a version nobody can pick up.

Write `<project-dir>/.fdn/deploys/<id>.md`, where `<id>` is the `v<n>` finalize returned on the upload
path, or the short sha of the built commit on push-builds — there is no `v<n>` on that path (see §6):

```markdown
# Deploy <id> — <ISO timestamp>
- project: <project>
- source: <upload | git-push>
- version: <v<n> from finalize, or the built commit sha on push-builds>
- url: <the versioned URL on upload, else the rolling URL — see §6>
- leak-gate: <clean — on the upload path, where finalize is what runs it>

## Plan (gist)
<1–3 sentences: the goal from SPEC.md + what THIS deploy changed since the last one>

## State at this deploy
- screens / routes: <...>
- API (/api/*): <...>
- backing services: <db provisioned? which secrets set? style guide applied?>
- notes for resuming: <anything a future session needs to pick up from here>
```

Also append one line to `<project-dir>/.fdn/deploys/INDEX.md`:
`- <id> · <ISO> · <url> · <one-line summary>`

Commit `.fdn/deploys/*` with the project — it's the deploy journal (plan gist + state, never secrets). If
`SPEC.md` changed this deploy, capture the delta here too. On the push-builds path, let the entry ride
along with the NEXT deploy's `commit_source` (§3) rather than committing it by itself: a commit there
starts a build, and every build owes a snapshot, so a journal-only commit ships nothing and asks you
for another journal entry.

## 6. ALWAYS print the URL

Print what this path actually produced. The two paths hand you different things, so surface what you
have rather than the shape you expected.

**Upload path** — you have a `finalize_bundle` result, so you have both:
- **This deploy (unique, immutable):** `https://{project}-v<n>.{zone}`
- **Latest preview (rolling):** `https://{project}.{zone}`

Give the user the versioned URL to share this exact build.

**Push-builds path** — there is no finalize result, so there is no `v<n>` to print: `get_deploy_status`
reports the commit that was built, and `publish_status` reports no version until a tier is promoted.
Surface:
- **Live now (rolling):** `https://{project}.{zone}`
- **Built from:** the commit sha `get_deploy_status` returns — with the repo, that is what identifies
  this exact build in place of a version number.

Do NOT construct `{project}-v<n>.{zone}` on this path. That host does not resolve, and handing someone
a link that 404s costs more trust than handing them one link fewer.

The gated host is org Access. `-pub` is world-readable.

## 7. Offer promotion (respect the spec's visibility)

- **internal** — the preview is already SSO-gated; if the spec wants a stable internal URL, promote to
  the internal tier when available.
- **public** — call `mcp__fdn-hub__request_publish` (admin approval required); once approved the
  latest promoted build serves at `{project}-pub.{zone}` with no auth. Confirm with the user before
  requesting public — public exposes the app + any data it serves.

Never make an app public silently, and never expose PII publicly without explicit confirmation.

## Resuming on a revert

A revert repoints the live pointer to an older immutable version. When you roll a project back to version
`v<n>`, FIRST read `<project-dir>/.fdn/deploys/v<n>.md` — it holds the plan gist + state captured at that
build. Use it to resume `/fdn:build` from exactly where `v<n>` was, rather than re-deriving intent. The
`.fdn/deploys/INDEX.md` list is the deploy history to pick the version from.

On a push-builds project the snapshots are filed under the built commit sha instead of `v<n>` (§5), so
rolling back means checking that commit out and pushing it — the journal entry named by that sha is
still what tells you what the build was and what state it was in.

## The rest of the tool surface

The steps above cover the common path. These exist and are easy to miss:

| Tool | When you want it |
|---|---|
| `get_project_logs(project)` | **The debugging surface.** When a deployed app misbehaves, this is the command that shows you the error. Reach for it before re-deploying blind. |
| `publish(project, visibility)` | Owner self-service promotion to the **internal** tier — no admin in the loop. `request_publish` is for public, which needs approval. |
| `unpublish(project, visibility)` | Retract a tier. The preview host keeps serving; only that tier stops. Use it the moment a surface is exposed that should not be. |
| `enable_push_builds(project)` | **The modality you should be using.** Git push → cloud build → auto-deploy, with your SOURCE in the repo. See "Source belongs in git" below. |
| `commit_source(project, files, message)` | **How source gets into the repo.** Commits server-side — no local git, `gh` or checkout — updating the paths you send and preserving the rest of the tree. This is the tool `push_to_github` should have been. Safe to call on every deploy. |
| `commit_file(project, path, content)` | One NEW file, never overwriting. For adding a README or a config to a repo; use `commit_source` for anything you may need to change later. |
| `push_to_github(project)` | **Does NOT push your source.** It force-replaces the whole repo tree with the BUILT output. Superseded by `commit_source` — there is no longer a reason to run this on a project that holds source. |
| `get_deploy_status(project)` | Which modality a project uses, and whether the last build succeeded. Check this before diagnosing a "deploy did nothing". |
| `create_version(project, version)` | Turns an uploaded bundle into an immutable, permanently-addressable `v<n>` with its own stable URL. `finalize_bundle` gives you the rolling preview; this gives you a version that never changes. |
| `list_project_secrets(project)` | Which secret NAMES exist. Values are never returned. |
| `delete_project` / `restore_project` | Soft delete with a 7-day grace period. `restore_project` undoes it within the window. |

## Source belongs in git — the build does not

**A Foundational builders project's repo must contain the code that BUILDS the app, with its full commit
history. It must not contain only the build output.** This is not a style preference; it is what makes
an app resumable, reviewable and recoverable by anyone other than the machine that happened to build it.

This has already gone wrong once, and expensively. `ernest-grain-dispatch` was shipped by
`deploy_bundle` + `finalize_bundle` + `push_to_github`. Its repo today contains exactly three things:
`_worker.js`, `assets/` and `index.html`. There is no `src/` anywhere, in any commit, on any machine —
the TypeScript that compiled into that 339 KB worker no longer exists. Continuing the app means
reverse-engineering it from minified output.

**The cause is that `push_to_github` does the opposite of what its name suggests.** It force-replaces
the repo tree with the *built* output — it does not push your source, and it discards whatever source
was there. Its own tool description says "latest deployed source", which is wrong.

### What to do instead

1. **Commit source on every deploy, with `commit_source`** (§3) — `src/`, `package.json`, config,
   tests, everything that builds the app. It commits server-side, so this holds whether or not you
   have a filesystem: there is no session in which "I couldn't run git" is a reason the source is
   missing. The repo is the app; `dist/` is a by-product.
2. **Use `enable_push_builds(project)`** so each commit triggers the cloud build. Source goes to
   GitHub; the platform builds it. That is the modality that keeps the two in step.
3. **Add `dist/` to `.gitignore`,** and never include it in a `commit_source` call. Committing build
   output alongside source invites exactly the confusion above.
4. **Never run `push_to_github` on a repo that holds your source.** It will overwrite it. Now that
   `commit_source` exists, that tool has no correct use on a source-first project.

### Verify it, do not assume it

`enable_push_builds` used to have a defect where it reported **"git-push cloud builds enabled" even when
the repo, the workflow and the deploy secret were never created**. It now self-reports instead of just
claiming success: its output names, for the repo, whether `.github/workflows/deploy.yml` is present,
whether `grain.json` is present, and whether the `FDN_DEPLOY_TOKEN` deploy secret was sealed — and
prints an explicit `INCOMPLETE` line with the reason when provisioning degraded. Read that report before
trusting it. It is idempotent, so if it reports `INCOMPLETE`, re-running it IS the fix — no `gh` needed.

Separately, `src/` living in the repo (not just the workflow) is on you to confirm — `enable_push_builds`
wires CI, it does not audit what you've pushed. If the repo holds build output only and the source lives
nowhere but your disk, that's the earlier failure mode in this section; fix it before writing another
line.

Then confirm the platform agrees, with `get_deploy_status(project)` — `deploy source: git-push` means
the loop is closed; `upload (direct deploy)` means it is not, whatever `enable_push_builds` reported.

`deploy_preview(project, html)` still exists for a single self-contained HTML page, but prefer
`deploy_bundle` for anything real — a one-file page cannot carry a worker.

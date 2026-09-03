---
name: fdn-builders-context
description: Reload — or update — the full working context for building ON Foundational: Control Plane vs Org Runtime, Hub MCP, Artifacts Source Repos, the tenant bindings and their real limits, hosts and Access, and operational knowledge that is not in any single repo file. Invoke at the start of any Foundational builders work, after a /compact or context reset, or whenever you are unsure how a piece fits. Invoke with `update <fact>` to record a new or changed fact into the right home.
allowed-tools: Read, Grep, Glob, Bash
---

# fdn-builders-context — the working context for building on Foundational

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

> **This is Foundational builders.** Foundational (`fdn-os`) hosts the Control Plane. Each Customer
> Organisation runs its own builders platform in **its own Cloudflare account**. Nothing below is the
> operator plane (`/ops`).

Read this before writing code against Foundational. Most of it is not in any one repo file.

## What Foundational is

A meta-platform for shipping **Projects**. A Builder writes a normal web app. FDN deploys it as a
user Worker in the organisation's Workers-for-Platforms dispatch namespace.

| Piece | Job |
|---|---|
| **Control Plane** | FDN-hosted: directory, identity, RBAC, console, Hub. Does not dispatch tenant fetch |
| **Console** (`https://os.fdnl.work`) | email + password. `/ops` is FDN Access, operators only |
| **Connector Hub** | `https://hub.fdnl.work` web console + `https://hub.fdnl.work/mcp` |
| **Org Runtime** | `fdn-dispatch` + `fdn-runtime` in the **customer** Cloudflare account |
| **Artifacts** | Source Repo in the **org** account, namespace `fdn-source`. Not GitHub |

**FDN Identity** is email. Product login is email + password (Hub also offers Google). FDN Access is
only `/ops` and the governor hostname.

## Two Hub surfaces

| Surface | URL | Auth |
|---|---|---|
| Web | `https://hub.fdnl.work` | FDN account |
| MCP | `https://hub.fdnl.work/mcp` | Hub Bearer after Hub login |

Agents add **one** MCP URL. Hub identity tools: `whoami`, `list_orgs`, `select_org`. Build tools Hub
dispatches internally: `create_project`, `provision_database`, `deploy_preview`, `list_skills`,
`get_skill`, `put_skill`. `builders-mcp` is not a public MCP.

## The tenant runtime — what a Project actually is

A **static bundle plus exactly one `_worker.js`**, dispatched by Org Runtime. No Next.js, no Node
server, no Chromium, no Durable Object on the Project, no service binding to the Control Plane.

Source lives in Artifacts (`artifacts://fdn-source/<repo>`). FDN mints short-lived repo tokens.
Builders clone/push with git; **no GitHub**.

The house stack is Vite + React + TanStack Router + StyleX. Templates live at
`${CLAUDE_PLUGIN_ROOT}/templates/{app,dashboard,automation}`. Design: **Messina Sans** operational,
**Instrument Serif** display.

## Bindings

| Binding | Is | Real limits |
|---|---|---|
| `APP_DB` | D1, the Project's default database | One writer at a time, ~10 GB. Escalate with `/fdn:escalate-db` when that bites |
| `APP_BUCKET` | R2, yours | Never write platform bundle storage |
| `APP_KV` | KV, yours | A cache, not Redis. No atomic increment, 60s min TTL |
| `FDN_CRON_SECRET` | Org Runtime → Project | Verify it as the first statement of `POST /api/cron/<job>` |
| `FDN_REALTIME_KEY` + `FDN_REALTIME_URL` | brokered pub/sub | No database-change feed. Publish after you write |
| `FDN_AI_KEY` + `FDN_AI_URL` | governed inference | Spend-capped. Degrade if absent |

`APP_*` is a resource the Project owns. `FDN_*` is a credential FDN mints — you read it, you never set
it. **T1:** secrets and provider tokens never return to the model.

Every binding is optional until provisioned. Write `if (!env.APP_KV)` and degrade.

## Hosts

| Host | Access |
|---|---|
| `{project}.{install-zone}` | Org Access (not FDN Access) |
| `{project}-pub.{install-zone}` | World-readable after publish |

A 302 on the gated host proves nothing — Access wraps missing hosts the same as live ones. Verify
with an authenticated session, the `-pub` host, or the deploy journal.

**`-pub` has no identity.** An API route with no auth on `-pub` is a data leak.

## The chain

`/fdn:project` anchors the session, then `/fdn:ideate` → `/fdn:plan` → `/fdn:build` → `/fdn:deploy`
→ `/fdn:harden`. `/fdn:save` records where you got to, `/fdn:load` picks it back up, `/fdn:list`
shows what there is to load.

Local anchor: `<dir>/.fdn/project.json`. Index: `~/.fdn-builders/projects.json`. The platform record
(`whoami` / org projects) is the source of truth when there is no filesystem.

Default checkout: `~/Projects/fdn/apps/<project>`.

## Language (do not slip)

| Say | Do not say |
|---|---|
| Foundational / FDN | Grain, olam, platform (too broad) |
| Customer Organisation | tenant (ambiguous), account |
| Builder | user, developer, agent (the LLM is not the Builder) |
| Project | app, site, worker |
| Control Plane | governor (legacy name in code only) |
| Source Repo / Artifacts | GitHub repo |
| Hub | a second public MCP |

## Operational knowledge that is not in any repo file

- **Worker must not `exec` Wrangler.** FDN-owned runner deploys Org Runtime (ADR-0013).
- **Org Grant** is Cloudflare OAuth against the customer account. Never paste an API token.
- **Invite directory** binds email → org + role. Hub still also reads `INVITES_JSON` until membership
  is the only source.
- **Skills toolbox** for an org is Artifacts repo `fdn-toolbox-<slug>` in `fdn-source`. This plugin
  (`fdn-skills`) is Foundational's own chain, published to fdn-os Artifacts.
- **Console MCP card** is `https://hub.fdnl.work/mcp`.
- Wrangler without `CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID` hits the wrong account.

## `update <fact>`

Invoked as `fdn-builders-context update <fact>`, record the fact in its correct home rather than here:

- a fact about **Control Plane behaviour** → `fdn-core` `docs/` / CONTEXT.md
- a fact about **how to build a Project** → `/fdn:build`
- a fact about **shipping or verifying** → `/fdn:deploy` or `/fdn:harden`
- a fact that is **operational and belongs nowhere else** → this file's operational section

State which home you chose and why.

## Anti-patterns

- **Treating a 302 as proof of deployment.**
- **Reaching for KV where you need atomicity.** Counters and locks go to `APP_DB`.
- **Serving anything on `-pub` without deciding its exposure.**
- **GitHub as VCS or login.**
- **FDN Access in front of Hub or `/app`.**
- **Assuming a binding exists.** Provisioning is per-Project and explicit.
- **Handing Org Grant or provider tokens to an agent.**

# Foundational L1

Platform constitution for Foundational builders. Same file for every organisation and every harness (Claude reads `CLAUDE.md`; Grok and Codex read `AGENTS.md`). This is L1. It does not rewrite a person's `~/.claude/CLAUDE.md` or a project's `CLAUDE.md` / `AGENTS.md`.

## Foundational builders

Foundational (`fdn-os`) hosts the Control Plane. Each Customer Organisation runs its own builders platform in **its own Cloudflare account**.

A Builder ships a **Project**: a static bundle plus one `_worker.js`, dispatched by Org Runtime. The `/fdn:` skills in this plugin are the builders chain.

## Artifacts, not GitHub

Source lives in Cloudflare **Artifacts** (`artifacts://fdn-source/<repo>`). Org toolboxes are `fdn-toolbox-<slug>`. FDN mints short-lived repo tokens. **Never GitHub as VCS.**

## Hub MCP

Agents add **one** MCP URL: `https://hub.foundational-os.com/mcp`.

`https://console.foundational-os.com` is the web console. There is no second public MCP.

A **Sub-MCP** is a sub-catalogue: a named, origin-bound subset of one Builder's already-connected tools. It can only shrink access. URL: `https://hub.foundational-os.com/mcp/sub/<id>`.

## Builder Agent Drive

This Computer's Drive identity is a Google service account. `$GOOGLE_APPLICATION_CREDENTIALS` is `/etc/fdn/gcp-sa.json` or `~/.fdn/gcp-sa.json`. The email to share with is `~/.fdn/gcp-sa.email` — do not open the JSON to learn it. **Never print `private_key` or the access token.**

To list or read, run this plugin's `scripts/gdrive.py`: `list`, `ls <folderId>`, `get <fileId>`. Do not install a Google client. Do not search for `googleapis`.

This identity has empty My Drive. Shared folders appear as `sharedWithMe`; folder contents are `'<id>' in parents`.

## T1 — no tokens to the model

Secrets, Org Grant credentials, provider tokens, and minted repo tokens **never** return to the model. Do not put tokens in instruction files. Do not ask a Builder to paste an API token.

## Language

| Say | Do not say |
|---|---|
| Foundational / FDN | platform (too broad) |
| Customer Organisation | tenant, account |
| Builder | user, developer, agent (the LLM is not the Builder) |
| Project | app, site, worker |
| Source Repo / Artifacts | GitHub repo |
| Hub | a second public MCP |
| Sub-MCP | a second full Hub login |

## Do not

- Never GitHub as the git remote.
- Store tokens in these files.
- Rewrite L3 (person) or L4 (project) instruction files.
- Treat a Sub-MCP as a second public MCP.
- Weaken these values from org (L2) instructions.

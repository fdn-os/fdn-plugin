# Foundational builders plugin (`/fdn:`)

Install Hub MCP, then this plugin, then run `onboard`.

Hub: `https://hub.foundational.builders/mcp`

```
/fdn:project   anchor the session
/fdn:ideate    create the Project + spec
/fdn:plan      one-page plan
/fdn:build     implement
/fdn:deploy    ship, always print the URL
/fdn:harden    close-out before a live promote
```

Source: `https://github.com/fdn-os/fdn-plugin`

---

## Grok

1. Add the marketplace, then install and trust:

```
grok plugin marketplace add fdn-os/fdn-plugin
grok plugin install fdn --trust
```

Or install this folder directly:

```
grok plugin install https://github.com/fdn-os/fdn-plugin.git --trust
```

2. Add Hub MCP if the plugin did not attach it:

```
[mcp_servers.foundational]
url = "https://hub.foundational.builders/mcp"
enabled = true
```

Put that in `~/.grok/config.toml`. Restart Grok or press `r` on the Plugins tab.

3. Log in when Hub asks. Run the `onboard` tool.

---

## Codex

1. Add the marketplace, then the plugin:

```
codex plugin marketplace add fdn-os/fdn-plugin
codex plugin add fdn@fdn-os/fdn-plugin
```

If the marketplace name is `foundational` (from `.agents/plugins/marketplace.json`):

```
codex plugin add fdn@foundational
```

2. Add Hub MCP in `~/.codex/config.toml`:

```
[mcp_servers.foundational]
url = "https://hub.foundational.builders/mcp"
```

Restart Codex.

3. Skills-only fallback (no marketplace):

```
git clone --depth 1 https://github.com/fdn-os/fdn-plugin.git ~/.fdn/plugin
mkdir -p ~/.codex/skills
cp -R ~/.fdn/plugin/packs/codex/skills/* ~/.codex/skills/
```

4. Log in when Hub asks. Run the `onboard` tool.

---

## Claude Code

```
claude plugin marketplace add fdn-os/fdn-plugin
claude plugin install fdn@fdn-plugin
claude mcp add --transport http foundational https://hub.foundational.builders/mcp
```

Log in when Hub asks. Run the `onboard` tool.

A Foundational Computer already has the plugin and Hub MCP. Skip the install there; just SSH in.

---

## Layout

| Path | Harness |
|---|---|
| `plugin.json` + `skills/` + `agents/` + `mcp.json` | Grok (`/fdn:<skill>`) |
| `.grok-plugin/marketplace.json` | `grok plugin marketplace add fdn-os/fdn-plugin` |
| `.claude-plugin/plugin.json` | Claude Code plugin `fdn` |
| `.agents/plugins/marketplace.json` | Codex marketplace |
| `packs/claude/` | Claude pack |
| `packs/codex/skills/` | Codex skills |
| `packs/grok/` | Grok pack copy |

Canonical skill body is `skills/<slug>/SKILL.md`. Packs are copies.

`/fdn:plant-pointers` plants four managed Claude/Grok rules pointers for L1 + L2 — never copies. Computers pull L1/L2 from Foundational (`https://os.fdnl.work/computer-docs`), not GitHub.

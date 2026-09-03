# Foundational builders plugin (`/fdn:`)

Install Hub MCP, then the plugin, then run `onboard`.

```
claude plugin marketplace add fdn-os/fdn-plugin
claude plugin install fdn@fdn-plugin
claude mcp add --transport http foundational https://hub.foundational.builders/mcp
```

Log in when Hub asks. Then run the `onboard` tool. After that:

```
/fdn:project   anchor the session
/fdn:ideate    create the Project + spec
/fdn:plan      one-page plan
/fdn:build     implement
/fdn:deploy    ship, always print the URL
/fdn:harden    close-out before a live promote
```

Claude Code on a Foundational Computer already has this plugin and Hub MCP. Org-level fallback: the same marketplace install, or copy `packs/claude/` from this organisation's Artifacts toolbox.

L1/L2 docs are served by Foundational OS (`https://os.fdnl.work/computer-docs`) and pulled onto Computers. They are not cloned from GitHub.

# Foundational builders app templates

The opinionated boilerplates `/fdn:build` clones, one per project type. All three share the SAME proven
build wiring; they differ in structure + dependencies.

| Type | Dir | Adds |
|------|-----|------|
| app | `app/` | TanStack Router + Query + StyleX starter, Neon-backed `/api` |
| dashboard | `dashboard/` | + bento metric grid + StyleX SVG chart, `/api/metrics` |
| automation | `automation/` | worker-centric task runner (`/api/run`,`/api/runs`), minimal UI |

## Shared stack (locked)
- **UI:** React 19 + TanStack Router (code-based) + TanStack Query + **StyleX** (atomic, build-time).
- **Build:** Vite 7 + `@vitejs/plugin-react` 5. `base: "./"` (relative asset paths → serves from R2 under
  any host, incl. `{project}-v<n>.{zone}`). Output: static `dist/` + `dist/_worker.js` (esbuild).
- **Backend (consolidated):** Neon (`env.DATABASE_URL`) is the default store. Four further tenant
  primitives are opt-in — each provisioned once via the Hub MCP, then injected on the next
  deploy (see `/fdn:build` §4a–§4d):
  - `provision_storage` → `env.APP_BUCKET`, the project's OWN writable R2 bucket for app data. Distinct
    from the platform's shared `BUNDLES` bucket, which serves deployed files and is never app-writable.
  - `provision_kv` → `env.APP_KV`, the project's own KV namespace (cache semantics: eventually
    consistent, no compare-and-set, 60 s minimum TTL).
  - `provision_cron` → `env.FDN_CRON_SECRET`; the governor holds the schedule and POSTs
    `/api/cron/<job>`. Tenants still have no Cron Trigger of their own.
  - `provision_realtime` → `env.FDN_REALTIME_KEY` / `env.FDN_REALTIME_URL` for server-published
    WebSocket fan-out. There is no database-change feed.

  Still absent for tenants: Durable Object bindings, a Node runtime, and Chromium.
- **Deploy:** `npm install && npm run build` → zip `dist/` → Hub MCP
  (`deploy_bundle`→PUT→`finalize_bundle`), which returns the unique `{project}-v<n>.{zone}`.

## StyleX two-pass (keep in sync)
`@stylexjs/babel-plugin` (in `vite.config.ts`) compiles `stylex.props()` to literal class names
(`runtimeInjection:false`); `@stylexjs/postcss-plugin` (in `postcss.config.mjs`) emits the matching
atomic CSS at `@stylex;`. Both use the same `unstable_moduleResolution` so hashes line up. Design tokens
in `src/tokens.stylex.ts` (`stylex.defineVars`) are overwritten by `/fdn:build` from the resolved
**style guide** (console admin → Style guides).

> Pinned to Vite 7 + plugin-react 5 (stable) rather than Vite 8 / plugin-react 6 (rolldown era), whose
> plugin API dropped the classic `babel` option StyleX needs. Revisit when StyleX ships first-class
> rolldown support.

## Table row actions — use `<TD actions>`, never a bare cell

Two defects shipped to production from hand-rolling this cell, so the kit now makes the right thing the
default. Put row controls in `<TD actions>`:

```tsx
<TD actions>
  <Button variant="secondary" onClick={…}>Nudge</Button>
  <Button variant="ghost" onClick={…}>View</Button>
</TD>
```

- **It gaps the controls.** `text-align: right` does NOT space inline-flex siblings — buttons end up
  flush against each other. `actions` wraps the children in a `flex` row with `gap: 8`. Note the *cell*
  stays a real table-cell: `display: flex` on a child of `table-row` gets wrapped in an anonymous
  table-cell, and the `td`'s own `width` then stops sizing the column.
- **It sizes the buttons.** A `Button` has no `size` default of its own inside an actions cell: it reads
  a context and resolves to the compact 30px `sm`, because a 36px form-sized button dominates a row
  whose padding is 10px. An explicit `size` still wins.

The point is that neither is a convention to remember — a rule you must remember is a rule that ships
broken. `app/src/routes/home.tsx` demonstrates the pattern (including the visually-hidden `<TH>` the
actions column needs for screen readers).

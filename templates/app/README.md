# gb-template-app

Foundational builders **app** boilerplate. Cloned by `/fdn:build` for project type `app`.

**Stack:** TanStack Router (code-based) + TanStack Query + StyleX, built by Vite to a static
`dist/`, with a `_worker.js` (esbuild) handling `/api/*`. Backend = Neon (`env.DATABASE_URL`);
no tenant KV by design.

## Build → deploy
```
npm install && npm run build     # → dist/ (index.html + assets) + dist/_worker.js
```
Zip the contents of `dist/` (index.html at the zip root) and deploy via the Hub MCP
(`deploy_bundle` → PUT → `finalize_bundle`). `base: "./"` keeps asset paths relative so it serves
from R2 under any host, including the versioned `{project}-v<n>.{zone}` preview.

## StyleX (two coordinated passes — keep them in sync)
1. `vite.config.ts` — `@stylexjs/babel-plugin` (via `@vitejs/plugin-react`) compiles `stylex.props()`
   to literal class names (`runtimeInjection:false`).
2. `postcss.config.mjs` — `@stylexjs/postcss-plugin` emits the matching atomic CSS at `@stylex;`.
Both MUST use the same `unstable_moduleResolution` so class + CSS-var hashes line up.

Design tokens live in `src/tokens.stylex.ts` (`stylex.defineVars`) — `/fdn:build` overwrites the
values from the resolved **style guide**.

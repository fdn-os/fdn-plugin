---
name: build
description: Build a Foundational builders app from its spec — clone the type's boilerplate (TanStack Router + Query + StyleX), apply the resolved style guide's design tokens, implement the spec's screens + API, and run the Vite build to a deployable dist/. Run after /fdn:ideate, before /fdn:deploy.
argument-hint: "[path to the project dir, or the app idea]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, mcp__fdn-hub__provision_database, mcp__fdn-hub__provision_postgres, mcp__fdn-hub__provision_storage, mcp__fdn-hub__get_storage_usage, mcp__fdn-hub__presign_object_url, mcp__fdn-hub__provision_kv, mcp__fdn-hub__get_kv_usage, mcp__fdn-hub__provision_cron, mcp__fdn-hub__list_cron_jobs, mcp__fdn-hub__set_cron_enabled, mcp__fdn-hub__delete_cron_job, mcp__fdn-hub__provision_realtime, mcp__fdn-hub__get_realtime_usage, mcp__fdn-hub__get_ai_usage, mcp__fdn-hub__provision_ai
---

# /fdn:build — build the app on the opinionated stack

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

Produce a real, good-looking, working app from the spec — never a bare scaffold. The stack is fixed
(this is the point of the platform): **TanStack Router + TanStack Query + StyleX**, Vite-built to a
static `dist/` + a `_worker.js` for `/api/*`, backed by its own Cloudflare D1 database (Postgres is
available as an opt-in escalation — see §6c).

## 1. Get the project on disk

**`/fdn:ideate` leaves nothing on your filesystem.** It is fully server-side — it creates the project,
wires the repo for push-builds CI and commits `SPEC.md` through the platform's own credentials — so
there is no folder waiting for you when you arrive here. Materialise one before anything below tries to
read it:

```bash
gh repo clone fdn-os/<project> ~/Projects/fdn/apps/<project>
cd ~/Projects/fdn/apps/<project>
```

`~/Projects/fdn/apps/<project>` is the house default every `/fdn:` skill assumes; use the user's path if they
gave one. If that folder already exists and holds this project's checkout, `git pull` and work in it
rather than cloning a second copy — two checkouts of one project is how a fix lands in the copy you are
not deploying from.

Then write the anchor, so later `/fdn:` commands find the folder without asking:

```json
// <dir>/.fdn/project.json
{ "project": "<project>", "type": "<app|dashboard|automation>", "created": "<ISO>", "repo": "fdn-os/<project>" }
```

and merge — never rewrite wholesale — an entry into `~/.fdn-os/projects.json`. `/fdn:project`
owns both files and can write them for you; run it if the anchor is missing or points somewhere stale.

**Without a shell, `/fdn:build` cannot run at all — say so here rather than three steps in.** Claude
Desktop has no filesystem and no build toolchain: nothing to clone into, no `npm install`, no `dist/` to
produce. That is a surface limit, not a broken project — `/fdn:ideate` already left a repo with the spec
committed, and the build picks up unchanged on any surface that has a shell. Do not improvise around it
by trying to assemble an app one `commit_file` at a time.

## 2. Resuming an app that already exists?

If this project is already deployed, run **`/fdn:load`** first. It restores the last `/fdn:save`, or
reconstructs from platform state when there is none. It tells you what the app
is, what is live at which version, what is provisioned, and what the last session left open — from the
platform's state rather than from memory. Building against a stale mental model is how a fix lands on
top of a version that already superseded it.

## 3. Load the spec (and any revert snapshot)

Read `SPEC.md` in the checkout from §1 — `/fdn:ideate` committed it there. If there's no spec, gather
the same inputs (name, type, description, visibility, style guide) first — or run `/fdn:ideate`. If
you're resuming after a REVERT to version `v<n>`, also read `.fdn/deploys/v<n>.md` (written by
`/fdn:deploy`) — it holds the plan gist + state at that build, so you continue from where that version
was instead of re-deriving intent.

## 4. Clone the boilerplate for the type

Copy `${CLAUDE_PLUGIN_ROOT}/templates/<type>/` into the project dir (type = app|dashboard|automation).
These are proven, pre-wired: Vite + StyleX two-pass, code-based TanStack Router, TanStack Query, an
esbuild `_worker.js`, `base:"./"` for R2 serving, and a theme-aware favicon. Do NOT re-invent the build config.

**Every app ships a favicon.** The Foundational mark is already in `index.html` as inline light/dark `data:`
URIs — inline because the same bundle is served both at `{project}.{zone}` and under
`/preview/<project>/v<n>/`, so a `/favicon.ico` path would 404 on the subpath form. Never ship an app
with a blank tab.

## 5. Apply the style guide (design tokens)

Read `${CLAUDE_PLUGIN_ROOT}/style-guides/<styleGuide>.json` (from the spec) and MERGE its values into
`src/tokens.stylex.ts`. Keep BOTH calls, and merge **key by key** — never paste a block over another:
- **Light** — for each key in `stylex.defineVars({...})` that the guide's `content.tokens` also names,
  overwrite the value. Leave every key the guide does not name exactly as the template has it, and
  ignore guide keys the template does not define.

  The two key sets genuinely differ, in both directions, so "swap the block" is not a shortcut — it is
  a build break. The template defines `radiusInput` (read by `components/ui.tsx` at lines 418 and 1423)
  and `text3xl`, which no style guide has; the guides define `display` and `displaySm`, which no
  template references. Replace the whole `defineVars` block with `content.tokens` and you delete
  `radiusInput`, and `npm run typecheck` fails on the components that read it. Dropping a
  template-only key breaks the build; ignoring a guide-only key costs nothing.
- **Dark** — the `stylex.createTheme(tokens, {...})` (`darkTheme`) values come from the guide's
  `content.tokensDark` (only the keys the boilerplate's `darkTheme` already overrides — theme-invariant
  keys like radii/fonts/type/ease stay out of the theme). Keep the export named `darkTheme`: the shell,
  the NavBar toggle, and the `useTheme` hook in `components/ui.tsx` depend on it, so every generated app
  ships user-toggleable dark mode (defaulting to system preference) for free.

Also swap the two hardcoded backgrounds in `index.html`'s no-flash `<style>` (`html, body` = light `bg`,
`html[data-theme="dark"]` = dark `bg`) so the pre-mount paint matches the guide. While you are in that
`<head>`: leave the `FAV` light/dark base64 blobs and the `#fdn-favicon` link alone — they are long and
look like noise, but deleting either is how an app ends up with a blank tab. This reskins the whole
app (colors, radii, shadows, type, motion) in both themes without touching component code.

> When the Hub MCP exposes `get_style_guide`, prefer the LIVE value from the console admin
> (the D1 authority) and fall back to the bundled JSON. Today: use the bundled JSON.

## 6. Implement the spec

This is the real work — build the app the spec describes, holding the quality bar of the boilerplate's
home page (hierarchy, depth, designed hover/focus states, motion, editorial layout):
- **Routes** — add `src/routes/*.tsx` and register them in `src/router.tsx` (code-based). Reuse the
  StyleX token vocabulary; never hardcode colors — reference `tokens.*`.
- **Server** — implement the spec's `/api/*` in `worker/index.ts`. If the spec's data model needs
  persistence, provision it first (see §6c) and use D1 via `env.APP_DB` (`drizzle(env.APP_DB)`).
  Keep `src/sample-data.ts` as the app's ONE seam for
  invented rows: adapt its exported records to the spec's actual domain (never delete the file or the
  empty-state fallback that reads from it), and never hardcode a second set of fake rows elsewhere —
  the app must still render populated on first deploy, before any real data source is provisioned.
- **Files** — if the spec stores user files (photos, PDFs, exports), use `env.APP_BUCKET`. See §6d.
- **Cache / short-lived state** — your app CAN have KV now: run the `provision_kv` MCP tool once for the
  project and the governor injects your **own** namespace as `env.APP_KV`. See §6e before you write
  against it — it is a cache, not Redis.
- **Data** — wire screens with `useQuery`/`useMutation` against your `/api` routes.
- **Scheduled work** — if the spec has anything recurring (a sync, reminders, expiry sweeps, token
  refresh, health checks), do NOT hand-roll a timer or a Cron Trigger. Register it with the platform and
  implement `POST /api/cron/<name>`. See §6f — the auth check there is mandatory.
- **Live updates (only if a screen must change without a refresh)** — run `provision_realtime` on the
  Hub MCP, then redeploy. Your worker gets two bindings: `env.FDN_REALTIME_KEY` (secret) and
  `env.FDN_REALTIME_URL`. See §6g. **There is NO database-change feed** — publishing is
  your server's job.
- **Use the kit — don't rebuild it.** `src/components/ui.tsx` is a delivery-tracker-fidelity component
  kit (ported gold-standard): `Button` (variants + `loading`, tap-press), `Badge` (7 variants +
  `pulse`/`nudge` attention flashes), `Field`/`Input`/`Textarea`/`SearchInput`/`Checkbox`/`Select`/`Menu`
  (accessible, animated popovers), `Table` primitives (`TR` has a one-shot `flash`), `Modal`, `Tabs`,
  `Skeleton`/`SkeletonText`, `Spinner`, `NavBar` + `AccountMenu`, and a `ToastProvider` + `useToast()`
  (`toast.success/error/info/loading`). Compose these; reach for raw markup only when the kit has no fit.
- **Motion** — framer-motion is wired in; shared variants/easings live in `src/components/motion.ts`
  (`popoverMotion`, `modalPanelMotion`, `toastMotion`, `buttonTap`, `iconSwapMotion`, `easeOut`…). Reuse
  them for new motion instead of hand-rolling timings; everything is gated on `useReducedMotion()` +
  `prefers-reduced-motion` — keep that when you animate.
- Keep it type-safe: `npm run typecheck` must stay clean.

## 6a. Two UI rules that are not optional

Both of these are cheap to do now and expensive to retrofit, and both have already had to be fixed by
hand in shipped Foundational apps. Build them in from the start.

**1. One layout, defined once.** Put `NavBar` in the root layout (`src/router.tsx`) and let every route
render inside it. Never give a page its own header, and never copy nav markup into a second page — a
page without the shared nav is a dead end, and two copies of a navbar drift.

```tsx
// src/router.tsx — the ONLY place the nav is defined
function RootLayout() {
  const { theme, pref, setPref } = useTheme();
  return (
    <div {...stylex.props(styles.shell, theme === "dark" && darkTheme)}>
      <NavBar
        links={[{ to: "/", label: "Orders", exact: true }, { to: "/reports", label: "Reports" }]}
        account={{ email, pref, onPrefChange: setPref, onSignOut }}
      />
      <main {...stylex.props(styles.main)}><Outlet /></main>
    </div>
  );
}
```

- The bar carries **destinations**. Identity, preferences and sign-out go in `account` — `AccountMenu`
  renders the avatar, the signed-in email, an inline 3-way system/light/dark theme control, and a
  destructive sign-out last. Passing `account` suppresses the standalone theme toggle, because theme
  belongs in exactly one place.
- Gate a link by permission (an admin area, say) by leaving it out of `links` — never by building a
  second navbar for the privileged pages.

**2. Destructive or archived state is filtered out of the default view, behind a labelled tab with a
count.** Soft-deleted, archived, cancelled and expired rows do not belong inline with live ones — but
they must not become invisible either, because a soft delete exists precisely so someone can undo it.

```tsx
const active = rows.filter((r) => r.status !== "archived");
const archived = rows.filter((r) => r.status === "archived");

<Tabs
  value={tab} onChange={setTab} ariaLabel="Filter orders"
  tabs={[
    { value: "active", label: <>Active <Badge variant="muted">{active.length}</Badge></> },
    { value: "archived", label: <>Archived <Badge variant={archived.length ? "danger" : "muted"}>{archived.length}</Badge></> },
  ]}
/>
```

- **Always show the count**, computed from the full list, not the filtered view. The number is the only
  thing separating "out of the way" from "gone".
- Keep the undo action (Restore / Unarchive) reachable **on that tab** — a tab you cannot act from is
  just a graveyard.
- Put the selected tab in the URL (search param or hash) so it survives a reload and can be linked.
- When the default view is empty but the archived tab is not, say so and link to it. "Nothing here"
  is wrong when there are five restorable rows one tab away.

## 6b. Naming — `APP_*` is yours, `GRAIN_*` is the platform's

Two prefixes, and the difference tells you what you may do with each:

| Prefix | Means | Examples | Can you set or rotate it? |
|---|---|---|---|
| `APP_*` | a **resource you own** — an object you call methods on, holding your data | `APP_BUCKET`, `APP_KV` | it's yours; the platform creates it, you fill it |
| `GRAIN_*` | a **credential or endpoint the platform issues**, mints and rotates | `FDN_AI_KEY`, `FDN_AI_URL`, `FDN_REALTIME_KEY`, `FDN_REALTIME_URL`, `FDN_CRON_SECRET` | no — it is injected at deploy and rejected if you try |

So the cron secret is `FDN_CRON_SECRET`, not `APP_CRON_SECRET`: the governor derives it per project,
signs its callback with it, and your app only **verifies** it. Naming it `APP_` would imply you own it.

Every name in this table is refused if you pass it to `set_project_secret` — for `APP_*` because the
binding already exists, for `GRAIN_*` because setting it would overwrite the value the platform
injects and your app would silently lose the capability.

## 6c. Data model — `env.APP_DB` (D1)

Only if the spec's data model needs persistence. Run `provision_database(project)` on the Hub
MCP **once** (idempotent) before writing queries. It returns a resource ref — **never a connection
string** — and provisions a Cloudflare D1 database that belongs to this project alone. The governor
wires it up as the `env.APP_DB` binding on the next deploy; there is no credential to hold or leak,
because D1 is reached through the binding, not a connection string.

```ts
// worker/index.ts
import { drizzle } from "drizzle-orm/d1";
const db = drizzle(env.APP_DB);
const rows = await db.select().from(orders).where(eq(orders.status, status));
```

D1 is SQLite — it has real queries, transactions, joins and `UNIQUE` constraints, so this is the
default home for anything relational, not a fallback. Shape the schema from the spec's "Data model
(sketch)" section before you write the first query, and write migrations the same way you would for
any SQL database.

**Escalate to Postgres only when the app genuinely needs it** — pgvector / embeddings search, heavy
analytical SQL, a Postgres-only extension, or a working set over ~10 GB. Run `provision_postgres(project)`
instead: it provisions a per-project Neon database and injects `env.DATABASE_URL` on the next deploy.

```ts
// worker/index.ts — only for the Postgres escalation path; dynamic import keeps the driver
// out of the client bundle
const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);
const rows = await sql`SELECT * FROM orders WHERE status = ${status}`;
```

Treat `env.DATABASE_URL` like any other injected secret if you do escalate: never log it, never send
it to the client, never write it to a file in the repo. A spec with no persistent state (a pure webhook
relay, a stateless proxy) needs neither — skip provisioning rather than standing up a database nothing
writes to.

## 6d. File storage — `env.APP_BUCKET`

Only if the spec stores user files. Run `provision_storage(project)` on the Hub MCP **once**
(idempotent) before writing upload code — it gives the project its own R2 bucket and injects it as
`env.APP_BUCKET` on the next deploy.

```ts
// worker/index.ts — server-side read/write, no credential needed
await env.APP_BUCKET.put(key, request.body, { httpMetadata: { contentType } });
const obj = await env.APP_BUCKET.get(key);            // null when absent
const { objects } = await env.APP_BUCKET.list({ prefix: "pod/" });
await env.APP_BUCKET.delete(key);
```

Rules that matter:

- **Never write to `env.BUNDLES`.** That is the shared platform bucket serving *every* project's deployed
  files. App data belongs in `APP_BUCKET` only.
- **Key your own namespace** inside the bucket (`pod/<orderId>/<uuid>.jpg`), so listing stays cheap.
- **Upload through your own worker.** The browser POSTs the file to your `/api/*` route and the worker
  `put`s it. This is the path to build on: it lets you authorize per request, and it is the only one a
  deployed app can actually use. Stream it — pass `request.body` straight through rather than buffering
  the file in memory:

  ```ts
  // POST /api/evidence — authorize FIRST, then stream to R2.
  if (!callerMayAttachTo(exceptionId)) return json({ error: "forbidden" }, 403);
  await env.APP_BUCKET.put(key, request.body, { httpMetadata: { contentType } });
  ```

  Enforce your own size limit from `content-length` before the `put`, and delete the object if the
  stored size does not match what the client declared.

- **`presign_object_url` is NOT callable from your app.** It is an MCP tool your *agent* can run — handy
  for seeding an object or inspecting one while building — but a deployed worker has no way to invoke an
  MCP tool, and there is no tenant-facing route for it. Do not design an upload flow around it: an API
  route that "calls presign" cannot be written. (It additionally requires an R2 S3 credential the
  platform does not currently hold, so it refuses for everyone today.) If you want direct-to-R2 uploads
  that never traverse your worker, say so and treat it as a platform request, not something to work
  around in app code. Keys are relative to your project's prefix: `..`, absolute paths and
  URL-encoded keys are refused.
- **Quotas are real and server-side**: one bucket per project, **16 MB per object**, **1000 objects** and
  **256 MB** in total (an admin can raise the byte cap). `get_storage_usage(project)` shows headroom —
  though it needs the same R2 S3 credential presign does, so today it may refuse; `APP_BUCKET.list()`
  from inside your worker is the reliable fallback. Check the declared `content-length` against your own
  limit BEFORE the `put` and reject early, rather than discovering the cap mid-write. Surface a refusal
  in the UI (show the error, don't retry silently).
- Serving a stored file back: stream it from your own route
  (`new Response(obj.body, { headers: { "content-type": obj.httpMetadata.contentType } })`) so your
  auth rules apply, or mint a short-lived `GET` URL when a temporary public link is genuinely wanted.

## 6e. Cache — `env.APP_KV` (per-project KV, with TTL)

Run the **`provision_kv`** MCP tool once for the project (idempotent — a second call is a no-op). The
governor creates a namespace that belongs to that project alone and injects it as `env.APP_KV` on the
next deploy, plus on the current live version straight away. No other project can read or write it, and
it is not the platform's own KV.

```ts
// worker/index.ts — inside your /api/* handler
const cached = await env.APP_KV.get("eta:job-42", "json");
if (cached) return Response.json(cached);

const eta = await computeEta();                     // the expensive path
await env.APP_KV.put("eta:job-42", JSON.stringify(eta), { expirationTtl: 300 }); // 5 min
return Response.json(eta);
```

`get(key, "text" | "json" | "arrayBuffer")`, `put(key, value, { expirationTtl | expiration })`,
`delete(key)`, `list({ prefix })`. Namespace your keys by purpose (`eta:`, `cache:v2:`) so a `list({ prefix })`
sweep stays cheap.

**KV is a cache, not Redis. Read this before you design around it:**

| You want | Use KV? | Why / what to use instead |
|---|---|---|
| Response / ETA / dispatch cache | ✅ yes | Ideal. A stale read is a cheap miss. |
| Short-lived UI or session-ish state | ✅ yes | Fine when last-write-wins is acceptable. |
| A fetched third-party token | ✅ yes | Single writer, tolerant of staleness. |
| Dedup / "process this once" marker | ❌ no | **No atomicity.** Two concurrent workers can both see a miss and both proceed. Use a D1 `UNIQUE` constraint (`INSERT OR IGNORE`). |
| A lock / mutex | ❌ no | No compare-and-set exists. Use a D1 row as the lock (a conditional `UPDATE` claims it) — or a Postgres advisory lock if you've already escalated to `provision_postgres`. |
| Exact counters / rate limits | ⚠️ approximate | Concurrent writes lose updates. Fine for a soft limit, never for billing or an exact quota. |

- **Eventually consistent.** A read can return a value up to ~60s old, and a read right after a write may
  still see the previous value in another region. Never treat a `get` as authoritative state.
- **Minimum TTL is 60 seconds.** For a shorter freshness window (say 20s), store `{ value, at }` and check
  `Date.now() - at` on read — the TTL is only the eviction backstop.
- **Don't hammer one key.** Sustained writes to the *same* key are throttled; spread across keys.
- **There is a per-project key cap.** Go over it and the platform *withholds* `env.APP_KV` from further
  deploys until you clean up. Check with the **`get_kv_usage`** MCP tool; delete keys (or ask an admin to
  raise the cap) and it comes back. Always give cache keys a TTL so the namespace self-drains.
- **Relational or queried data still belongs in D1** (`env.APP_DB`). KV has no queries, no
  transactions, and no joins.

## 6f. Scheduled jobs — `env.FDN_CRON_SECRET`

Only if the spec has recurring work. Tenants have no Cron Trigger of their own: **the governor holds the
schedule and calls your app**. Register each job once with `provision_cron(project, name, schedule)` on
the Hub MCP (idempotent), then implement the route.

Job `papercut-sync` on a 15-minute schedule arrives as:

```
POST /api/cron/papercut-sync
X-Fdn-Cron-Secret: <a per-project secret == env.FDN_CRON_SECRET>
X-Fdn-Cron-Job:    papercut-sync
X-Fdn-Cron-Time:   2026-07-26T10:15:00.000Z
```

```ts
// worker/index.ts
if (url.pathname.startsWith("/api/cron/")) {
  // MANDATORY. Without this, anyone on the internet can trigger your scheduled work.
  if (request.headers.get("X-Fdn-Cron-Secret") !== env.FDN_CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  const job = url.pathname.slice("/api/cron/".length);
  try {
    if (job === "papercut-sync") await syncPapercut(env);
    else return new Response("unknown job", { status: 404 });
  } catch (e) {
    return new Response(String(e), { status: 500 });   // fail LOUD — see below
  }
  return new Response("ok");
}
```

Rules that matter:

- **The secret check is not optional.** `/api/cron/*` is reachable from the public internet on your
  `-pub` host. `env.FDN_CRON_SECRET` is injected by the governor at deploy (it appears once the project
  has at least one registered job) and is never shown to you or your agent. A plain `!==` compare is
  enough — it is a 256-bit value.
- **Return 2xx for success, anything else for failure.** The platform reads only the status code; it never
  reads your response body. So do NOT return `200 {"ok":false}` — that records as healthy. A thrown error,
  a 5xx, or a timeout is recorded as a failure with a rising `consecutiveFailures` count you can see with
  `list_cron_jobs(project)`. Check that tool when a job "isn't running".
- **Schedules are 5-field UTC cron** (`*/15 * * * *`, `0 * * * *`, `30 2 * * *`, `0 9 * * 1`). No `@daily`,
  no seconds, no timezones — do your own local-time conversion inside the handler. The platform ticks
  every 5 minutes, so that is the finest granularity, and missed occurrences are not backfilled.
- **10 jobs per project.** `delete_cron_job` frees a slot — and is also how you CHANGE a schedule
  (`provision_cron` is idempotent and will not repoint an existing job). `set_cron_enabled` pauses one.
- **CPU is the real limit, not the timeout.** A job may WAIT up to 300 s (`timeoutMs`, default 60 s) on an
  upstream API or your database — that is fine. But a Worker is terminated at ~30 s of CPU, so anything
  compute-heavy or unbounded (a full-table migration, thousands of rows) **must be chunked**: process a
  bounded batch, save a cursor in your own D1 table, return 200, and let the next tick continue. Raising
  `timeoutMs` does not buy CPU.
- **Overlap is handled for you** — a job still running when the next tick fires is skipped, not run twice.
  Still make each run idempotent, since a retry after a network failure is always possible.
- **Only full-stack apps can be scheduled.** A static-only build has no `_worker.js` to invoke.

## 6g. Realtime — live updates without polling

Only for screens that must change without a refresh (dashboard, notifications bell, ops board, live map).
Enable it once per project with `provision_realtime` (Hub MCP), then redeploy so the bindings land.

**Read this first: this is NOT Supabase Realtime.** There is **no database-change feed** — nothing appears
on a channel because a row changed. Your server publishes explicitly after it writes. Messages are
fire-and-forget: no history, no replay, and a client that was offline missed them. So always load current
state with a normal `useQuery` on mount and treat the socket as *updates on top* of that.

**Server publishes** (`worker/index.ts`) — right after the write that changed something:

```ts
async function publish(env: Env, channel: string, event: string, data: unknown) {
  if (!env.FDN_REALTIME_KEY) return; // realtime not provisioned — degrade to plain responses
  await fetch(`${env.FDN_REALTIME_URL}/realtime/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.FDN_REALTIME_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ channel, event, data }),
  });
}
// e.g. after INSERT INTO orders …
await publish(env, "orders", "created", { id, status });
```

**Server mints a browser token** — one `/api` route the client calls before connecting. This is where YOU
decide whether this end-user may watch this channel; the governor does not know your authorization rules:

```ts
// GET /api/realtime-token?channel=orders
const res = await fetch(`${env.FDN_REALTIME_URL}/realtime/token`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.FDN_REALTIME_KEY}`, "content-type": "application/json" },
  body: JSON.stringify({ channel: "orders" }),
});
return Response.json(await res.json()); // { url, expiresInSeconds, … }
```

**Browser subscribes** — fetch a token, open the socket, invalidate the query it feeds:

```ts
const { url } = await fetch("/api/realtime-token?channel=orders").then((r) => r.json());
const ws = new WebSocket(url);
ws.onmessage = (e) => {
  const { channel, event, data, ts } = JSON.parse(e.data);
  queryClient.invalidateQueries({ queryKey: ["orders"] }); // or patch the cache from `data`
};
```

Rules that bite if ignored:
- **Never ship `FDN_REALTIME_KEY` to the browser.** It is a publish credential. Browsers get tokens.
- A token is one project + one channel + ~60s + read-only. Fetch a fresh one on reconnect; several
  channels means several tokens/sockets.
- Subscribers cannot publish — a client frame is refused, not fanned out. Only `"ping"` is answered
  (`"pong"`), for proxy keep-alive.
- Channel/event names: 1–63 chars of `[A-Za-z0-9._:-]`, starting alphanumeric. No wildcards.
- Per-project caps, server-enforced: 100 concurrent connections, 600 publishes/min, 240 tokens/min,
  32 KiB per message. Over-cap publishes get `429` — don't publish in a tight loop; publish once per
  meaningful change. Use `get_realtime_usage` to see live connections and current publish rate.

## 6h. AI — `env.FDN_AI_KEY` / `env.FDN_AI_URL`

Only if the spec needs inference. Run `provision_ai(project)` once — the governor mints a revocable
project key, applies a spend cap, and injects the key plus the gateway URL at the next deploy. The key
is never returned to you.

```ts
// worker/index.ts — server-side only. Never ship the key to the browser.
const res = await fetch(`${env.FDN_AI_URL}/ai`, {
  method: "POST",
  headers: { authorization: `Bearer ${env.FDN_AI_KEY}`, "content-type": "application/json" },
  body: JSON.stringify({ model: "<one of the allowlisted models>", messages, max_tokens: 512 }),
});
const { response } = await res.json(); // the completion text
```

- **The gateway serves exactly `POST /ai` (and `GET /healthz`) — nothing else.** This is NOT an
  OpenAI-compatible endpoint: there is no `/v1/chat/completions`, and there is no `/<model-id>` path
  either (that shape is `env.AI.run` *inside* Cloudflare, which this is not). The model name goes in the
  request BODY as `model`, never in the URL — a call built either way 404s.
- `provision_ai` returns the **allowlisted model shortlist**. Calling a model outside it is refused —
  read the list rather than guessing a model name.
- The completion comes back as the response body's `response` field:
  `{ model, project, response, result, usage, cost }`.
- Spend is capped per project and enforced server-side. `get_ai_usage(project)` shows what you have
  spent; check it before assuming a failure is a bug.
- Degrade when it is absent: `if (!env.FDN_AI_KEY) return …` — a project that never provisioned AI
  should still serve, not 500.

## 7. Build

```bash
cd <project-dir> && npm install && npm run build
```
This runs `vite build` (StyleX compiles to atomic CSS) then esbuilds `worker/index.ts` → `dist/_worker.js`.
Verify: `dist/index.html` exists at the root, `dist/assets/*.css` is non-empty (StyleX emitted), and the
zip of `dist/` is < 10 MB / < 200 files / < 5 MB per file.

## 7a. Two failed fixes on the same error — stop and investigate

If an auto-fix attempt on the same build or runtime error fails twice in a row, STOP re-editing. Read
the actual error output (not just the last diff), state a concrete hypothesis for the root cause, and
verify it against the logs/stack trace before touching code again. A third blind edit is a guess, not
a fix.

## 8. Hand off

Report what you built (routes, API, style guide applied) and: **"Run `/fdn:deploy` to ship it."** Do not
deploy here.

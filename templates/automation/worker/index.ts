// Tenant Worker for the automation boilerplate — the emphasis is the server side. A job is triggered by
// POST /api/run (wire an external scheduler to that URL for recurring work; tenant cron triggers aren't
// exposed). Runs are persisted in Neon when a database is provisioned; otherwise kept in memory.
import { SAMPLE_RUNS } from "../src/sample-data";
/**
 * Every binding a Foundational builders tenant can receive. All optional on purpose: a binding only exists
 * after you provision it, so an app that provisions nothing still type-checks, and one that
 * provisions storage gets `env.APP_BUCKET` typed without touching this file.
 *
 * APP_*   you own it — a resource you call methods on.
 * GRAIN_* the platform issues it — a credential you read and never set.
 *
 * Provision with the Hub MCP (`provision_database`, `provision_storage`, `provision_kv`,
 * `provision_cron`, `provision_realtime`, `provision_ai`), then redeploy so the binding lands.
 */
interface Env {
  /** Neon Postgres. Use @neondatabase/serverless — the `pg` driver does not run on Workers. */
  DATABASE_URL?: string;
  /** R2, yours. Never write to BUNDLES: that is the shared bucket serving every project's assets. */
  APP_BUCKET?: R2Bucket;
  /** KV, yours. A cache, not Redis: no atomic increment, min 60s TTL, eventually consistent. */
  APP_KV?: KVNamespace;
  /** Verify this on every POST /api/cron/<job> before doing any work. */
  FDN_CRON_SECRET?: string;
  /** Publish from your server. There is no database-change feed. */
  FDN_REALTIME_KEY?: string;
  FDN_REALTIME_URL?: string;
  /** Governed, spend-capped inference. */
  FDN_AI_KEY?: string;
  FDN_AI_URL?: string;
}

interface Run { id: string; ranAt: string; status: string }
// Seeded with invented sample runs (src/sample-data.ts) so the status page has history on first
// deploy — never an empty table before anyone hits "Run now". Real runs unshift alongside them.
const memoryRuns: Run[] = [...SAMPLE_RUNS];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "gb-automation", time: new Date().toISOString(), db: env.DATABASE_URL ? "configured" : "not-provisioned" });
    }

    if (url.pathname === "/api/run" && request.method === "POST") {
      const run: Run = { id: crypto.randomUUID(), ranAt: new Date().toISOString(), status: "ok" };
      // TODO: your job logic here. Example persistence when a DB is provisioned:
      if (env.DATABASE_URL) {
        try {
          const { neon } = await import("@neondatabase/serverless");
          const sql = neon(env.DATABASE_URL);
          await sql`CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, ran_at TIMESTAMPTZ, status TEXT)`;
          await sql`INSERT INTO runs (id, ran_at, status) VALUES (${run.id}, ${run.ranAt}, ${run.status})`;
        } catch (e) {
          return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
        }
      } else {
        memoryRuns.unshift(run);
      }
      return json({ ok: true, run });
    }

    if (url.pathname === "/api/runs") {
      if (env.DATABASE_URL) {
        try {
          const { neon } = await import("@neondatabase/serverless");
          const sql = neon(env.DATABASE_URL);
          const rows = await sql`SELECT id, ran_at as "ranAt", status FROM runs ORDER BY ran_at DESC LIMIT 20`;
          // Table exists but nobody has run a job yet on this fresh deploy — show sample history
          // instead of an empty table.
          if (rows.length === 0) return json({ runs: SAMPLE_RUNS, source: "sample" });
          return json({ runs: rows, source: "live" });
        } catch {
          return json({ runs: SAMPLE_RUNS, source: "sample" });
        }
      }
      // No database provisioned yet: sample runs seed memoryRuns above, so this is never empty either.
      return json({ runs: memoryRuns.slice(0, 20), source: "sample" });
    }

    return json({ error: "not found" }, 404);
  },
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

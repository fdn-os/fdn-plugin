// Tenant Worker for the dashboard boilerplate. Serves /api/metrics (Neon-backed once provisioned; a
// realistic fallback otherwise). The Hub wrapper serves the static bundle for everything else.
import { SAMPLE_METRICS } from "../src/sample-data";
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "gb-dashboard", time: new Date().toISOString() });
    }
    if (url.pathname === "/api/metrics") {
      // Invented sample rows (src/sample-data.ts) until real aggregate queries against
      // env.DATABASE_URL are wired — never an empty dashboard on first deploy.
      return json({ ...SAMPLE_METRICS, source: "sample" });
    }
    return json({ error: "not found" }, 404);
  },
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

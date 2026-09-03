// Tenant Worker (full-stack bundle). The Hub wrapper serves the static R2 bundle for every
// request EXCEPT /api/*, which it delegates here. Tenants get a Neon DB (env.DATABASE_URL, once
// provisioned) + read-only secrets. Four further primitives are opt-in via the Hub MCP and
// land as extra bindings on the NEXT deploy — env.APP_BUCKET (provision_storage), env.APP_KV
// (provision_kv), env.FDN_CRON_SECRET (provision_cron) and env.FDN_REALTIME_KEY/_URL
// (provision_realtime). Declare the ones you use on this interface. See /fdn:build §4a–§4d.
import { SAMPLE_ORDERS } from "../src/sample-data";
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
      return json({ ok: true, service: "gb-app", time: new Date().toISOString(), db: env.DATABASE_URL ? "configured" : "not-provisioned" });
    }

    // Example Neon-backed route. Serves invented sample rows (src/sample-data.ts) until a database
    // is provisioned — never an empty list. Same response shape either way: the frontend never knows
    // or cares which one answered.
    if (url.pathname === "/api/items") {
      if (!env.DATABASE_URL) return json({ items: SAMPLE_ORDERS, source: "sample" });
      try {
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`SELECT now() as now`;
        return json({ items: rows, source: "live" });
      } catch (e) {
        return json({ items: SAMPLE_ORDERS, source: "sample", error: e instanceof Error ? e.message : String(e) }, 500);
      }
    }

    return json({ error: "not found" }, 404);
  },
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

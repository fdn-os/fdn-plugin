// Invented sample data — the ONLY place fake runs live for this template. The status page renders
// from this on first deploy, with zero setup, so "Run now" has history to sit alongside instead of
// an empty table; swap sample for real by wiring worker/index.ts's /api/runs to Neon once a database
// is provisioned. Values are fictional — never real job or customer data.

export interface Run {
  id: string;
  ranAt: string;
  status: string;
}

export const SAMPLE_RUNS: readonly Run[] = [
  { id: "b7e4c2a1-8f3d-4a12-9c6e-1d2f3a4b5c6d", ranAt: "2026-08-01T09:12:00.000Z", status: "ok" },
  { id: "3c9a7e5f-2b1d-4e88-9f0a-6b7c8d9e0f11", ranAt: "2026-08-01T08:12:00.000Z", status: "ok" },
  { id: "9f1e2d3c-4b5a-4678-8c9d-0e1f2a3b4c5d", ranAt: "2026-08-01T07:12:00.000Z", status: "failed" },
];

// Invented sample data — the ONLY place fake metrics live for this template. The dashboard renders
// from this on first deploy, with zero setup; swap sample for real by wiring real aggregate queries
// against env.DATABASE_URL in worker/index.ts, nowhere else. Values are fictional — never real
// revenue, users, or Grain data.

export interface Metric {
  label: string;
  value: string;
  delta: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface SampleMetrics {
  metrics: Metric[];
  series: SeriesPoint[];
}

export const SAMPLE_METRICS: SampleMetrics = {
  metrics: [
    { label: "Revenue", value: "$48.2k", delta: "+12%" },
    { label: "Active users", value: "1,284", delta: "+4%" },
    { label: "Orders", value: "312", delta: "+9%" },
  ],
  series: [
    { label: "Mon", value: 32 },
    { label: "Tue", value: 48 },
    { label: "Wed", value: 41 },
    { label: "Thu", value: 64 },
    { label: "Fri", value: 58 },
    { label: "Sat", value: 72 },
    { label: "Sun", value: 51 },
  ],
};

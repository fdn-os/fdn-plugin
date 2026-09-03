import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../tokens.stylex";
import { BarChart } from "../components/bar-chart";
import { Badge, Button, Field, Input, Modal, Select, Skeleton, surfaces, Tabs, useToast } from "../components/ui";
import { SAMPLE_METRICS } from "../sample-data";

const s = stylex.create({
  head: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" },
  titleWrap: { display: "flex", flexDirection: "column", gap: 4 },
  title: { fontFamily: tokens.fontDisplay, fontSize: tokens.text2xl, fontWeight: 700, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 },
  sub: { fontSize: tokens.textSm, color: tokens.muted, margin: 0 },
  actions: { display: "flex", alignItems: "center", gap: 12 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  metric: { padding: 18 },
  metricTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  metricLabel: { fontSize: tokens.textSm, color: tokens.muted, fontWeight: 500 },
  metricValue: { fontFamily: tokens.fontDisplay, fontSize: 34, fontWeight: 700, letterSpacing: "-0.01em", margin: 0, lineHeight: 1 },

  chartCard: { marginTop: 12, gridColumn: "1 / -1", padding: 18 },
  chartHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  chartTitle: { fontSize: tokens.textSm, fontWeight: 700, margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
});

// Range switching is Tabs (the layoutId pill slides between ranges).
const RANGE_TABS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];
const RANGE_BADGE: Record<string, string> = { "7d": "This week", "30d": "This month", "90d": "This quarter" };

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF summary" },
  { value: "sheet", label: "Google Sheet" },
];

interface Metrics {
  metrics: { label: string; value: string; delta: string }[];
  series: { label: string; value: number }[];
  source?: "sample" | "live";
}

// Invented sample rows (src/sample-data.ts) are the only fallback: the query always has something
// to render on first paint, even before GET /api/metrics resolves.
const FALLBACK: Metrics = { ...SAMPLE_METRICS, source: "sample" };

export function DashboardPage() {
  const toast = useToast();
  const [range, setRange] = useState("7d");
  const { data } = useQuery({
    queryKey: ["metrics", range],
    queryFn: async (): Promise<Metrics> => {
      const res = await fetch(`/api/metrics?range=${range}`);
      if (!res.ok) throw new Error(`api ${res.status}`);
      return res.json();
    },
    initialData: FALLBACK,
  });

  // Brief simulated first load so the skeleton state is visible; replace with real query state.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(t);
  }, []);

  // New-report modal
  const [modalOpen, setModalOpen] = useState(false);
  const [building, setBuilding] = useState(false);
  const [reportName, setReportName] = useState("");
  const [format, setFormat] = useState<string | null>("csv");
  const createReport = () => {
    setBuilding(true);
    // Simulated build — swap for a real POST /api/reports.
    setTimeout(() => {
      setBuilding(false);
      setModalOpen(false);
      toast.success(`Report “${reportName.trim() || "Untitled"}” queued`);
      setReportName("");
    }, 700);
  };

  return (
    <div>
      <div {...stylex.props(s.head)}>
        <div {...stylex.props(s.titleWrap)}>
          <h1 {...stylex.props(s.title)}>Overview</h1>
          <p {...stylex.props(s.sub)}>Your product at a glance.</p>
        </div>
        <div {...stylex.props(s.actions)}>
          {data.source === "sample" && <Badge variant="muted">Sample data</Badge>}
          <Tabs tabs={RANGE_TABS} value={range} onChange={setRange} ariaLabel="Date range" />
          <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>New report</Button>
        </div>
      </div>

      <div {...stylex.props(s.grid)}>
        {data.metrics.map((m) => (
          <div key={m.label} {...stylex.props(surfaces.panel, s.metric)}>
            <div {...stylex.props(s.metricTop)}>
              <span {...stylex.props(s.metricLabel)}>{m.label}</span>
              {/* keyed by range so the delta badge re-pops when the range changes */}
              {ready && <Badge key={range} nudge variant={m.delta.startsWith("-") ? "danger" : "success"}>{m.delta}</Badge>}
            </div>
            {ready
              ? <p {...stylex.props(s.metricValue)}>{m.value}</p>
              : <Skeleton width={110} height={34} />}
          </div>
        ))}
        <div {...stylex.props(surfaces.panel, s.chartCard)}>
          <div {...stylex.props(s.chartHead)}>
            <p {...stylex.props(s.chartTitle)}>Daily volume</p>
            <Badge variant="muted">{RANGE_BADGE[range]}</Badge>
          </div>
          {ready ? <BarChart data={data.series} /> : <Skeleton height={160} />}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New report"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={building} onClick={createReport}>Create report</Button>
          </>
        }
      >
        <div {...stylex.props(s.form)}>
          <Field label="Report name">
            <Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder={`Overview — last ${range}`} autoFocus />
          </Field>
          <Field label="Format" hint="Delivered to your email when ready.">
            <Select options={FORMAT_OPTIONS} value={format} onChange={setFormat} ariaLabel="Report format" style={{ width: "100%" }} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

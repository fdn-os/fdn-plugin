import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../tokens.stylex";
import {
  Badge, Button, Field, Input, Menu, Modal, Skeleton, surfaces,
  Table, TBody, TD, TH, THead, TR, TableEmpty, Tabs, useToast,
} from "../components/ui";

const s = stylex.create({
  head: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" },
  titleWrap: { display: "flex", flexDirection: "column", gap: 4 },
  title: { fontFamily: tokens.fontDisplay, fontSize: tokens.text2xl, fontWeight: 700, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 },
  sub: { fontSize: tokens.textSm, color: tokens.muted, margin: 0, maxWidth: 560, lineHeight: 1.55 },
  actions: { display: "flex", alignItems: "center", gap: 8 },
  toolLabel: { fontSize: tokens.textSm, fontWeight: 600 },
  count: { marginLeft: "auto", fontSize: tokens.textXs, color: tokens.muted },
  mono: { fontFamily: tokens.fontMono, fontSize: "0.85em", backgroundColor: tokens.surface2, borderWidth: 1, borderStyle: "solid", borderColor: tokens.line, borderRadius: 5, padding: "1px 5px", color: tokens.text },
});

const RUN_TABS = [
  { value: "all", label: "All" },
  { value: "ok", label: "OK" },
  { value: "failed", label: "Failed" },
];

interface Run { id: string; ranAt: string; status: string }
interface RunsResponse { runs: Run[]; source?: "sample" | "live" }

// Content-shaped loading rows so the table doesn't jump when runs arrive.
function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TR key={i}>
          <TD><Skeleton width={72} /></TD>
          <TD><Skeleton width={150} /></TD>
          <TD><Skeleton width={48} height={20} style={{ borderRadius: 999 }} /></TD>
        </TR>
      ))}
    </>
  );
}

export function StatusPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [flashId, setFlashId] = useState<string | null>(null);
  const pendingFlash = useRef(false);
  const loadingToast = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: async (): Promise<RunsResponse> => (await fetch("/api/runs")).json(),
  });
  const runs = data?.runs ?? [];

  const run = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/run", { method: "POST" });
      if (!res.ok) throw new Error(`api ${res.status}`);
      return res.json();
    },
    onMutate: () => {
      // loading toast persists, then is replaced in place on settle
      loadingToast.current = toast.loading("Running job…");
    },
    onSuccess: () => {
      pendingFlash.current = true;
      toast.success("Run complete", { id: loadingToast.current ?? undefined });
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: () => {
      toast.error("Run failed — check worker logs", { id: loadingToast.current ?? undefined });
    },
  });

  // When fresh runs land after a triggered job, dispatch-flash the newest row.
  useEffect(() => {
    if (pendingFlash.current && runs.length > 0) {
      pendingFlash.current = false;
      setFlashId(runs[0].id);
    }
  }, [runs]);

  // Schedule modal
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cron, setCron] = useState("0 * * * *");
  const saveSchedule = () => {
    setScheduleOpen(false);
    toast.success(`Schedule saved — ${cron}`);
  };

  const visible = useMemo(() => runs.filter((r) =>
    tab === "all" ? true : tab === "ok" ? r.status === "ok" : r.status !== "ok",
  ), [runs, tab]);

  return (
    <div>
      <div {...stylex.props(s.head)}>
        <div {...stylex.props(s.titleWrap)}>
          <h1 {...stylex.props(s.title)}>Automation</h1>
          <p {...stylex.props(s.sub)}>
            A worker-centric task runner. Trigger a job below; recent runs persist in Neon. Wire an external
            scheduler to <code {...stylex.props(s.mono)}>POST /api/run</code> for recurring jobs.
          </p>
        </div>
        <div {...stylex.props(s.actions)}>
          <Button variant="primary" size="md" loading={run.isPending} onClick={() => run.mutate()}>
            {run.isPending ? "Running…" : "Run now"}
          </Button>
          <Menu
            ariaLabel="More actions"
            items={[
              { label: "Refresh runs", onSelect: () => qc.invalidateQueries({ queryKey: ["runs"] }) },
              { label: "Configure schedule…", onSelect: () => setScheduleOpen(true) },
              { label: "Copy trigger endpoint", onSelect: () => { void navigator.clipboard.writeText(`${location.origin}/api/run`); } },
            ]}
          />
        </div>
      </div>

      <div {...stylex.props(surfaces.panel)}>
        <div {...stylex.props(surfaces.toolbar)}>
          <span {...stylex.props(s.toolLabel)}>Recent runs</span>
          <Tabs tabs={RUN_TABS} value={tab} onChange={setTab} ariaLabel="Filter runs by result" />
          {data?.source === "sample" && <Badge variant="muted">Sample data</Badge>}
          {run.isPending && <Badge pulse>Job in flight</Badge>}
          <span {...stylex.props(s.count)}>{visible.length} {visible.length === 1 ? "run" : "runs"}</span>
        </div>
        <Table minWidth={440}>
          <THead>
            <TH>Run</TH>
            <TH>Ran at</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {isLoading ? (
              <SkeletonRows />
            ) : visible.length === 0 ? (
              <TableEmpty colSpan={3} title="No runs yet" hint="Hit “Run now” to trigger the first one." />
            ) : (
              visible.map((r) => (
                <TR key={r.id} flash={r.id === flashId}>
                  <TD mono>{r.id.slice(0, 8)}</TD>
                  <TD>{r.ranAt}</TD>
                  <TD><Badge variant={r.status === "ok" ? "success" : "danger"}>{r.status}</Badge></TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Configure schedule"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveSchedule}>Save schedule</Button>
          </>
        }
      >
        <Field label="Cron expression" hint="Runs in UTC. e.g. 0 * * * * = hourly.">
          <Input value={cron} onChange={(e) => setCron(e.target.value)} autoFocus
            style={{ fontFamily: "ui-monospace, Menlo, monospace" }} />
        </Field>
      </Modal>
    </div>
  );
}

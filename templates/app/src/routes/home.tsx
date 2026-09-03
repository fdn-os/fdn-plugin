import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../tokens.stylex";
import {
  Badge, Button, Checkbox, Field, Input, Modal, SearchInput, Select, Skeleton, surfaces,
  Table, TBody, TD, TH, THead, TR, TableEmpty, Tabs, useToast, type SortDir,
} from "../components/ui";
import { SAMPLE_ORDERS, type Order as SampleOrder, type OrderStatus } from "../sample-data";

const s = stylex.create({
  head: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" },
  titleWrap: { display: "flex", flexDirection: "column", gap: 4 },
  title: { fontFamily: tokens.fontDisplay, fontSize: tokens.text2xl, fontWeight: 700, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 },
  sub: { fontSize: tokens.textSm, color: tokens.muted, margin: 0 },
  actions: { display: "flex", alignItems: "center", gap: 8 },
  meta: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: tokens.textXs, color: tokens.muted },
  selectedNote: { color: tokens.text, fontWeight: 600 },
  statusCell: { display: "inline-flex", alignItems: "center", gap: 6 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  // Visually-hidden but announced: an actions column needs a header for screen readers.
  srOnly: { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 },
});

type Status = OrderStatus;
const STATUS_META: Record<Status, { label: string; variant: "success" | "warning" | "muted" | "danger" }> = {
  delivered: { label: "Delivered", variant: "success" },
  transit: { label: "In transit", variant: "warning" },
  preparing: { label: "Preparing", variant: "muted" },
  failed: { label: "Failed", variant: "danger" },
};

// Tabs replace the old status <Select> here: All / Open / Delivered / Failed.
const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];
const TAB_MATCH: Record<string, readonly Status[]> = {
  all: ["delivered", "transit", "preparing", "failed"],
  open: ["transit", "preparing"],
  delivered: ["delivered"],
  failed: ["failed"],
};

const COURIER_OPTIONS = [
  { value: "bike", label: "Bike courier" },
  { value: "van", label: "Van" },
  { value: "pickup", label: "Self-collection" },
];

type Order = SampleOrder;

interface ItemsResponse { items: readonly Order[]; source?: "sample" | "live" }

const money = (n: number) => `$${n.toFixed(2)}`;
const nowHHMM = () => new Date().toTimeString().slice(0, 5);

interface Health { ok: boolean }

// Content-shaped loading rows — the table keeps its layout while data arrives.
function SkeletonRows() {
  return (
    <>
      {[92, 118, 74, 104].map((w, i) => (
        <TR key={i}>
          <TD check><Skeleton width={18} height={18} /></TD>
          <TD><Skeleton width={64} /></TD>
          <TD><Skeleton width={w} /></TD>
          <TD><Skeleton width={76} height={20} style={{ borderRadius: 999 }} /></TD>
          <TD numeric><Skeleton width={52} style={{ marginLeft: "auto" }} /></TD>
          <TD numeric><Skeleton width={38} style={{ marginLeft: "auto" }} /></TD>
          <TD actions><Skeleton width={62} height={30} /></TD>
        </TR>
      ))}
    </>
  );
}

export function HomePage() {
  const toast = useToast();
  const { isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<Health> => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`api ${res.status}`);
      return res.json();
    },
  });
  // `nudge` fires its one-shot pop when the healthy badge first appears.
  const apiBadge = isLoading ? <Badge variant="muted">Checking…</Badge>
    : isError ? <Badge variant="danger">API down</Badge>
    : <Badge variant="success" nudge>API healthy</Badge>;

  // Orders come from GET /api/items — invented sample rows (src/sample-data.ts) until a database is
  // provisioned, so the table is never empty on first deploy. `initialData` keeps the first paint
  // identical to what the worker will answer with.
  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: async (): Promise<ItemsResponse> => {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error(`api ${res.status}`);
      return res.json();
    },
    initialData: { items: SAMPLE_ORDERS, source: "sample" },
  });

  const [rows, setRows] = useState<readonly Order[]>(items.items);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [amountSort, setAmountSort] = useState<SortDir>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // Brief simulated fetch so the skeleton state is visible; replace with a real query.
  const [tableReady, setTableReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTableReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  // New-order modal
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [courier, setCourier] = useState<string | null>("bike");
  const nextIdRef = useRef(2046);

  const createOrder = () => {
    if (!customer.trim()) { toast.error("Customer name is required"); return; }
    setCreating(true);
    const id = `GR-${nextIdRef.current++}`;
    // Simulated write — swap for a real POST /api/orders.
    setTimeout(() => {
      setRows((r) => [{ id, customer: customer.trim(), status: "preparing" as const, amount: Number(amount) || 0, when: nowHHMM() }, ...r]);
      setCreating(false);
      setModalOpen(false);
      setCustomer(""); setAmount(""); setCourier("bike");
      setFlashId(id); // dispatch-flash the new row
      toast.success(`Order ${id} created`);
    }, 600);
  };

  const [exporting, setExporting] = useState(false);
  const exportOrders = () => {
    setExporting(true);
    setTimeout(() => { setExporting(false); toast.success("Export ready — 5 orders"); }, 900);
  };

  const orders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = TAB_MATCH[tab] ?? TAB_MATCH.all;
    const filtered = rows.filter((o) =>
      allowed.includes(o.status) &&
      (q === "" || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)),
    );
    if (amountSort == null) return filtered;
    return [...filtered].sort((a, b) => (amountSort === "asc" ? a.amount - b.amount : b.amount - a.amount));
  }, [rows, query, tab, amountSort]);

  const allVisibleSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const someVisibleSelected = orders.some((o) => selected.has(o.id));

  const toggleAll = (checked: boolean) => {
    const next = new Set(selected);
    for (const o of orders) checked ? next.add(o.id) : next.delete(o.id);
    setSelected(next);
  };
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  return (
    <div>
      <div {...stylex.props(s.head)}>
        <div {...stylex.props(s.titleWrap)}>
          <h1 {...stylex.props(s.title)}>Orders</h1>
          <p {...stylex.props(s.sub)}>A Foundational builders app starter — TanStack + StyleX on Cloudflare.</p>
        </div>
        <div {...stylex.props(s.actions)}>
          {apiBadge}
          {items.source === "sample" && <Badge variant="muted">Sample data</Badge>}
          <Button variant="secondary" size="md" loading={exporting} onClick={exportOrders}>Export</Button>
          <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>New order</Button>
        </div>
      </div>

      <div {...stylex.props(surfaces.panel)}>
        <div {...stylex.props(surfaces.toolbar)}>
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search orders…" ariaLabel="Search orders" style={{ width: 240, maxWidth: "50vw" }} />
          <Tabs tabs={STATUS_TABS} value={tab} onChange={setTab} ariaLabel="Filter orders by status" />
          <span {...stylex.props(s.meta)}>
            {selected.size > 0 && <span {...stylex.props(s.selectedNote)}>{selected.size} selected</span>}
            <span>{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
          </span>
        </div>

        <Table minWidth={680}>
          <THead>
            <TH check>
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onChange={toggleAll}
                ariaLabel="Select all orders"
                disabled={orders.length === 0}
              />
            </TH>
            <TH>Order</TH>
            <TH>Customer</TH>
            <TH>Status</TH>
            <TH align="right" sortDir={amountSort} onSort={() => setAmountSort((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"))}>
              Amount
            </TH>
            <TH align="right">Time</TH>
            {/* Actions column: no visible label, but the header cell must exist for a11y. */}
            <TH align="right"><span {...stylex.props(s.srOnly)}>Actions</span></TH>
          </THead>
          <TBody>
            {!tableReady ? (
              <SkeletonRows />
            ) : orders.length === 0 ? (
              <TableEmpty colSpan={7} title="No matching orders" hint="Try a different search or switch tabs." />
            ) : (
              orders.map((o) => (
                <TR
                  key={o.id}
                  flash={o.id === flashId}
                  selected={selected.has(o.id)}
                  onClick={(e) => {
                    // Tap the row to select — but let the checkbox (and any link) handle its own click.
                    if ((e.target as HTMLElement).closest("input,button,a,label")) return;
                    toggleOne(o.id, !selected.has(o.id));
                  }}
                >
                  <TD check>
                    <Checkbox checked={selected.has(o.id)} onChange={(c) => toggleOne(o.id, c)} ariaLabel={`Select order ${o.id}`} />
                  </TD>
                  <TD strong numeric={false} style={{ fontVariantNumeric: "tabular-nums" }}>{o.id}</TD>
                  <TD>{o.customer}</TD>
                  <TD>
                    <span {...stylex.props(s.statusCell)}>
                      <Badge variant={STATUS_META[o.status].variant}>{STATUS_META[o.status].label}</Badge>
                      {o.alert && <Badge pulse>Needs action</Badge>}
                    </span>
                  </TD>
                  <TD numeric>{money(o.amount)}</TD>
                  <TD numeric muted>{o.when}</TD>
                  {/* Row actions live in `<TD actions>`: it gaps the controls AND makes every Button
                    * inside it the compact 30px size. A form-sized button here would dominate the row. */}
                  <TD actions>
                    <Button variant="secondary" onClick={() => { setFlashId(o.id); toast.success(`Order ${o.id} nudged`); }}>Nudge</Button>
                    <Button variant="ghost" onClick={() => toast.info(`Order ${o.id} details`)}>View</Button>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New order"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={createOrder}>Create order</Button>
          </>
        }
      >
        <div {...stylex.props(s.form)}>
          <Field label="Customer">
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Amara Tan" autoFocus />
          </Field>
          <Field label="Amount" hint="In dollars — leave blank for a draft.">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
          </Field>
          <Field label="Courier">
            <Select options={COURIER_OPTIONS} value={courier} onChange={setCourier} ariaLabel="Courier" style={{ width: "100%" }} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

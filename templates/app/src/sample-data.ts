// Invented sample data — the ONLY place fake rows live for this template. The app renders from
// this on first deploy, with zero setup; swap sample for real by wiring a real source HERE,
// nowhere else (point GET /api/items at Neon in worker/index.ts and stop importing this module).
// Names and values are fictional — never real people, vendors, or Grain data.

export type OrderStatus = "delivered" | "transit" | "preparing" | "failed";

export interface Order {
  id: string;
  customer: string;
  status: OrderStatus;
  amount: number;
  when: string;
  alert?: boolean;
}

export const SAMPLE_ORDERS: readonly Order[] = [
  { id: "GR-2041", customer: "Amara Tan", status: "delivered", amount: 48.2, when: "10:24" },
  { id: "GR-2042", customer: "Wei Lim", status: "transit", amount: 62.0, when: "10:31" },
  { id: "GR-2043", customer: "Priya Nair", status: "preparing", amount: 31.5, when: "10:38" },
  { id: "GR-2044", customer: "Daniel Ong", status: "failed", amount: 54.75, when: "10:42", alert: true },
  { id: "GR-2045", customer: "Sofia Reyes", status: "delivered", amount: 29.9, when: "10:55" },
];

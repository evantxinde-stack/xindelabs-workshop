import type { ReactNode } from "react";
import { PRODUCTS } from "@/lib/mayar";

export function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function Section({
  id,
  title,
  sub,
  children,
}: {
  id?: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="panel scroll-mt-20 p-5">
      <div className="mb-4">
        <h2 className="panel-title">{title}</h2>
        {sub && <p className="panel-sub mt-0.5">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function chip(status: string, good: boolean, bad: boolean) {
  if (good) return <span className="chip">{status}</span>;
  if (bad)
    return (
      <span className="chip" style={{ color: "#ff6b6b", borderColor: "rgba(255,90,90,.3)", background: "rgba(255,90,90,.08)" }}>
        {status}
      </span>
    );
  return (
    <span className="chip" style={{ color: "rgba(255,255,255,.6)", borderColor: "rgba(255,255,255,.15)", background: "rgba(255,255,255,.05)" }}>
      {status}
    </span>
  );
}

export type OrderRow = {
  id: string;
  product: string;
  amount: number | null;
  status: string;
  paid_at: string | null;
  created_at: string | null;
};

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl w-full">
        <thead>
          <tr>
            <th>Produk</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Paid At</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const p = PRODUCTS[o.product as keyof typeof PRODUCTS];
            return (
              <tr key={o.id}>
                <td>{p?.name ?? o.product}</td>
                <td>{p?.priceLabel ?? `Rp${o.amount}`}</td>
                <td>{chip(o.status, o.status === "paid", o.status === "failed" || o.status === "closed")}</td>
                <td>{fmt(o.paid_at)}</td>
                <td>{fmt(o.created_at)}</td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-white/40">
                Belum ada orders
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export type EventRow = {
  id: string;
  event_type: string;
  meta: unknown;
  created_at: string | null;
};

export function PipelineTable({ events }: { events: EventRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl w-full">
        <thead>
          <tr>
            <th>Event</th>
            <th>Meta</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="font-mono text-xs">{e.event_type}</td>
              <td className="max-w-[220px] truncate text-xs text-white/45">
                {e.meta ? JSON.stringify(e.meta) : "—"}
              </td>
              <td>{fmt(e.created_at)}</td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-white/40">
                Belum ada events
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export type LogRow = {
  id: string;
  status: string;
  resend_id: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
};

export function EmailLogsTable({ logs }: { logs: LogRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl w-full">
        <thead>
          <tr>
            <th>Status</th>
            <th>Resend ID</th>
            <th>Sent</th>
            <th>Opened</th>
            <th>Clicked</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{chip(l.status, l.status === "sent" || l.status === "delivered", l.status === "bounced")}</td>
              <td className="max-w-[130px] truncate font-mono text-xs text-white/45">{l.resend_id ?? "—"}</td>
              <td>{fmt(l.sent_at)}</td>
              <td>{l.opened_at ? `✓ ${fmt(l.opened_at)}` : "—"}</td>
              <td>{l.clicked_at ? `✓ ${fmt(l.clicked_at)}` : "—"}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-white/40">
                Belum ada logs
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
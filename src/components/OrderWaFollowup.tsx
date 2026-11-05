"use client";

import { useEffect, useState } from "react";
import { fillTemplate, sanitizePhone, waLink } from "@/lib/wa";

type WaTemplate = { id: string; name: string; content: string };
type OrderRow = {
  id: string;
  lead_name: string;
  lead_email: string;
  source: string;
  product: string | null;
  amount: number | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
  whatsapp: string | null;
};

const inputCls = "input-dark";

export function OrderWaFollowup({ orders }: { orders: OrderRow[] }) {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [sel, setSel] = useState("");

  useEffect(() => {
    fetch("/api/admin/wa-templates")
      .then((r) => r.json())
      .then((d) => {
        const list: WaTemplate[] = Array.isArray(d) ? d : [];
        setTemplates(list);
        setSel((s) => s || (list[0]?.id ?? ""));
      })
      .catch(() => {});
  }, []);

  const selTpl = templates.find((t) => t.id === sel);

  const pending = orders.filter((o) => o.status === "pending");
  const paid = orders.filter((o) => o.status === "paid");

  return (
    <>
      {/* Template selector */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-white/60">
          Template WA:
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className={`${inputCls} w-auto`}
            disabled={templates.length === 0}
          >
            {templates.length === 0 && <option value="">Belum ada template</option>}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        {pending.length > 0 && (
          <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 text-xs text-yellow-400">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Orders table */}
      <div className="overflow-x-auto">
        <table className="tbl w-full">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Email</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid At</th>
              <th>Follow-up WA</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((r) => {
              const phone = sanitizePhone(r.whatsapp ?? "");
              const href =
                selTpl && phone
                  ? waLink(phone, fillTemplate(selTpl.content, r.lead_name))
                  : "";
              const isPending = r.status === "pending";
              return (
                <tr key={r.id}>
                  <td>{r.lead_name}</td>
                  <td>{r.lead_email}</td>
                  <td>{r.product || "—"}</td>
                  <td>Rp{Number(r.amount ?? 0).toLocaleString("id-ID")}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPending
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {r.status ?? "—"}
                    </span>
                  </td>
                  <td>
                    {r.paid_at
                      ? new Date(r.paid_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-lg bg-[#00FF88] px-3 py-1.5 text-xs font-bold text-[#04110D] transition hover:shadow-[0_0_18px_#00ff8866]"
                      >
                        Kirim WA
                      </a>
                    ) : (
                      <span className="text-xs text-white/40">
                        {templates.length === 0
                          ? "Buat template dulu"
                          : r.whatsapp
                          ? "Tidak aktif"
                          : "WA kosong"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-white/40">
                  Belum ada orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

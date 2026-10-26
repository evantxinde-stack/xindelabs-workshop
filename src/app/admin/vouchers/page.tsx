import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "build-placeholder-key"
);

import { CreateVoucherForm } from "./create-form";
import MemberPricing from "./member-pricing";
import { admin } from "@/lib/supabase/server";
import { Section } from "@/app/admin/shared";

export default async function VouchersPage() {
  requireAdmin();
  const [{ data }, { data: classes }] = await Promise.all([
    supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
    admin.from("classes").select("id,title,product_type,member_cross_sell_price").order("title"),
  ]);

  return (
    <div>
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">// settings</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Manajemen Voucher</h1>
        <p className="mt-1 text-sm text-white/45">Kode diskon dan harga cross-sell member.</p>
      </header>
      <CreateVoucherForm />
      <MemberPricing classes={classes ?? []} />
      <Section title="Voucher aktif" sub="Daftar kode yang tersimpan di sistem.">
        <div className="overflow-x-auto">
        <table className="tbl w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="py-2 pr-4">Kode</th>
              <th className="py-2 pr-4">Tipe</th>
              <th className="py-2 pr-4">Nilai</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">Max/Used</th>
              <th className="py-2 pr-4">Aktif</th>
              <th className="py-2 pr-4">Kadaluarsa</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((v: any) => (
              <tr key={v.id} className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono">{v.code}</td>
                <td className="py-2 pr-4">{v.type}</td>
                <td className="py-2 pr-4">{v.type === "percent" ? `${v.value}%` : `Rp${Number(v.value).toLocaleString("id-ID")}`}</td>
                <td className="py-2 pr-4">{v.tier}</td>
                <td className="py-2 pr-4">{v.max_uses ?? "-"} / {v.used_count}</td>
                <td className="py-2 pr-4">{v.active ? "Ya" : "Tidak"}</td>
                <td className="py-2 pr-4">{v.expires_at ? new Date(v.expires_at).toLocaleDateString("id-ID") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Section>
    </div>
  );
}

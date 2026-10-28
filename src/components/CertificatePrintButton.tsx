"use client";

export function CertificatePrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-lg border border-[#00ff88]/60 px-4 py-3 font-bold text-[#00ff88] print:hidden">Print / Simpan sebagai PDF</button>;
}

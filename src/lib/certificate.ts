import { isValidEmail } from "./validate.ts";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function certificatePrintTitle(classTitle: string) {
  return `Certificate — ${classTitle}`;
}

export function certificateEmail({ name, email, certificateNumber, classTitle, appUrl }: {
  name?: string | null; email: string; certificateNumber: string; classTitle: string; appUrl: string;
}) {
  if (!isValidEmail(email)) throw new Error(`invalid certificate email: ${email}`);
  const verifyUrl = `${appUrl}/certificate/${encodeURIComponent(certificateNumber)}`;
  const to = email.trim().toLowerCase();
  const safeName = escape(name || "Peserta");
  const subject = `Sertifikat kamu sudah terbit — ${classTitle}`;
  const html = `<div style="font-family:system-ui,sans-serif;color:#111"><h2>Sertifikat kamu sudah terbit 🎉</h2>
<p>Halo ${safeName},</p>
<p>Selamat! Kamu menyelesaikan kelas <strong>${escape(classTitle)}</strong>.</p>
<p>Nomor sertifikat: <strong>${escape(certificateNumber)}</strong></p>
<p><a href="${verifyUrl}" style="display:inline-block;background:#00ff88;color:#04110D;padding:12px 18px;border-radius:8px;font-weight:700;text-decoration:none">Lihat &amp; simpan sertifikat</a></p>
<p style="font-size:13px;color:#666">Halaman sertifikat bisa disimpan sebagai PDF lewat tombol Print / Simpan sebagai PDF.</p>
<p style="font-size:12px;color:#888"><a href="${appUrl}/unsubscribe?email=${encodeURIComponent(to)}">Berhenti berlangganan</a></p></div>`;
  return { to, subject, html, verifyUrl };
}

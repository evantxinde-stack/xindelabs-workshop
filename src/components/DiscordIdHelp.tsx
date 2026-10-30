"use client";
import { useState } from "react";

/**
 * Discord User ID instructions, shared by every form that asks for one
 * (tutorial signup, checkout, member area). Discord ≠ requirement: callers keep the field optional.
 */
export function DiscordIdHelp({
  label = "Cara mendapatkan Discord User ID",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen(!open)} className="text-left text-xs text-[#00ff88] underline">
        {open ? "▾" : "▸"} {label}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/65">
          <b className="text-white">Desktop / PC</b>
          <br />
          Discord → User Settings (ikon roda gigi) → Advanced → aktifkan Developer Mode → tutup settings → klik kanan foto profil atau username kamu → Copy User ID.
          <br />
          <br />
          <b className="text-white">Android</b>
          <br />
          Discord → tap foto profil (kanan bawah) → Settings → Advanced → aktifkan Developer Mode → kembali → tap foto profil sendiri → tombol ⋮ kanan atas → Copy User ID.
          <br />
          <br />
          <b className="text-white">iPhone / iOS</b>
          <br />
          Discord → tap foto profil (kanan bawah) → Settings → Advanced → aktifkan Developer Mode → kembali → tap foto profil sendiri → tombol ⋯ kanan atas → Copy User ID.
          <br />
          <br />
          Yang di-copy adalah deretan angka (17–20 digit), bukan username. Belum punya Discord? Kosongkan saja — akun dan akses tutorial tetap dibuat.
        </div>
      )}
    </div>
  );
}

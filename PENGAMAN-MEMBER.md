# Pengaman Halaman Member — SUDAH AKTIF

Tanggal: 15 Oktober 2026
Status: **SELESAI & TERUJI**

## Yang dilindungi

| Halaman | URL Vercel | URL VPS |
|---|---|---|
| Deck workshop (29 slide) | `https://xindelabs-workshop.vercel.app/deck-workshop` | `http://43.133.131.126/deck-workshop/` |
| Pre-session | `https://xindelabs-workshop.vercel.app/pre-session` | `http://43.133.131.126/pre-session/` |
| Halaman login | `…/auth` | `…/auth` |

Tanpa login, dua halaman itu **tidak dilayani** (dilempar ke halaman login).
Isi deck tidak pernah terkirim ke browser sebelum kodenya benar.

## Cara member masuk

1. Buka `/deck-workshop` → otomatis dilempar ke halaman login
2. Isi **email** yang dipakai saat checkout
3. Isi **kode akses** (lihat tabel di bawah)
4. Klik **Masuk →** → langsung masuk deck

Sesi berlaku **30 hari**, jadi tidak perlu login ulang tiap buka.
Satu login berlaku untuk kedua halaman & kedua host.

## Daftar kode akses — 8 member

Kode ini untuk di-broadcast manual (email / DM / Discord).
**Jangan sebar di grup publik.**

| Email | Tier | Kode Akses |
|---|---|---|
| evant.xinde@gmail.com | lifetime | `XINDE-XEPX-QRBV` |
| pofviews@gmail.com | yearly | `XINDE-CU68-M3ER` |
| zofinofriandi23@gmail.com | yearly | `c0JIzEcoO6H4` |
| babiofficial07@gmail.com | lifetime | `ZmiLvPt2_P9y` |
| raymond.rg6@gmail.com | lifetime | `KRdOlBI5RTb5` |
| endenprima@gmail.com | yearly | `HvX3prOuTGp4` |
| zulnan.blibli@gmail.com | yearly | `m2iHzI__rJHo` |
| yuketokiya@gmail.com | yearly | `ExH4WA5eGjHF` |

> Ambil daftar terbaru dari VPS: `cat /tmp/daftar-akses-member.txt`
> atau dari Supabase: kolom `lms_password` tabel `members`.

## Yang sudah diuji (semua lolos)

**Fungsional** — 8/8 member bisa masuk, di Vercel dan VPS:
- login benar → deck 29 slide kebuka
- login benar → pre-session kebuka
- cookie `HttpOnly` (JavaScript tidak bisa baca)
- reload tetap login; logout → tertutup lagi

**Keamanan** — semua ditolak:
- kode salah, email tak terdaftar, form kosong, kode huruf besar
- cookie dipalsukan (3 variasi)
- 12 trik bypass URL (`index.html`, `..`, `//`, `%2F`, `%00`, huruf besar, dll)
- setelah logout, tekan back → **tidak** menyajikan deck dari cache

**Rate limit** — diblokir setelah 5 percobaan gagal / 15 menit,
dikunci per **IP + email** (ganti IP tetap kena).

## Arsitektur

```
Pengunjung → Vercel (middleware) ──tanya──→ VPS gate ──→ Supabase
                        │                       (satu-satunya
                        └─ Caddy (VPS) ──tanya──→  pegang kunci)
```

- **VPS gate** (`/home/ubuntu/xinde-access-gate/`) — verifikasi login ke
  tabel `members` Supabase, terbitkan cookie bertanda tangan HMAC.
- **Caddy** — `forward_auth` untuk `/deck-workshop*` & `/pre-session*`.
- **Vercel middleware** — proxy keputusan ke gate VPS lewat
  `https://gate.43-133-131-126.sslip.io`. Vercel **tidak** menyimpan kunci apa pun.

Detail teknis: lihat `access-gate/README.md`.

## Kalau ada masalah

| Gejala | Cek |
|---|---|
| Halaman putih "Gate tidak bisa dihubungi" | `sudo systemctl status xinde-access-gate` |
| Member bilang "email/kode salah" | Cek `lms_password` di Supabase, pastikan tidak ada spasi |
| Member baru bayar tapi belum bisa masuk | Isi `lms_password` untuk emailnya |
| Mau cabut akses 1 orang | Kosongkan `lms_password`-nya |
| Mau matikan SEMUA sesi sekarang | Ganti isi `/etc/xinde-gate/session.secret`, lalu `sudo systemctl restart xinde-access-gate` |

Log: `sudo tail -f /var/log/xinde-gate.log`
(`LOGIN OK` / `LOGIN FAIL` / `RATE LIMITED`)

## Yang perlu lo lakukan berikutnya

1. **Sebar 8 kode akses** ke member lewat email/DM/Discord.
2. **Pastikan member baru** otomatis dapat `lms_password` saat bayar
   (sekarang belum — perlu ditambah di alur checkout/n8n).
3. Opsional: ganti kode yang formatnya `XINDE-XXXX-XXXX` biar seragam.

# Access Gate — halaman member cuma buat yang udah beli

Pengaman buat `/deck-workshop` dan `/pre-session`. Tanpa login, dua halaman itu
**tidak dilayani sama sekali** — bukan cuma disembunyikan di JavaScript.

## Cara kerjanya

```
Pengunjung                     Vercel                     VPS (gate)
    |                             |                          |
    |-- buka /deck-workshop ----->|                          |
    |                             |-- ada cookie valid? ---->|  /verify
    |                             |<-- 200 (boleh) / 302 ----|
    |<-- halaman deck ------------|                          |
```

1. **Gate VPS** (`server.js`, port 3020) — satu-satunya tempat yang pegang
   kunci Supabase. Dia yang verifikasi email + kode akses ke tabel `members`.
2. **Caddy** (VPS) — pakai `forward_auth`: tiap request ke 2 halaman itu
   ditanya dulu ke gate. Belum login → dilempar ke `/auth`.
3. **Vercel** (middleware) — nanya ke gate VPS lewat HTTPS
   (`gate.43-133-131-126.sslip.io`). **Tidak** menyimpan kunci apa pun.

Cookie sesi (`xinde_access`) ditandatangani HMAC-SHA256, `HttpOnly`,
`SameSite=Lax`, berlaku 30 hari. Karena kunci tanda tangannya sama, **satu login
berlaku di dua host** (Vercel & VPS).

## Endpoint gate VPS

| Endpoint | Fungsi |
|---|---|
| `GET /verify?next=…` | Dipanggil Caddy & Vercel middleware. 200 = boleh, 302 = ke `/auth` |
| `GET /auth` | Halaman login |
| `POST /api/login` | Proses login (form: `email`, `code`, `next`) |
| `GET /api/logout` | Hapus cookie |
| `GET /api/me` | Info sesi (JSON) |
| `GET /health` | Cek hidup |

## Berkas

| Berkas | Tempat |
|---|---|
| `server.js` | `/home/ubuntu/xinde-access-gate/server.js` |
| `login.html` | `/home/ubuntu/xinde-access-gate/login.html` |
| `xinde-access-gate.service` | `/etc/systemd/system/` |
| Supabase key | `/etc/xinde-gate/supabase-service.key` (mode 600) |
| Kunci tanda tangan | `/etc/xinde-gate/session.secret` (mode 600) |
| Log | `/var/log/xinde-gate.log` |

## Perintah harian

```bash
sudo systemctl status xinde-access-gate     # cek status
sudo systemctl restart xinde-access-gate    # restart
sudo tail -f /var/log/xinde-gate.log        # lihat log (LOGIN OK / FAIL / RATE LIMITED)
```

## Mengelola akses member

Akses ditentukan tabel `members` di Supabase:

- `status` harus `paid` / `active` / `lifetime` / `trial`
- `lms_password` = kode akses member itu
- `paid_until` (opsional) = tanggal kedaluwarsa

**Kasih akses:** isi `lms_password` dengan kode acak.
**Cabut akses:** kosongkan `lms_password` (sesi yang sudah jalan tetap hidup
sampai kedaluwarsa 30 hari — kalau mendesak, ganti `SESSION_SECRET` lalu
restart gate, itu langsung mematikan semua sesi).

## Keamanan

- Kode akses **tidak pernah** dikirim ke browser; dicek di server.
- Bandingkan kode pakai waktu konstan (anti timing attack).
- Pesan error disamakan ("Email atau kode akses salah") supaya email terdaftar
  tidak bisa ditebak.
- Rate limit 5 percobaan gagal / 15 menit, dikunci per **IP + email** —
  ganti IP pun tetap kena.
- Halaman member dikirim dengan `Cache-Control: no-store` + `Vary: Cookie`,
  jadi menekan tombol back setelah logout tidak menyajikan deck dari cache.
- Fail closed: kalau gate tidak bisa dihubungi, akses **ditolak** (503).

## Kalau perlu di-deploy ulang

```bash
# 1. Service
sudo cp access-gate/server.js /home/ubuntu/xinde-access-gate/server.js
sudo cp access-gate/login.html /home/ubuntu/xinde-access-gate/login.html
sudo cp access-gate/xinde-access-gate.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl restart xinde-access-gate

# 2. Secret (kalau hilang — buat baru)
sudo mkdir -p /etc/xinde-gate
openssl rand -hex 32 | sudo tee /etc/xinde-gate/session.secret
# lalu isi supabase-service.key dengan service_role key dari Supabase
sudo chown -R ubuntu:ubuntu /etc/xinde-gate && sudo chmod 600 /etc/xinde-gate/*
```

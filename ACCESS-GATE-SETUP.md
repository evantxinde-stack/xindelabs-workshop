# Cara Set Env Var di Vercel — biar gate-nya nyala

**Kenapa:** middleware sudah aktif dan menutup `/deck-workshop` + `/pre-session`
(sekarang balas **503**). Supaya bisa login, Vercel butuh 2 nilai rahasia.

---

## Langkah 1 — Ambil nilainya dari VPS

Jalankan di VPS:

```bash
sudo cat /tmp/vercel-env-for-user.txt
```

Lo akan lihat 2 baris. **Copy masing-masing nilai setelah tanda `=`.**
Jangan copy komentar (baris yang mulai `#`).

```
SESSION_SECRET=<64 huruf/angka>
SUPABASE_SERVICE_KEY=<panjang, mulai eyJ...>
```

> Catatan: START dengan `eyJ` dan panjang 219 karakter.
> Kalau kepotong saat copy → login bakal gagal.

---

## Langkah 2 — Buka Vercel

1. Buka https://vercel.com/dashboard
2. Pilih project **xindelabs-workshop**
3. Klik tab **Settings** (di bar atas)
4. Di sidebar kiri klik **Environment Variables**

---

## Langkah 3 — Tambah 2 variabel

Klik tombol **Create New** (atau **Add New**). Isi:

| Field | Isi |
|---|---|
| **Key** | `SESSION_SECRET` |
| **Value** | (nilai SESSION_SECRET dari langkah 1) |
| **Environments** | centang **Production**, **Preview**, **Development** |

Klik **Save**.

Ulangi sekali lagi untuk yang kedua:

| Field | Isi |
|---|---|
| **Key** | `SUPABASE_SERVICE_KEY` |
| **Value** | (nilai SUPABASE_SERVICE_KEY dari langkah 1) |
| **Environments** | centang **Production**, **Preview**, **Development** |

Klik **Save**.

> PENTING: centang **ketiga** environment. Kalau cuma Production,
> URL preview bakal tetap 503.

---

## Langkah 4 — Redeploy (WAJIB)

Env var baru **tidak** langsung dipakai deployment yang sudah jalan.

1. Klik tab **Deployments**
2. Di baris paling atas (deployment terbaru), klik tombol **⋯** (titik tiga)
3. Pilih **Redeploy**
4. Di dialog, **JANGAN** centang "Use existing build cache" → biar fresh
5. Klik **Redeploy**

Tunggu sampai statusnya **Ready** (±1 menit).

---

## Langkah 5 — Verifikasi

Buka: https://xindelabs-workshop.vercel.app/deck-workshop

**Kalau berhasil:** lo langsung dilempar ke halaman login (judul
"Halaman ini cuma buat yang udah *beli*").

**Kalau masih gagal:** halaman putih bertulis "Konfigurasi server belum lengkap".
Berarti env var belum kebaca — ulangi langkah 3–4.

Cek cepat lewat terminal:

```bash
curl -sI https://xindelabs-workshop.vercel.app/deck-workshop | head -3
# Diharapkan: HTTP/2 302  +  location: /auth?next=...
# Kalau 503            → env var belum masuk
```

---

## Langkah 6 — Tes login

Pakai **email + kode akses** yang lo pakai checkout:

1. Isi email
2. Isi kode akses
3. Klik **Masuk →**

Berhasil → langsung masuk ke deck. Cookie berlaku 30 hari, jadi
gak perlu login ulang tiap buka.

---

## Kalau ada yang aneh

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman putih "Konfigurasi server belum lengkap" | Env var belum ada / belum redeploy | Ulangi langkah 3–4 |
| "Email atau kode akses salah" padahal bener | Nilai Value kepotong pas copy | Hapus var, tambah ulang, copy utuh |
| Login sukses tapi balik ke halaman login | Cookie diblok browser | Cek mode incognito, atau setting cookie |
| Halaman 404 setelah login | URL salah ketik | Pakai persis `/deck-workshop` |

---

## Catatan teknis

- Cookie ditandatangani HMAC-SHA256 pakai `SESSION_SECRET`.
  **Nilainya sama persis dengan gate di VPS**, jadi 1 login berlaku di 2 host.
- Kode akses **tidak pernah** dikirim ke browser. Verifikasi di server.
- `SUPABASE_SERVICE_KEY` cuma hidup di function, tidak pernah sampai ke client.
- Ganti kode akses member = update kolom `lms_password` di Supabase.
- Masa berlaku cookie 30 hari; member yang berhenti bayar tinggal ganti/hapus
  `lms_password`-nya, sesi lama tetap jalan sampai kedaluwarsa.

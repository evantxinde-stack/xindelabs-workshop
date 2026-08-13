# 🚀 SETUP GUIDE — Sistem Otomatis Workshop (Vercel + n8n + Mayar)

Panduan lengkap menghubungkan semua komponen. Ikuti urut.

---

## PART A — Frontend (Vercel)

### A1. Push ke GitHub

```bash
cd ~/xindelabs-workshop
git add .
git commit -m "Update: Mayar workflows"
git push origin main
```

### A2. Deploy ke Vercel
1. Buka vercel.com → New Project → import `xindelabs-workshop` dari GitHub
2. Framework preset: **Other** (static)
3. Deploy → dapat URL `https://xindelabs-workshop.vercel.app`

### A3. Ganti placeholder di HTML
- `PIXEL_ID_LO_DISINI` → ID Meta Pixel (Events Manager → Data Sources)
- `n8n.43-133-131-126.sslip.io` → domain n8n publik (Part C)
- `[tanggal workshop]`, `[link form inner circle]`, `[TESTIMONI]`, `[Tahun]`, `[Nama Brand]`

---

## PART B — Mayar (Payment Gateway)

### B1. Daftar & KYC
1. Buka **mayar.id** → Daftar (butuh KTP, no badan usaha)
2. **KYC review** — biasanya 1-3 hari kerja. Sambil nunggu, kerjakan Part C, D, E dulu.
3. Setelah approve:
   - **Pengaturan → API** → buat/generate **API Token** (simpan baik-baik)
   - Catat Merchant ID (kalau ada)

### B2. Bikin Produk di Mayar
1. Dashboard → **Produk** → **Tambah Produk**
2. Nama: "Workshop Closing Naik dengan AI"
3. Harga: Rp 299.000
4. Simpan → **copy Product ID** (di URL/detail produk)

### B3. Set Webhook Callback
1. Dashboard → **Pengaturan → Webhook** (atau Notifikasi)
2. Payment Callback URL:
   `https://n8n.43-133-131-126.sslip.io/webhook/mayar-callback`
3. Simpan

### B4. Channel Pembayaran
- Aktifkan QRIS (wajib — paling laku), VA bank, e-wallet sesuai kebutuhan
- Di Code node workflow create-payment, set `paymentType`: `QRIS` / `VA` / dll

> ⚠️ Cek fee terbaru di mayar.id (estimasi 1.5-2%/transaksi + opsi paket
> bulanan). Jauh lebih gampang daftarnya daripada Tripay.

---

## PART C — Expose n8n ke Publik (Caddy + Domain)

n8n jalan di VPS lo (port 5678), tapi webhook-nya harus bisa diakses publik
dengan HTTPS (Mayar callback & browser butuh HTTPS).

### C1. Butuh domain (atau subdomain)
Contoh: `n8n.xindelabs.id` → A record → `43.133.131.126`
(panduan beli domain murah: Niagahoster/Cloudflare, Rp 100-150rb/thn)

### C2. Konfigurasi Caddy

Edit `/etc/caddy/Caddyfile`:

```caddy
# Webhook n8n — WAJIB HTTPS untuk Mayar callback
n8n.xindelabs.id {
	reverse_proxy localhost:5678
}
```

```bash
sudo systemctl reload caddy
```

Caddy otomatis bikin SSL (Let's Encrypt) — ga perlu config manual.

### C3. Test
```bash
curl https://n8n.xindelabs.id/healthz
```

---

## PART D — Workflow n8n

### D1. Import
1. Buka `http://43.133.131.126:5678` → login
2. **Workflows → Import from File**
3. Import `n8n-workflow-mayar-create-payment.json`
4. Import `n8n-workflow-mayar-callback.json`

### D2. Isi konfigurasi di Code node

**Workflow 1 (create-payment) — Code node "Build Mayar Payload":**
```
MAYAR_API_TOKEN = 'xxxx'        (dari dashboard Mayar → API)
PRODUCT_ID      = 'xxxx'        (dari produk Mayar)
CALLBACK_URL    = 'https://n8n.xindelabs.id/webhook/mayar-callback'
RETURN_URL      = 'https://xindelabs-workshop.vercel.app/success.html'
paymentType     = 'QRIS'        (atau channel lain)
```

**Workflow 2 (callback) — Code node "Parse Mayar Callback":**
```
APPS_SCRIPT_WEBHOOK = 'https://script.google.com/macros/s/XXXX/exec'
```

### D3. Aktifkan
- Kedua workflow: toggle **Active** = ON
- Catat URL webhook:
  - `https://n8n.xindelabs.id/webhook/create-payment`
  - `https://n8n.xindelabs.id/webhook/mayar-callback`

### D4. Test alur
```bash
curl -X POST https://n8n.xindelabs.id/webhook/create-payment \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test User","email":"test@gmail.com","wa":"081234567890"}'
# harus balas: {"payment_url":"https://mayar.id/..."}
```

> ⚠️ Kalau response Mayar belum punya field payment_url yang dikenali,
> log response mentahnya (Code node sudah otomatis nampilin), samakan
> nama field di Code node "Extract payment_url".

---

## PART E — Google Apps Script (Auto Email)

### E1. Setup (`auto-email-system.gs` — dari sesi sebelumnya)
1. Buka sheets.new → "Auto Email Workshop"
2. Extensions → Apps Script → paste `auto-email-system.gs`
3. Ganti `EMAIL_PENGIRIM`, `LINK_ZOOM`, `JADWAL_WORKSHOP`, `LINK_KOMUNITAS`
4. Run `setupSystem()` → izinkan akses
5. Run `testEmail()` → cek inbox

### E2. Deploy sebagai Web App
1. Apps Script → **Deploy → New deployment**
2. Type: **Web app**, Execute as: **Me**, Access: **Anyone**
3. Salin URL: `https://script.google.com/macros/s/XXXX/exec`

### E3. Sambungkan ke n8n
- Di workflow callback (D2), set `APPS_SCRIPT_WEBHOOK` dengan URL di atas

### E4. Test end-to-end
1. Buat transaksi test via curl (D4)
2. Bayar manual di halaman Mayar (pakai QRIS test)
3. Callback masuk → n8n parse PAID → panggil Apps Script
4. Email konfirmasi masuk ke inbox test
5. Set JADWAL_WORKSHOP = besok → besok cek email H-1 terkirim

---

## PART F — Meta Pixel & Tracking

### F1. Pasang Pixel
1. Meta Events Manager → Connect Data Source → **Web** → buat pixel
2. Salin **Pixel ID** (angka 15 digit)
3. Ganti `PIXEL_ID_LO_DISINI` di semua 4 file HTML
4. Push + auto-deploy Vercel

### F2. Event yang ke-track (otomatis)
| Halaman | Event |
|---|---|
| index.html | `PageView` |
| Klik tombol daftar | `InitiateCheckout` |
| checkout.html | `PageView` + `InitiateCheckout` |
| success.html | `Purchase` (value: 299000, IDR) |

### F3. Verifikasi
- Install **Meta Pixel Helper** (Chrome extension)
- Buka halaman → cek event muncul

### F4. (Advanced) CAPI server-side dari n8n
Kalau mau anti-blocking (iOS/AdBlock), tambah node **HTTP Request** di workflow
callback → POST ke `https://graph.facebook.com/v19.0/{PIXEL_ID}/events` dengan
access token. (Opsional — bisa belakangan.)

---

## Checklist GO-LIVE

- [ ] Mayar KYC approved + produk dibuat + Product ID dicopy
- [ ] API Token Mayar diisi di workflow create-payment
- [ ] Webhook callback Mayar → URL n8n (HTTPS)
- [ ] Domain n8n → Caddy SSL aktif
- [ ] Kedua workflow n8n Active + key terisi
- [ ] Test transaksi sukses end-to-end
- [ ] Email konfirmasi masuk (ceklah spam)
- [ ] Pixel ke-track (Pixel Helper)
- [ ] Harga & tanggal di landing page benar
- [ ] Form inner circle aktif
- [ ] Garansi & FAQ sesuai kebijakan

## Estimasi Biaya Bulanan

| Item | Biaya |
|---|---|
| Vercel (statis) | Rp 0 |
| n8n (di VPS lo) | Rp 0 |
| Mayar fee | ~1.5-2% per transaksi [cek ulang] |
| Domain | ~Rp 10-15rb/bln (dibayar tahunan) |
| Google Apps Script (Gmail) | Rp 0 (limit 100 email/hari gratis) |
| **Total** | **~Rp 15rb/bln + fee transaksi** |

# 🚀 SETUP GUIDE — Sistem Otomatis Workshop (Vercel + n8n + Tripay)

Panduan lengkap menghubungkan semua komponen. Ikuti urut.

---

## PART A — Frontend (Vercel)

### A1. Push ke GitHub

```bash
cd ~/xindelabs-workshop
git add .
git commit -m "Workshop landing page + checkout + n8n workflows"
# Bikin repo di GitHub (pakai gh CLI yang udah login)
gh repo create xindelabs-workshop --public --source=. --push
```

### A2. Deploy ke Vercel (2 cara)

**Cara 1 — Vercel Dashboard (recommended):**
1. Buka vercel.com → New Project → import `xindelabs-workshop` dari GitHub
2. Framework preset: **Other** (static)
3. Deploy → dapat URL `https://xindelabs-workshop.vercel.app`

**Cara 2 — Vercel CLI:**
```bash
npm i -g vercel
vercel --prod
```

### A3. Ganti placeholder di HTML
- `PIXEL_ID_LO_DISINI` → ID Meta Pixel (Events Manager → Data Sources)
- `N8N_DOMAIN_LO_DISINI` → domain n8n publik (Part C)
- `[tanggal workshop]`, `[link form inner circle]`, `[TESTIMONI]`, `[Tahun]`, `[Nama Brand]`

---

## PART B — Tripay (Payment Gateway)

### B1. Daftar
1. Buka **tripay.co.id** → Daftar (butuh KTP, no badan usaha)
2. Setelah approve: **Settings → Merchant** → catat:
   - Merchant Code (format `T1234`)
   - API Key
   - Private Key
3. **Settings → Channel** → aktifkan channel yang lo mau:
   - QRIS (paling laku buat workshop)
   - BCA VA, BNI VA, BRI VA (buat yang ga pegang e-wallet)
   - GoPay, OVO, DANA, ShopeePay (kalau mau)

### B2. Mode Sandbox (testing) vs Produksi
- Sandbox URL: `https://tripay.co.id/api-sandbox/transaction/create`
- Produksi URL: `https://tripay.co.id/api/transaction/create`
- Di Code node workflow n8n, ubah `TRIPAY_ENDPOINT` & `IS_SANDBOX`
- **Test pakai sandbox dulu, abis itu ganti produksi**

> ⚠️ Cek fee terbaru di tripay.co.id (sekitar 0.7% VA / 1.5-2% QRIS & e-wallet) — jauh lebih murah dari Midtrans 4-5%.

---

## PART C — Expose n8n ke Publik (Caddy + Domain)

n8n jalan di VPS lo (port 5678), tapi webhook-nya harus bisa diakses publik
dengan HTTPS (Tripay & browser butuh HTTPS).

### C1. Butuh domain (atau subdomain)
Contoh: `n8n.xindelabs.id` → A record → `43.133.131.126`
(panduan beli domain murah: Niagahoster/Cloudflare, Rp 100-150rb/thn)

### C2. Konfigurasi Caddy

Edit `/etc/caddy/Caddyfile`:

```caddy
# Webhook n8n — WAJIB HTTPS untuk Tripay callback
n8n.xindelabs.id {
	reverse_proxy localhost:5678
}

# Landing page (opsional — kalau mau host di VPS bukan Vercel)
workshop.xindelabs.id {
	root * /home/ubuntu/xindelabs-workshop
	file_server
}
```

```bash
sudo systemctl reload caddy
```

Caddy otomatis bikin SSL (Let's Encrypt) — ga perlu config manual.

### C3. Test
```bash
curl https://n8n.xindelabs.id/healthz
# harus balas ok
```

---

## PART D — Workflow n8n

### D1. Import
1. Buka `http://43.133.131.126:5678` → login
2. **Workflows → Import from File**
3. Import `n8n-workflow-create-payment.json`
4. Import `n8n-workflow-tripay-callback.json`

### D2. Isi konfigurasi di Code node

**Workflow 1 (create-payment) — Code node "Build Tripay Payload":**
```
TRIPAY_MERCHANT_CODE = 'T1234'
TRIPAY_PRIVATE_KEY  = 'xxxx'
TRIPAY_API_KEY      = 'xxxx'
CALLBACK_URL        = 'https://n8n.xindelabs.id/webhook/tripay-callback'
RETURN_URL          = 'https://xindelabs-workshop.vercel.app/success.html'
TRIPAY_ENDPOINT     = 'https://tripay.co.id/api/transaction/create'
method              = 'QRIS'   (atau channel lain)
```

**Workflow 2 (callback) — Code node "Verify Tripay Signature":**
```
TRIPAY_MERCHANT_CODE = 'T1234'   (sama)
TRIPAY_PRIVATE_KEY  = 'xxxx'     (sama)
```

### D3. Aktifkan
- Kedua workflow: toggle **Active** = ON
- Catat URL webhook:
  - `https://n8n.xindelabs.id/webhook/create-payment`
  - `https://n8n.xindelabs.id/webhook/tripay-callback`

### D4. Test alur
```bash
curl -X POST https://n8n.xindelabs.id/webhook/create-payment \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test User","email":"test@gmail.com","wa":"081234567890","produk":"workshop","harga":299000}'
# harus balas: {"payment_url":"https://tripay.co.id/..."}
```

---

## PART E — Google Apps Script (Auto Email)

### E1. Setup (udah pernah kita bikin — `auto-email-system.gs`)
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
- Di workflow callback (D2), set:
  `APPS_SCRIPT_WEBHOOK = 'https://script.google.com/macros/s/XXXX/exec'`

### E4. Test end-to-end
1. Buat transaksi test via curl (D4)
2. Bayar manual di halaman Tripay (pakai QRIS test)
3. Callback masuk → n8n verify → panggil Apps Script
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

- [ ] Tripay approved & channel aktif
- [ ] Domain n8n → Caddy SSL aktif
- [ ] Kedua workflow n8n Active + key terisi
- [ ] Test transaksi sukses end-to-end (sandbox → produksi)
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
| Tripay fee | ~0.7-2% per transaksi |
| Domain | ~Rp 10-15rb/bln (dibayar tahunan) |
| Google Apps Script (Gmail) | Rp 0 (limit 100 email/hari gratis) |
| **Total** | **~Rp 15rb/bln + fee transaksi** |

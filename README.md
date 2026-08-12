# Workshop "Closing Naik dengan AI" — Landing Page + Checkout System

Sistem landing page + checkout + payment otomatis untuk workshop online 2 jam.
Payment gateway: **Mayar** (daftar gampang, KTP doang, cocok untuk creator digital).

## Arsitektur

```
Vercel (frontend statis)          VPS (backend)
┌──────────────────────┐          ┌──────────────────────────────┐
│ index.html           │          │ n8n (port 5678)              │
│ checkout.html ──────►│──POST──► │  /webhook/create-payment     │
│ success.html         │  JSON    │  └→ Mayar API /checkout      │
│ pending.html         │          │     └→ payment_url (redirect)│
│ failed.html          │◄─redirect│  /webhook/mayar-callback     │
└──────────────────────┘          │  └→ parse status → PAID?     │
        │                         │  └→ Google Apps Script       │
        ▼                         │     (auto email + follow-up) │
   Meta Pixel                     └──────────────────────────────┘
   (PageView / InitiateCheckout / Purchase)
```

## File

| File | Fungsi |
|---|---|
| `index.html` | Landing page + Meta Pixel (PageView, InitiateCheckout) |
| `checkout.html` | Form checkout (nama/email/WA) → POST ke n8n → redirect Mayar |
| `success.html` | Halaman sukses + Meta Pixel Purchase (Rp 299.000) |
| `pending.html` | Halaman menunggu pembayaran |
| `failed.html` | Halaman gagal/batal |
| `n8n-workflow-mayar-create-payment.json` | Workflow n8n: buat checkout Mayar + redirect |
| `n8n-workflow-mayar-callback.json` | Workflow n8n: parse callback + trigger auto email |
| `README.md` | Dokumentasi arsitektur + troubleshooting |
| `SETUP-GUIDE.md` | Panduan lengkap A-F |
| `vercel.json` | Config routing statis |

> Workflow Tripay lama (`n8n-workflow-tripay-*.json`) masih ada di repo
> sebagai cadangan kalau suatu saat balik ke Tripay.

## Setup Cepat

### 1. Ganti placeholder
- **Semua file HTML:** `PIXEL_ID_LO_DISINI` → ID Meta Pixel lo
- **checkout.html:** `N8N_DOMAIN_LO_DISINI` → domain publik n8n lo
- **index.html:** `[tanggal workshop]`, `[link form inner circle]`, `[TESTIMONI]`

### 2. Mayar (payment gateway)
1. Daftar mayar.id → KYC review (biasanya 1-3 hari kerja)
2. Dashboard → **Produk** → Tambah produk: "Workshop Closing Naik dengan AI" (Rp 299.000)
3. Copy **Product ID** → tempel di Code node workflow create-payment
4. Dashboard → **Pengaturan → API** → buat/generate **API Token** → tempel di workflow
5. Dashboard → **Pengaturan → Webhook** → Payment Callback URL →
   `https://N8N_DOMAIN_LO_DISINI/webhook/mayar-callback`

### 3. Deploy ke Vercel
Hubungkan repo GitHub ini ke vercel.com (auto-deploy tiap push).

### 4. Import workflow n8n
1. Buka n8n → **Workflows → Import from File**
2. Import `n8n-workflow-mayar-create-payment.json` → isi API token + product ID
3. Import `n8n-workflow-mayar-callback.json` → isi URL Apps Script
4. **Active** kedua workflow

### 5. Setup domain n8n (wajib, biar webhook bisa diakses publik)
Lihat `SETUP-GUIDE.md` — Caddy reverse proxy + SSL otomatis.

## Alur Lengkap (User)

1. User buka landing page → klik "DAFTAR"
2. Isi nama/email/WA di checkout → **BAYAR**
3. n8n panggil Mayar `/checkout` → redirect ke halaman bayar Mayar (QRIS/VA/e-wallet)
4. User bayar
5. Mayar kirim callback ke n8n → parse status PAID → panggil Apps Script
6. **Email konfirmasi + link Zoom terkirim otomatis** → follow-up H-3, H-1, H-0, H+1, H+3, H+7
7. User di-redirect ke `success.html` (Meta Pixel Purchase ke-track)

## Troubleshooting

| Masalah | Cek |
|---|---|
| Checkout error "Webhook error 404" | Domain n8n belum ke-proxy / workflow belum active |
| "Terjadi kendala" di checkout | Lihat eksekusi n8n → node HTTP Mayar → error apa |
| Mayar "Add product first" | Product ID salah / produk belum dibuat di dashboard |
| Callback masuk tapi email ga terkirim | Cek URL Apps Script; cek Apps Script log |
| Response Mayar ga ada payment_url | Log response mentah di Code node, samakan field-nya |

# Workshop "Closing Naik dengan AI" — Landing Page + Checkout System

Sistem landing page + checkout + payment otomatis untuk workshop online 2 jam.

## Arsitektur

```
Vercel (frontend statis)          VPS (backend)
┌──────────────────────┐          ┌──────────────────────────────┐
│ index.html           │          │ n8n (port 5678)              │
│ checkout.html ──────►│──POST──► │  /webhook/create-payment     │
│ success.html         │  JSON    │  └→ Tripay API               │
│ pending.html         │          │     └→ payment_url (redirect)│
│ failed.html          │◄─redirect│  /webhook/tripay-callback    │
└──────────────────────┘          │  └→ verify signature         │
        │                         │  └→ Google Apps Script       │
        ▼                         │     (auto email + follow-up) │
   Meta Pixel                     └──────────────────────────────┘
   (PageView / InitiateCheckout / Purchase)
```

## File

| File | Fungsi |
|---|---|
| `index.html` | Landing page + Meta Pixel (PageView, InitiateCheckout) |
| `checkout.html` | Form checkout (nama/email/WA) → POST ke n8n → redirect Tripay |
| `success.html` | Halaman sukses + Meta Pixel Purchase (Rp 299.000) |
| `pending.html` | Halaman menunggu pembayaran |
| `failed.html` | Halaman gagal/batal |
| `n8n-workflow-create-payment.json` | Workflow n8n: buat transaksi Tripay |
| `n8n-workflow-tripay-callback.json` | Workflow n8n: verifikasi callback + trigger auto email |

## Setup Cepat

### 1. Ganti placeholder
- **Semua file HTML:** `PIXEL_ID_LO_DISINI` → ID Meta Pixel lo
- **checkout.html:** `N8N_DOMAIN_LO_DISINI` → domain publik n8n lo (misal `https://n8n.xindelabs.id`)
- **index.html:** `[tanggal workshop]`, `[link form inner circle]`, `[TESTIMONI]`, `[Tahun]`, `[Nama Brand]`

### 2. Deploy ke Vercel
```bash
npm i -g vercel
vercel --prod
```
Atau hubungkan repo GitHub ini ke vercel.com (recommended — auto-deploy tiap push).

### 3. Import workflow n8n
1. Buka n8n lo → **Workflows → Import from File**
2. Import `n8n-workflow-create-payment.json` → isi TRIPAY key di Code node
3. Import `n8n-workflow-tripay-callback.json` → isi TRIPAY key + URL Apps Script
4. **Active** kedua workflow

### 4. Setup domain n8n (wajib, biar webhook bisa diakses publik)
Lihat `SETUP-GUIDE.md` — Caddy reverse proxy + SSL otomatis.

### 5. Tripay
1. Daftar di tripay.co.id → dapat Merchant Code, API Key, Private Key
2. **Sandbox mode** dulu (test), lalu produksi
3. Isi `TRIPAY_MERCHANT_CODE`, `TRIPAY_PRIVATE_KEY`, `TRIPAY_API_KEY` di Code node kedua workflow
4. Pilih metode bayar: `QRIS` / `BCAVA` / `GOPAY` / `OVO` / `DANA` (ubah `method` di Code node create-payment)

## Alur Lengkap (User)

1. User buka landing page → klik "DAFTAR"
2. Isi nama/email/WA di checkout → **BAYAR**
3. n8n buat transaksi Tripay → redirect ke halaman bayar Tripay (QRIS/VA/e-wallet)
4. User bayar
5. Tripay kirim callback ke n8n → verify signature → panggil Apps Script
6. **Email konfirmasi + link Zoom terkirim otomatis** → follow-up H-3, H-1, H-0, H+1, H+3, H+7
7. User di-redirect ke `success.html` (Meta Pixel Purchase ke-track)

## Troubleshooting

| Masalah | Cek |
|---|---|
| Checkout error "Webhook error 404" | Domain n8n belum ke-proxy / workflow belum active |
| "Terjadi kendala" di checkout | Lihat eksekusi n8n → node HTTP Tripay → error apa |
| Callback masuk tapi email ga terkirim | Cek URL Apps Script di workflow callback; cek Apps Script log |
| Pixel ga ke-track | Cek ID pixel; install Meta Pixel Helper extension |

# Rencana fase — XindeLabs digital product system

Satu sistem, bukan kumpulan halaman terpisah. Funnel tutorial gratis, Main Hub jasa, sales page produk, checkout, LMS, membership, VIP, dan komunitas Discord dihitung sebagai **satu ladder**: orang masuk dari pintu gratis, naik ke produk berbayar, lalu tinggal sebagai member.

## Aturan tetap (semua fase)

1. Kerja di branch fitur, `main` hanya menerima merge yang sudah lolos build + test.
2. Migration additive saja (`add column if not exists`, `create table if not exists`). Tidak hapus kolom/tabel lama.
3. Rollback aplikasi = revert commit atau promote deployment Vercel sebelumnya.
4. Setiap fase diverifikasi dengan: `npm test` hijau, `npm run build` hijau, route production 200, dan pengecekan alur manual yang relevan.
5. Backup tag sebelum perubahan besar: `backup-before-pos-lms-expansion-20261028-215748`.
6. Legacy `_legacy_archive/`, tabel legacy (`courses`, `programs`, `modules`, `enrollments`, `vip_*`), dan alur Tripay **dipertahankan** sebagai referensi.

## Peta funnel (satu ladder)

```
Masuk (pintu gratis)
├── Funnel tutorial gratis  /tutorial
│     1. Lead capture (Nama, Email, No. WA)      → source: tutorial_hermes
│     2. Tawaran Bimbingan VIP (1-on-1)          → /checkout/vip
│     3. Tawaran Kelas & Workshop                → /checkout/[slug]
│     4. Akses tutorial + link komunitas gratis  → Discord + /learn
├── Main Hub lead form  /  (jasa)                → source: main-hub-contact  → /service
└── Sales page produk  /p/[slug]                 → /checkout/[product]

Konversi
└── Checkout Mayar → webhook → order paid → provision LMS + auto-role Discord + email

Setelah bayar
└── /learn/dashboard (kelas, progress, sertifikat) · member tier · voucher/affiliate · upsell produk lain
```

**Funnel tutorial gratis tidak dipecah jadi fitur terpisah dan tidak boleh dihilangkan.** Dia pintu masuk utama: 4 langkah di atas harus tetap utuh, tetap punya source lead sendiri (`tutorial_hermes`), dan tetap bisa menawarkan produk yang sama dengan yang dijual di sales page.

## Status

| Fase | Isi | Status |
|---|---|---|
| 0 | Audit baseline, backup tag, branch fitur | ✅ selesai (`3bbcaae`) |
| 1 | `leads.business_field`, form lead Main Hub (Nama, Email, WA, Bidang Bisnis), atribusi source terpisah hub vs tutorial | ✅ live (`b645e3a`) |
| 2 | Struktur jasa: 4 lini di Main Hub + halaman `/service` dari satu sumber data, funnel gratis tetap jadi pintu masuk | 🚧 jalan |
| 3 | Produk & harga di `classes`: kelas single, workshop, all-access lifetime, annual membership, VIP, early bird (deadline + quota), cross-sell member price | ⏳ |
| 4 | Checkout end-to-end: voucher (persen/nominal, limit, expiry), order bump, verifikasi ulang `/api/checkout` + `/api/mayar/webhook` dengan test | ⏳ |
| 5 | Funnel tutorial jadi ladder resmi: langkah VIP & kelas ambil dari data produk, event tracking rapi, langkah terakhir = akses tutorial + komunitas gratis | ⏳ |
| 6 | Membership & LMS: gate akses terpusat dari `members` (`owned_classes`, `is_all_access`, `billing_status`, `grace_until`), progress + sertifikat digital, reminder renewal annual | ⏳ |
| 7 | Auto-role Discord dari `discord_role_map` + email onboarding (Resend) + AI bantu generate landing page | ⏳ |
| 8 | Admin ramah pemula, laporan mingguan Telegram, laporan penjualan, polishing | ⏳ |

## Fase 2 — detail kerja

1. Satu sumber kebenaran 4 lini jasa di `src/lib/services.ts`:
   - `01 Instalasi AI untuk Bisnis`
   - `02 Automation Bisnis`
   - `03 Vibe Marketing`
   - `04 Pembuatan Aplikasi Bisnis`
2. Main Hub `/` merender 4 lini itu (menggantikan 6 kartu skill generik), tiap kartu menuju `/service#<slug>`.
3. `/service` merender 4 lini yang sama + rincian, harga, dan anchor per lini, tetap memakai desain yang sudah ada.
4. Funnel tutorial gratis, sales page, dan checkout **tidak diubah** di fase ini.
5. Verifikasi: build + test hijau, `/` dan `/service` 200 di production, 4 lini muncul, link anchor bekerja.

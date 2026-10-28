# Baseline audit — sebelum ekspansi commerce + LMS

Dibuat: 2026-10-28. Branch: `feat/digital-commerce-foundation`.
Backup tag: `backup-before-pos-lms-expansion-20261028-215748` (commit `db573d1`).

Aturan kerja fase ini: **additive only**. Tidak hapus kolom/tabel lama, tidak ubah alur pembayaran existing, tidak ubah route yang sudah live tanpa verifikasi.

## 1. Route map (existing)

Public / funnel
- `/` main hub &nbsp;· `/service` &nbsp;· `/portofolio` &nbsp;· `/blog`, `/blog/[slug]`
- `/learn` (hub produk), `/learn/kelas` (katalog), `/learn/course/[slug]`, `/learn/workshop/[slug]`, `/learn/vip`, `/learn/dashboard`, `/learn/login`
- `/p/[slug]` sales page (primary), `/sales/[slug]` (alias)
- `/checkout/[product]`, `/checkout/success|pending|failed`
- `/tutorial`, `/fast-track`, `/join-group`, `/vip-coaching`, `/unsubscribe`, `/privacy`, `/terms`

Admin
- `/admin`, `/admin/lms`, `/admin/lms/courses`, `/admin/workshops`, `/admin/workshop-members`, `/admin/orders`, `/admin/leads`, `/admin/unified-leads`, `/admin/sales-pages`, `/admin/landing-pages`, `/admin/vouchers`, `/admin/vip`, `/admin/emails`, `/admin/followups`, `/admin/pipeline`, `/admin/pixels`, `/admin/content`, `/admin/editor`, `/admin/leaks`, `/admin/login`

API
- Admin: `blocks`, `classes`, `lessons`, `sales-pages`, `email-templates`, `wa-templates`, `pixels`, `login`, `logout`
- Commerce: `checkout`, `mayar/webhook`, `provision-lms`
- Member: `member/session`, `member/callback`, `member/progress`, `member/certificate`, `member/workshop-progress`
- Lain: `lead`, `partnership`, `tutorial/event`, `cron/send-email`, `resend/webhook`, `v1/blog`

## 2. Database map (tabel yang benar-benar dipakai kode)

Paling sering dipakai: `classes` (22), `orders` (17), `leads` (17), `members` (16), `sales_page_config` (9), `lessons` (8), `email_queue` (8), `blog_posts` (8).

Lainnya: `pipeline_events`, `page_blocks`, `wa_templates`, `vouchers`, `vip_config`, `vip_workspace`, `settings`, `portfolio`, `email_logs`, `email_templates`, `email_sequences`, `email_steps`, `email_enrollments`, `workshop_pre_sessions`, `workshop_decks`, `workshop_pre_session_progress`, `lesson_progress`, `certificates`, `unsubscribes`, `notes`, `admin_profiles`, `site_content`, `partnership_inquiries`.

Tabel migrasi yang **tidak** terlihat dipakai kode: `page_blocks` dipakai (6), tidak ada tabel orphan signifikan.

Catatan penting: `classes` dan `lessons` dibuat di luar folder `supabase/migrations` (tidak ada `create table classes`). Schema produksi adalah sumber kebenaran — jalankan `supabase/audit/baseline_schema_dump.sql` untuk dump kolom aktual sebelum membuat migration baru.

Yang **belum ada** dan dibutuhkan fase berikutnya: `entitlements` (akses produk per member), `coupons`/pemakaian kupon (sekarang hanya `vouchers`), `order_bumps`/`upsells`, `lead_submissions` (sekarang `leads` + `partnership_inquiries`), mapping role Discord.

## 3. Payment & fulfillment map

- Checkout: `POST /api/checkout` → hitung harga (regular / early bird deadline / quota) → buat order → Mayar hosted invoice.
- Webhook: `/api/mayar/webhook` → gate `payment.received` → dedupe `payment_ref` → update status order → provisi akses (`/api/provision-lms`) + email (Resend).
- n8n: workflow produksi `0vAs6OcMtBAJX6ml` (dihardening: callback token, tier leadNotes→productId→productName, fail-closed email).
- Kupon: tabel `vouchers` ada dan admin `/admin/vouchers` ada; integrasi ke checkout belum diverifikasi.
- Discord: hanya link invite di flow checkout/workshop, belum ada role mapping otomatis.
- Sertifikat: `/api/member/certificate` + `certificates` sudah ada.

## 4. Yang aman dilanjutkan vs rawan

Aman (jangan diubah sembarangan, sudah live + terverifikasi):
- `/p/[slug]`, `/sales/[slug]`, `/learn/*`, `/checkout/*`, `/api/checkout`, `/api/mayar/webhook`, `/api/admin/sales-pages`.

Rawan / perlu dirapikan (fase berikutnya):
- Main hub `/` dan `/service` — konten jasa belum distruktur sesuai 4 lini (Instalasi AI, Automation, Vibe Marketing, App Dev) dan belum ada form lead (Nama, Email, WA, Bidang bisnis) + CTA `wa.me/6289533513770`.
- `entitlements` belum ada → akses member masih implisit (single vs lifetime vs annual vs VIP belum ditegakkan terpusat).
- Kuota early bird dihitung dengan count query (belum atomic marking).
- Nama tabel `vips`/`vouchers`/`members` perlu dicek ke schema aktual sebelum migration.

## 5. Rollback

Aplikasi
```bash
cd /home/ubuntu/xindelabs-workshop
git switch main                     # kembali ke branch produksi
git reset --hard db573d1            # hanya kalau main sudah maju dan mau dipaksa
# atau: git revert <commit>         # cara yang disarankan (tidak menulis ulang history)
```
Vercel: Deployments → pilih deployment terakhir yang hijau → Promote to Production.

Baseline penuh (commit terakhir sebelum fase ini)
```bash
git fetch --tags
git checkout backup-before-pos-lms-expansion-20261028-215748
```

Database: semua migration fase ini harus additive (`add column if not exists`, `create table if not exists`). Reverse migration disimpan di `supabase/migrations/` dengan prefix `reverse_` dan hanya dijalankan manual.

## 6. Aturan per fase

1. Kerja di `feat/digital-commerce-foundation` (branch fitur), bukan `main`.
2. Satu fase = satu PR. Merge hanya setelah `npm run build` + `npm test` hijau dan route live diverifikasi.
3. Deploy Vercel Preview dulu untuk perubahan UI, baru `main`.
4. Migration additive saja. Kalau perlu hapus kolom → putuskan terpisah, jangan digabung.
5. Tidak mengubah `/api/checkout` dan `/api/mayar/webhook` kecuali ada test pendamping.

## 7. Automation map (n8n dari repo)

| File | Nama workflow | Nodes | Trigger | Alur |
|---|---|---|---|---|
| `n8n-workflow-mayar-create-payment.json` | BYOPA - Create Payment (Mayar, 2 Tier + Voucher) | 10 | webhook + manual | Build Mayar Payload → Mayar Checkout → Extract payment_url → Simpan Leads (Supabase) → Apps Script (Lead ke Sheets + Email) → Respond Voucher Ditolak |
| `n8n-workflow-mayar-callback.json` | Workshop - Mayar Callback + Auto Email | 11 | webhook + manual | Parse Callback → IF Pembayaran Sukses → Siapkan Data LMS → Finalisasi Lead Paid → Provision LMS Access → Kirim Email (Resend) → Log Non-Paid; **Discord Assign Role** sudah ada |
| `n8n-workflow-hermes-agent.json` | Hermes Agent - Command Bridge | 10 | webhook | Route & Build Prompt → Hermes LLM → Normalize Output → Catat agent_logs → IF Publish Artikel → Publish blog_posts |
| `n8n-workflow-create-payment.json` | Workshop - Create Payment (Tripay) | 5 | webhook | Legacy Tripay, dipertahankan, tidak dipakai flow baru |
| `n8n-workflow-tripay-callback.json` | Workshop - Tripay Callback | 6 | webhook | Legacy Tripay, dipertahankan |

Poin penting:
- **Discord auto-role sudah punya node di workflow callback** (`Code: Discord Assign Role`). Fase fulfillment tidak perlu bikin dari nol, cukup hubungkan ke sumber data yang benar (order → produk → mapping role).
- Hermes Command Bridge sudah bisa publish `blog_posts`. Ini jalur yang akan dipakai untuk AI generate landing/konten di fase 6.
- Tripay = legacy. Jangan hapus karena instruksi mempertahankan desain/logika lama, tapi jangan dipakai untuk flow baru.

## 8. Environment inventory (nama saja, nilai tidak disimpan)

- App: `APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_HOST`, `NEXT_PUBLIC_LMS_URL`, `NEXT_PUBLIC_GROUP_URL`, `NODE_ENV`
- DB: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Payment: `MAYAR_API_KEY`, `MAYAR_ENV`
- Auth/admin: `ADMIN_PASSWORD`, `ADMIN_SECRET`
- Internal: `PROVISION_LMS_SECRET`, `CRON_SECRET`, `HERMES_API_KEY`
- Email: `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_API_BASE`

Belum ada: variabel Discord (bot token / guild id) di app — auto-role masih di sisi n8n. Kalau nanti app perlu menulis mapping role, ini yang ditambah.

## 9. Main Hub & halaman jasa — state sekarang

- `/` (474 baris): konten jasa sudah ada tapi bertema umum ("semua yang lo kerjain ulang tiap hari", "Bikin sistemnya yang jaga"), navigasi: portofolio, service, tutorial, tentang, belajar, workshop. Belum distruktur ke 4 lini jasa dan belum ada form lead dengan field Bidang Bisnis.
- `/service` (143 baris): render dari data `{s.title}` — sumber data perlu dicek (array inline atau Supabase `site_content`).
- `/portofolio` (87 baris): mengambil `portfolio` dari Supabase.
- Lead form existing sudah menangkap `name`, `email`, `whatsapp`, `company`, `message`, `kind` (`/api/lead`, `/api/partnership`, `partnership_inquiries`).
- CTA WhatsApp sudah ada dan nomornya sudah benar: `wa.me/62895335137700` (= 0895335137700).

Kesimpulan: Fase 1 bukan bikin ulang, tapi **restruktur konten + tambah field "Bidang Bisnis"** dan rapikan navigasi.

## 10. Yang masih dibutuhkan sebelum menulis migration

1. Hasil `supabase/audit/baseline_schema_dump.sql` (tipe kolom, constraint, enum, status RLS). Lokal tidak bisa diambil karena `.env.local` masih placeholder → `Invalid API key`.
2. Konfirmasi daftar produk/offering final: kelas single, workshop, all-package lifetime, annual, VIP + harganya.
3. Konfirmasi nama guild/channel Discord dan daftar role yang mau dipakai.

Sampai nomor 1 ada, migration tidak ditulis — supaya tidak bentrok dengan schema produksi yang sudah jalan.

## 11. Status Fase 0

- [x] Backup tag + baseline commit
- [x] Branch fitur
- [x] Repo route map
- [x] Database map (dari kode)
- [x] Payment & fulfillment map
- [x] Automation map
- [x] Env inventory
- [x] Main Hub state
- [x] Build hijau + 12/12 test hijau + code graph terbarui
- [ ] Schema produksi (butuh aksi user: jalankan SQL audit)

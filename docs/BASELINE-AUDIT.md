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

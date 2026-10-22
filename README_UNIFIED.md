# XindeLabs Unified Ecosystem

## Struktur Project
- **Apex `xindelabs.web.id`** (`/Users/evantvant/Documents/tutorial/`) - Next.js 16 + TypeScript: home unified (`/`), blog (`/blog`), portofolio (`/portofolio`), tutorial funnel (`/tutorial`), dan SEMUA API produksi (Mayar checkout, provision-LMS, lead, webhook, cron)
- **Subdomain** (`/Users/evantvant/Documents/xinde/`) - Static HTML + Vanilla JS + Supabase (admin, member LMS, funnel subdomains: workshop./kelas./hermes./promo.)
- **lms-xinde** (`/Users/evantvant/Documents/lms-xinde/`) - Next.js 16 + TypeScript + Tailwind v4 (workshop/LMS UI design system)

## Files Penting
- `ARCHITECTURE.md` - Blueprint arsitektur terpadu
- `sql/migrate_2026_admin.sql` - **WAJIB dijalankan pertama**: 93 kolom + 12 tabel baru + backfill + RLS (never-abort)
- `supabase_unified_schema.sql` - Skema Supabase ter-unifikasi (idempotent, never-abort)
- `sql/supabase_unified_schema.original.sql` - versi asli sebelum di-jadi-kan never-abort (referensi)
- `migrate_legacy_members.sql` - Migrasi aman untuk data member lama
- `seed_funnels.sql`, `seed_wa_templates.sql` - data seed (idempotent, never-abort)
- `sql/agent_logs.sql` - tabel `agent_logs` + RLS (standalone)
- `api/hermes.js` - Vercel Function: proxy Hermes (token server-side)
- `supabase-setup.sql` - Skema existing (tetap dipertahankan untuk kompatibilitas)
- `css/theme.css` - Design system ter-unifikasi dari xindelabs-workshop

## Migrasi Database (URUTAN WAJIB)
Semua file SQL sekarang **never-abort**: setiap statement dibungkus `DO ... EXCEPTION WHEN OTHERS THEN RAISE NOTICE`.
Wajib, karena Supabase SQL Editor **membatalkan seluruh file** begitu ada satu statement error (transaction rollback).

Urutan eksekusi di **Supabase SQL Editor → New query → paste → Run**:
1. `sql/migrate_2026_admin.sql` — tambah 93 kolom yang hilang, buat 12 tabel baru (incl. `agent_tasks`), backfill, unique index, RLS, verifikasi
2. `supabase_unified_schema.sql` — skema ter-unifikasi (sudah aman, boleh diulang)
3. `seed_wa_templates.sql` — template follow-up WA
4. `seed_funnels.sql` — funnel `hermes` + `promo` beserta blok landing/pricing/FAQ/CTA
5. `migrate_legacy_members.sql` — normalisasi data member lama (aman untuk data existing)

> Kalau masih ada error: baca pesan `SKIP statement #N` / `SKIP kolom ...` di output SQL Editor,
> perbaiki manual, lalu jalankan ulang file yang sama (idempotent).

## Design System
Design system baru menggunakan palet yang konsisten dengan workshop:
- Colors: `--bg`, `--bg-2`, `--bg-3`, `--green`, `--cyan`, `--gold`, `--text`, `--muted`
- Fonts: Space Grotesk, JetBrains Mono, Instrument Serif
- Components: `.btn`, `.card`, `.hl`, `.grad`, `.eyebrow`, animations

## Catatan
- Semua data member aktif aman (menggunakan `ADD COLUMN IF NOT EXISTS`, no destructive drops)
- Backward compatible dengan skema existing
- RLS tetap ketat untuk keamanan

## Tugas 6 — Integrasi Hermes Agent (Admin Command Center)

### File baru
- `sql/agent_logs.sql` — tabel `agent_logs` + RLS (versi standalone dari Section 13)
- `supabase_unified_schema.sql` Section 13 — `agent_logs` (idempotent, aman dijalankan ulang)
- `js/admin/hermes-bridge.js` — bridge Hermes + slide-over Command Center
- `js/admin/blog-editor.js` — Blog Editor + generate artikel via Hermes
- `n8n-workflow-hermes-agent.json` — template workflow n8n (import manual)

### Setup (langkah manual yang wajib dikerjakan di akun masing-masing)

**1. Supabase SQL Editor** — jalankan query ini (atau `sql/agent_logs.sql`):
```sql
-- Lihat supabase_unified_schema.sql Section 13 (tabel agent_logs + index + RLS)
```
Policy: admin read via `public.is_admin()`, insert via admin & `service_role`.

**2. n8n — import workflow**
- Import `n8n-workflow-hermes-agent.json` (Workflows → Import from File).
- Struktur node: `Webhook: Hermes Agent` → `Code: Route & Build Prompt` → `HTTP: Hermes LLM` → `Code: Normalize Output` → `HTTP: Catat agent_logs` → `Code: Siapkan Publish` → `IF: Publish Artikel?` → (`HTTP: Publish blog_posts`) → `Code: Build Response` → `Respond to Webhook`.
- Set environment variables di n8n (Settings → Variables, atau di node HTTP via `$env`):
  - `OPENAI_API_KEY` = API key OpenAI
  - `HERMES_MODEL` = `gpt-4o-mini` (default)
  - `SUPABASE_URL` = URL project Supabase
  - `SUPABASE_SERVICE_KEY` = service_role key (untuk insert `agent_logs` & `blog_posts`)
- Node "Respond to Webhook" → response mode **Respond to Webhook**, response body = `={{ JSON.stringify($json.response) }}`.
- Webhook path: `hermes-agent`, method **POST**, dan **Activate** workflow.
- Timeout eksekusi workflow ≥ 180 detik (Call Hermes timeout 180000 ms).
- `HTTP: Publish blog_posts` memakai upsert (`?on_conflict=slug` + `Prefer: resolution=merge-duplicates`) sehingga artikel dengan slug sama diperbarui, bukan error.

**3. Verifikasi endpoint**
```bash
curl -X POST https://n8n.43-133-131-126.sslip.io/webhook/hermes-agent \
  -H 'Content-Type: application/json' \
  -d '{"action":"ping","payload":{},"source":"admin_ping","agent":"hermes"}'
```
Harus membalas `{"ok":true,"output":...}`.

**4. Deploy**
```bash
vercel link --project xindelabs-workshop --yes
vercel deploy --prod --yes
```
Domain `admin.xindelabs.web.id` sudah ditambahkan ke project `xindelabs-workshop`
(`vercel domains add admin.xindelabs.web.id xindelabs-workshop`), CNAME DNS tetap `cname.vercel-dns.com`.

### Kontrak API
- Request: `{ action, payload, source, agent, requested_at }`
- Response (bridge menerima beberapa bentuk): `output` | `reply` | `text` | `content` | `result` | `data.output` | `choices[0].message.content`
- Action: `ping`, `chat`, `generate_blocks`, `generate_article`
- Response n8n sekarang: `{ ok, action, output, publish_requested, published, publish_error, article? }`
  - `published: true` berarti artikel benar-benar tersimpan di `blog_posts` (quick action "Generate Artikel SEO Hari Ini").
  - `published: false` + `publish_error` terisi → artikel tetap dikembalikan ke admin, publish perlu diulang manual.

### Transport Hermes (3 mode, diatur di Admin → Hermes → Pengaturan)
Disimpan di tabel `settings`, key = `hermes_config`.

| Mode | Cara kerja | Kapan dipakai |
|---|---|---|
| `webhook` | Browser POST langsung ke webhook n8n | Paling cepat, tanpa server |
| `proxy` | Browser POST ke `/api/hermes` (Vercel Function), token ditambahkan di server | Token webhook tidak bocor ke browser |
| `supabase_bus` | Tulis tugas ke `agent_tasks`, Hermes memproses, mengisi `result` | Hermes jalan async / dari Telegram |

Environment Vercel (opsional untuk mode `proxy`):
```bash
vercel env add HERMES_WEBHOOK production      # sudah diisi default
vercel env add HERMES_TOKEN production        # opsional (Bearer token)
```

### Test Kontrak
Di Admin → Hermes → Pengaturan → **Tes Kontrak**. Mengecek: transport, endpoint, nama agent,
respons 2xx, field `output` terisi, dan latency < 10 detik. Hasilnya juga dicatat di `agent_logs`
(`action = contract_test`).

### Peran Hermes yang didukung (6 peran)
1. **Generator Funnel** — bikin funnel + subdomain + copy PAS (action `generate_funnel_blocks`)
2. **Analis Pipeline** — baca data leads, buat draf follow-up WA (action `chat`)
3. **Auto-SEO Blog** — draft artikel + publish ke `blog_posts` (action `generate_blog_article`)
4. **Pre-Review Project VIP** — review file/feedback member VIP (action `chat`)
5. **Voucher & Slot VIP** — kelola voucher dan slot VIP (action `chat`)
6. **AI Tutor LMS** — bantu member kelas (action `chat`)

### Guard error dashboard
- 1 modul error **tidak** mematikan halaman: `modCall()` menangkap error sync & promise rejection
- Error skema DB (kolom/tabel belum ada) menampilkan banner:
  *"Jalankan `sql/migrate_2026_admin.sql` di Supabase SQL Editor, lalu muat ulang halaman"*
- Semua modul export fungsi `load()`; dipanggil via `window.__ADMIN_MODULES__`



# XINDELABS UNIFIED ECOSYSTEM - MASTER ARCHITECTURE

## 0. Peta Routing Domain (per 24 Oktober 2026)

| Host | Project Vercel | Isi | Deploy |
|---|---|---|---|
| `xindelabs.web.id` | `tutorial` (Next.js, `apex/` di repo ini) | Main hub `/` (nav: tentang, karya, belajar, kontak + burger mobile: learn, blog, service, login member), tombol **"Work with me" → `/service`**, blog `/blog`, portofolio `/portofolio`, **service `/service` (halaman layanan + harga, baru 2026-10-24)**, **admin satu pintu `/admin` → redirect ke CMS `admin.xindelabs.web.id/admin`**, SEMUA API produksi (Mayar checkout, provision-LMS, lead, webhook, cron) | `git push` main → auto-deploy |
| `learn.xindelabs.web.id` | `xindelabs-workshop` (static, repo ini) | **Portal belajar — 3 pintu (baru 2026-10-24):**<br>• `/member` → Login/Member area (LMS: katalog kelas, modul, sertifikat, VIP 1-on-1, upsell cross-sell)<br>• `/kelas` → Landing katalog kelas publik (kembali ke `/index.html?view=kelas`, render `js/modules/kelas-page.js`)<br>• `/workshop` → Landing workshop live | `git push` |
| `xindelabs.web.id/blog` | `tutorial` | Blog (dari Main Hub nav) | `git push` |
| `xindelabs.web.id/service` | `tutorial` | Halaman Service — daftar layanan + harga + CTA WA/IG (tujuan tombol "Work with me") | `git push` |
| `admin.xindelabs.web.id` | `xindelabs-workshop` | CMS penuh (`admin.html` + `js/admin/*`) — diakses via satu pintu `xindelabs.web.id/admin` | `git push` |
| `workshop.xindelabs.web.id` | `xindelabs-workshop` | Funnel `workshop` (alias lama, tetap hidup) | `git push` |
| `kelas.xindelabs.web.id` | `xindelabs-workshop` | Funnel `kelas` (legacy — diarahkan ke `learn./kelas`) | `git push` |
| `hermes.xindelabs.web.id` | `xindelabs-workshop` | Funnel `hermes` | `git push` |
| `promo.xindelabs.web.id` | `xindelabs-workshop` | Funnel `promo` | `git push` |
| `member.xindelabs.web.id` | `xindelabs-workshop` | Member LMS (alias lama → `/member-app.html`; gunakan `learn./member`) | `git push` |

Catatan:
- **Struktur learn (keputusan 2026-10-24, yang diminta user):**
  - Main Hub nav → `learn.xindelabs.web.id` (portal belajar)
  - `learn.xindelabs.web.id/member` → login member area (LMS baru, bukan `member.html` legacy)
  - `learn.xindelabs.web.id/kelas` → landing page kelas
  - `learn.xindelabs.web.id/workshop` → landing page workshop
- **`member.html` sekarang = LMS baru** (sinkron `member-app.html`, nav: Dashboard + Katalog Kelas). File fisik menang atas rewrite di Vercel cleanUrls — jangan ganti lagi jadi LMS legacy.
- **Admin satu pintu di `xindelabs.web.id/admin`** (keputusan 2026-10-23). `admin.xindelabs.web.id` + `admin.html` static diakses via redirect dari sana.
- Domain apex **tidak** dipindah ke project static. Semua API yang dipakai n8n/Mayar tetap hidup di `xindelabs.web.id`.
- `js/landing-boot.js` punya route guard: landing CMS "utama" hanya dirender di root, subdomain funnel pakai `funnel-engine`.
- Wildcard `*.xindelabs.web.id` sudah di-assign, tapi subdomain baru tetap didaftarkan eksplisit agar sertifikat TLS terbit (wildcard butuh DNS-01). DNS baru: CNAME ke `cname.vercel-dns.com`, proxy Cloudflare **off**.
- Konten funnel per subdomain tersimpan di tabel `funnels` + `funnel_steps` (bukan file). Subdomain baru = row `funnels` baru (`subdomain`, `slug`, `is_active`) + clone `funnel_steps`.
- Routing learn via `vercel.json` `rewrites` (bukan middleware): `/kelas → /index.html?view=kelas`, `/workshop → /workshop.html`, `/member → /member-app`. **Middleware TIDAK boleh import `next/server`** — project ini statik, tanpa dependency `next` (sudah 2× deploy gagal karena ini).

## 1. Fondasi Teknologi (Zero-Build Static & Modular ES6)
Project ini menggunakan arsitektur **Static HTML5 + Tailwind CSS + Vanilla JavaScript (ES6 Modules `type="module"`) + Supabase JS v2 (ESM CDN)** tanpa bundler (tanpa Vite/React/Webpack dan tanpa `package.json`).
- **Keunggulan:** Zero build error di Vercel, deploy instan, dan seluruh halaman fisik yang sudah ada (`/auth.html`, `/deck-workshop`, `/pre-session`) tetap berjalan normal tanpa terganggu.
- **Library Pendukung (via CDN):**
  - Database & Auth: `@supabase/supabase-js` (ESM)
  - Styling & Ikon: Tailwind CSS + Lucide Icons / FontAwesome
  - Grafik Admin Dashboard: `Chart.js` atau `ApexCharts`
  - Auto-Generate Sertifikat PDF: `html2pdf.js` / `jsPDF`
  - Render Artikel Blog (Markdown): `marked.js`

---

## 2. Struktur Folder Terpadu (Target Refactoring)
Gabungkan aset terbaik dari `xindelabs.web.id` (logika Admin, Funnel, Mayar/n8n) dan `xindelabs-workshop` (UI/UX Design System, LMS, Deck) ke dalam struktur berikut:

```text
/ (Root Directory)
├── index.html                  # Entry point utama & Subdomain Dispatcher
├── auth.html                   # Halaman Login/Register (Email + Google OAuth)
├── vercel.json                 # Konfigurasi Clean URLs, Headers, & Fallback Rewrite
├── ARCHITECTURE.md             # Blueprint utama untuk OpenCode
├── supabase_unified_schema.sql # Skema tabel tunggal Supabase
│
├── deck-workshop/              # [PERTAHANKAN] Folder fisik materi deck workshop
├── pre-session/                # [PERTAHANKAN] Folder fisik pre-session
│
├── css/
│   └── theme.css               # Design System seragam bergaya xindelabs-workshop
│
└── js/
    ├── config/
    │   └── supabase-client.js  # Inisialisasi Supabase + Cross-Subdomain Cookie Auth (.xindelabs.web.id)
    ├── router/
    │   └── subdomain-router.js # Pendeteksi hostname & pathname + fallback ?subdomain= untuk localhost
    └── modules/
        ├── main-hub.js         # Renderer untuk Root Domain (xindelabs.web.id & Blog Hermes)
        ├── admin-dashboard.js  # Renderer untuk admin.xindelabs.web.id (All-in-One Control)
        ├── member-lms.js       # Renderer untuk member.xindelabs.web.id (LMS & VIP 1-on-1)
        └── funnel-engine.js    # Renderer untuk [subdomain].xindelabs.web.id (Multi-Step Funnel)

└── js/admin/                   # Modul ES6 untuk Admin Dashboard (loaded dari admin.html)
    ├── index.js                # Registry modul admin (window.__ADMIN_MODULES__)
    ├── context.js              # Helper fetch/publish + createContext(client, cfg)
    ├── dashboard.js            # Dashboard Overview + Chart.js lazy loader
    ├── pipeline.js             # Pipeline Drop-off + WA follow-up 1 klik
    ├── funnel-builder.js       # CRUD funnel/step/block + Generate with Hermes
    ├── lms-vip.js              # Classes/Lessons, VIP quota, Project Review
    ├── blog-editor.js          # Blog Editor (CRUD blog_posts + Generate artikel Hermes)
    └── hermes-bridge.js        # Koneksi Admin Dashboard <-> Hermes Agent & agent_logs

## 4. Integrasi Hermes Agent (Tugas 6)
```text
├── api/
│   └── hermes.js               # Vercel Function: proxy ke webhook n8n (token server-side)
├── sql/
│   ├── migrate_2026_admin.sql  # WAJIB pertama: 93 kolom + 12 tabel baru + backfill + RLS
│   ├── agent_logs.sql          # Log aktivitas Hermes (standalone)
│   └── supabase_unified_schema.original.sql  # referensi sebelum di-jadi-kan never-abort
└── n8n-workflow-hermes-agent.json  # Template workflow n8n (import manual)
```

Alur data (3 transport, dipilih di Admin → Hermes → Pengaturan, disimpan di `settings.hermes_config`):
```text
Admin Dashboard ──(webhook)─────────────────────────► n8n /webhook/hermes-agent
              ──(proxy)──► /api/hermes (Vercel) ────► n8n /webhook/hermes-agent
              ──(bus)────► agent_tasks ──► Hermes (Telegram/worker) ──► agent_tasks.result
                                │
                                └──► agent_logs (audit trail, dibaca Admin → Aktivitas)
```

# XINDELABS ALL-IN-ONE ECOSYSTEM — ARCHITECTURE & AGENT RULES

## 1. Project Identity & Business Model
Repository ini adalah sistem Single-Codebase Multi-Subdomain (Next.js App Router + Supabase + Tailwind CSS) untuk **XindeLabs (`xindelabs.web.id`)**:
1. `xindelabs.web.id` -> Main Hub (Personal Branding, `/blog`, `/portofolio`, `/service` B2B AI Agent, `/p/[slug]` Sales Pages, dan `/admin` Master Control Panel).
2. `learn.xindelabs.web.id` -> LMS & Katalog (Kelas modul, Workshop Live/Replay, Upsell Modal Kelas Gembok, Widget Slot VIP, dan Menu VIP 1-on-1 Lounge).
3. `tutorial.xindelabs.web.id` -> Stepped Funnel (Step 0: Lead Capture -> Step 1: VIP Offer -> Step 2: Course Downsell + Countdown -> Step 3: Free Hermes Tutorial + Discord).

## 2. Design System: Futuristic Developer Theme (STRICT)
Gunakan estetika futuristik ala developer tool modern:
- **Background Primary**: `#050A07` (Deep Obsidian Green-Black)
- **Background Card / Surface**: `#0A140E` dengan backdrop-blur dan border `#163020`
- **Primary Accent (Neon Green)**: `#00FF66` atau `#10B981` (Hover: `#059669`)
- **Secondary Accent (Dark Green)**: `#064E3B`
- **Text Primary**: `#FFFFFF` (Crisp White)
- **Text Muted**: `#9CA3AF` / `#A7F3D0`
- **Typography**: Sans-serif bersih (`Inter` / `Geist`) untuk UI, dan Monospace (`JetBrains Mono`) untuk badge, angka metrik, countdown, dan blok prompt/kode.

## 3. Strict Coding & Cleanup Rules
- **DILARANG membuat file duplikat** (seperti `page-new.tsx`, `Navbar2.tsx`, `DashboardOld.tsx`).
- Sebelum membuat komponen baru, cek `src/components/`. Gunakan komponen bersama.
- Saat merapikan frontend lama, pindahkan file/halaman yang tidak terpakai ke folder `_archive_legacy/` terlebih dahulu, pastikan `npm run build` lulus tanpa error, baru hapus jika diminta.
- Pertahankan koneksi backend Supabase, environment variables, dan integrasi API yang sudah berjalan.
- Auth menggunakan Supabase SSR (`@supabase/ssr`) dengan cookie options `domain: '.xindelabs.web.id'` di production agar login menyatu antar subdomain.

## 4. RTK (Rust Token Killer)
RTK terpasang sebagai CLI global (`~/.local/bin/rtk`). Plugin auto-rewrite opencode tidak dipakai (scope proyek). Karena itu, **selalu prefix `rtk`** untuk perintah dengan output verbose di proyek ini:

- `rtk ls` / `rtk find` — daftar file ringkas
- `rtk git status` / `rtk git log -n 10` / `rtk git diff` — output git ringkas
- `rtk git add` / `rtk git commit -m "..."` / `rtk git push` — baris konfirmasi
- `rtk test npm test` / `rtk vitest` / `rtk next build` / `rtk tsc` — hanya failure
- `rtk grep "pola" .` — hasil pencarian terkelompok
- `rtk read <file>` — baca file cerdas (struktur/signature)
- `rtk gh pr list` / `rtk gh issue list` — listing ringkas

Jika output penting terpotong, gunakan `rtk recall <id>` untuk output penuh. Pantau hemat token: `rtk gain`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

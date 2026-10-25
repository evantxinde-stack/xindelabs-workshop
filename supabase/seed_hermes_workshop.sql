-- Hermes Workshop seed. Run after 20261025000000_workshop_kit_schema.sql.
-- Idempotent by class slug and child natural keys.

insert into public.classes (slug, title, description, price, product_type, is_published, sort_order)
values (
  'hermes-agent-workshop',
  'Bangun Hermes Agent dari Nol',
  'Workshop praktis delapan modul: dari mindset, AI Agent, instalasi Hermes, SOUL.md, arsitektur, skills, plugins, sampai loop engineering.',
  0,
  'workshop',
  true,
  1
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  product_type = excluded.product_type,
  is_published = excluded.is_published;

with workshop as (
  select id from public.classes where slug = 'hermes-agent-workshop' limit 1
)
insert into public.workshop_pre_sessions
  (class_id, slug, title, description, sort_order, tools, downloads, checklist)
select
  id,
  'hermes-workshop-readiness',
  'Pre-Session: Siapkan Hermes Agent Lo',
  'Persiapan akun, tools, model, VPS, instalasi Hermes, dan struktur agent sebelum masuk delapan modul workshop.',
  1,
  '[
    {"name":"Telegram Desktop & @BotFather","purpose":"Channel komunikasi dan Bot Token"},
    {"name":"GitHub","purpose":"Repository dan versi konfigurasi agent"},
    {"name":"Vercel","purpose":"Deployment frontend/webhook"},
    {"name":"OpenCode CLI/Desktop","purpose":"AI coding agent"},
    {"name":"Atria ASI API","purpose":"LLM engine Atria-Dawn-Preview"},
    {"name":"VPSMurah","purpose":"Runtime Hermes 24/7"}
  ]'::jsonb,
  '[
    {"label":"OpenCode installer","url":"https://opencode.ai/install"},
    {"label":"GitHub signup","url":"https://github.com/signup"},
    {"label":"Vercel signup","url":"https://vercel.com/signup"}
  ]'::jsonb,
  '[
    {"id":"telegram","label":"Telegram Desktop terpasang dan Bot Token tersimpan","section":"Persiapan"},
    {"id":"github","label":"Akun GitHub aktif dan terverifikasi","section":"Persiapan"},
    {"id":"vercel","label":"Vercel terhubung ke GitHub","section":"Persiapan"},
    {"id":"opencode","label":"OpenCode sudah terinstal","section":"Persiapan"},
    {"id":"api-key","label":"API key LLM sudah dibuat dan disimpan aman","section":"Persiapan"},
    {"id":"runtime","label":"Memilih lokal atau Cloud VPS","section":"Lokal / Cloud"},
    {"id":"hermes","label":"Hermes Agent terpasang","section":"Hermes Agent"},
    {"id":"gateway","label":"Model dan Gateway Telegram terhubung","section":"Hermes Agent"},
    {"id":"brief","label":"Workflow pertama dan delegation brief siap","section":"Prompt & Plan"}
  ]'::jsonb
from workshop
on conflict (class_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  tools = excluded.tools,
  downloads = excluded.downloads,
  checklist = excluded.checklist,
  updated_at = now();

with workshop as (
  select id from public.classes where slug = 'hermes-agent-workshop' limit 1
)
insert into public.workshop_decks
  (class_id, title, sort_order, content_markdown, code_language, theme)
select id, v.title, v.sort_order, v.content_markdown, 'bash', 'futuristic-green'
from workshop cross join (values
  (1, 'Modul 1 — Mindset: Identify · Adapt · Automate', $$# Identify · Adapt · Automate

Identifikasi workflow yang berulang. Adaptasikan menjadi langkah-langkah. Automatiskan bagian yang aman; minta persetujuan untuk bagian penting.

## Trial · Error · Evaluate

Mulai dari scope kecil. Reverse engineer error. Evaluasi dan iterasi sampai workflow stabil.

> Jadilah arsitek agent, bukan operator yang mengulang pekerjaan.$$),
  (2, 'Modul 2 — Intro to AI Agents', $$# Agent vs Chatbot

## AI Agent
- Proaktif dan otonom
- Merencanakan langkah
- Menjalankan tools eksternal
- Mengamati hasil dan retry saat gagal

## Chatbot
- Pasif dan reaktif
- Merespons prompt dalam satu sesi
- Tidak punya rencana atau eksekusi mandiri$$),
  (3, 'Modul 3 — Introduction to Hermes', $$# Hermes: autonomous agent framework

Hermes adalah framework open-source dari Nous Research. Orkestrator antarprogram lewat LLM yang bisa melakukan aksi nyata.

## Kenapa Hermes?
- Agent berkembang mengikuti pola kerja
- Memory persisten dan auto-generated skills
- Skill Hub dan Plugin Hub

## Infrastruktur
Bandingkan lokal dengan Cloud/VPS: runtime lokal cocok untuk eksperimen; VPS cocok untuk agent aktif 24/7.$$),
  (4, 'Modul 4 — How to Install', $$# Install dan hubungkan Hermes

1. Pilih lokal atau VPS.
2. Pasang Hermes Agent.
3. Hubungkan model Atria-Dawn-Preview.
4. Konfigurasikan Gateway Telegram.
5. Jalankan diagnostik.

```bash
hermes setup
hermes doctor
```

Target: agent merespons Telegram dan berjalan 24/7.$$),
  (5, 'Modul 5 — Give Your Agent Life', $$# SOUL.md

SOUL.md mendefinisikan kepribadian, gaya komunikasi, larangan, dan aturan teknis agent.

```markdown
# Identity
Kamu adalah agent operasional yang ringkas dan dapat diaudit.

# Rules
Jangan mengirim, menghapus, atau membayar tanpa persetujuan.
```

Instruksi yang jelas membuat agent konsisten dan aman.$$),
  (6, 'Modul 6 — Arsitektur & Alur Kerja', $$# Enam komponen Hermes

- **Bot** — antarmuka percakapan
- **Profile** — identitas dan konfigurasi
- **Orchestrator** — pengarah pekerjaan
- **Kanban** — status dan antrean tugas
- **Worker** — eksekutor pekerjaan
- **Swarm** — koordinasi banyak worker

Alur: request → plan → execute → observe → evaluate.$$),
  (7, 'Modul 7 — Give Agent Hand', $$# Skill & Plugin

Skill memberi prosedur berulang. Plugin memberi koneksi dan kemampuan aksi nyata.

Mulai dari satu workflow yang jelas. Batasi permission. Uji dalam scope kecil sebelum menghubungkan data produksi.$$),
  (8, 'Modul 8 — Loop Engineering', $$# Reason → Act → Observe

Agent yang baik tidak berhenti setelah aksi pertama.

1. Reason: tentukan langkah.
2. Act: jalankan tool.
3. Observe: baca hasil.
4. Evaluate: cek target.
5. Retry atau minta persetujuan bila perlu.

> Jalan dulu dengan guardrail; sempurna lewat evaluasi.$$)
) as v(sort_order, title, content_markdown)
where not exists (
  select 1 from public.workshop_decks d
  where d.class_id = workshop.id and d.sort_order = v.sort_order
);

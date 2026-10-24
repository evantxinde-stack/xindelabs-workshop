# Legacy inventory — migration baseline

Generated on branch `refactor/all-in-one-nextjs` before archive. Production branch untouched.

## Legacy HTML pages
- `access-gate/login.html` → legacy HTML page (`/login`)
- `admin.html` → legacy HTML page (`/admin`)
- `auth.html` → legacy HTML page (`/auth`)
- `blog.html` → legacy HTML page (`/blog`)
- `checkout.html` → legacy HTML page (`/checkout`)
- `deck-workshop/index.html` → legacy HTML page (`/`)
- `failed.html` → legacy HTML page (`/failed`)
- `index.html` → legacy HTML page (`/`)
- `karyawan.html` → legacy-only asset; business decision: do not convert or expose as a Next.js route
- `kelas.html` → legacy HTML page (`/kelas`)
- `login.html` → legacy HTML page (`/login`)
- `member-app.html` → legacy HTML page (`/member-app`)
- `member.html` → legacy HTML page (`/member`)
- `page.html` → legacy HTML page (`/page`)
- `pending.html` → legacy HTML page (`/pending`)
- `pre-session/index.html` → legacy HTML page (`/`)
- `preorder.html` → legacy HTML page (`/preorder`)
- `success.html` → legacy HTML page (`/success`)
- `thankyou.html` → legacy HTML page (`/thankyou`)
- `upsell.html` → legacy HTML page (`/upsell`)
- `workshop.html` → legacy HTML page (`/workshop`)

## Design/assets
- `assets/founder.jpg`
- `favicon.png`
- `css/style.css`
- `css/theme.css`
- `css/design-system.css`
- `css/admin.css`
- `js/lp-render.js`
- `js/landing-boot.js`
- `js/landing-pages.js`
- `js/router/subdomain-router.js`

Observed design system: Space Grotesk, JetBrains Mono, Instrument Serif; dark/green/white palette; CSS tokens in `css/`.

## API/Supabase integration sources
- `api/hermes.js`
- `js/config.js`
- `js/config/supabase-client.js`
- `js/modules/checkout.js`
- `js/modules/funnel-engine.js`
- `js/modules/main-hub.js`
- `js/modules/member-lms.js`
- `js/modules/blog.js`

Observed Supabase tables/contracts: `site_content`, `funnels`, `leads`, `orders`, `pipeline_events`, `members`, `classes`, `lessons`, `lesson_progress`, `certificates`, `vip_settings`, `vip_bookings`, `vip_projects`, `partnership_inquiries`.

## Legacy route rules
- Root / preview: `js/router/subdomain-router.js` resolves root, admin, member, and funnel subdomains.
- Physical protected paths: `/auth`, `/deck-workshop`, `/pre-session`.
- Root rewrites: `/auth`, `/kelas`, `/workshop`, `/member`, fallback `/(.*)` in archived `vercel.json`.

## Next.js conversion backlog
- Main: `/` plus dynamic landing/funnel routes and `/service`, `/portofolio`, `/blog`, `/blog/[slug]`.
- Commerce: `/checkout`, success, pending/failed/thank-you/upsell flows.
- Learning: `/auth`, `/login`, `/member`, `/kelas`, `/deck-workshop`, `/pre-session`.
- Admin: legacy `admin.html` and `js/admin/*`; Next.js admin routes already exist under `src/app/admin`.
- Shared: navigation/footer, landing section renderer, tracking/pixels, Supabase client, payment/lead API contracts.

## Business decisions — Fase 2 update

- `karyawan.html` is legacy-only and will not be converted or exposed as a Next.js route.
- `deck-workshop/index.html` and `pre-session/index.html` are source material, not standalone replacement pages.
- Their content becomes seed data for the first workshop in the dynamic route `/workshop/[slug]` on `learn.xindelabs.web.id`.
- Workshop tabs: `Pre-Session` and `Slide Deck`. Both are protected for workshop buyers, VIP members, and Admin.
- Admin gets a Workshop Kit Manager under the Admin Panel.

## Dynamic Workshop route reconciliation

| Requirement | Target route/status |
|---|---|
| Workshop catalog | `learn.xindelabs.web.id/kelas` — Next.js route still needs to be created |
| Workshop detail | `learn.xindelabs.web.id/workshop/[slug]` — new dynamic route required |
| Pre-Session tab | Inside `/workshop/[slug]`; checklist, short videos, tools/installations, downloads, interactive completion state |
| Slide Deck tab | Inside `/workshop/[slug]`; Markdown/code-block slides, full-screen browser presentation, or external embed |
| Protected materials | Same workshop entitlement guard; no standalone `/deck-workshop` or `/pre-session` conversion |
| Workshop Kit Manager | `/admin/workshops` — new admin route required |
| Legacy deck seed | Convert headings/content/assets from `_legacy_archive/deck-workshop/index.html` into first workshop deck records |
| Legacy pre-session seed | Convert roadmap, preparation cards, tools, and setup sections from `_legacy_archive/pre-session/index.html` into first workshop pre-session records |

Current `/tutorial` and `/vip-coaching` remain separate public funnel pages. They are not substitutes for the protected workshop tabs.

## Supabase additions required for Workshop Kit Manager

The audit found no existing `workshop_pre_sessions` or `workshop_decks` tables. Add a migration after confirming the actual production shape of `members`, `classes`, and entitlement/order joins.

Minimum model:

- `workshop_pre_sessions`: `id`, `workshop_id`/`class_id`, `slug`, `title`, `description`, `sort_order`, `video_url`, `tools` JSONB, `downloads` JSONB, `checklist` JSONB, `published`, timestamps.
- `workshop_decks`: `id`, `workshop_id`/`class_id`, `title`, `sort_order`, `content_markdown`, `code_language`, `external_embed_url`, `theme`, `published`, timestamps.
- Optional `workshop_deck_slides`: use only if slide-level CRUD/search is needed; otherwise keep Markdown in `workshop_decks` to avoid premature schema complexity.
- Participant completion requires a separate progress relation, e.g. `workshop_pre_session_progress(member_id, pre_session_id, completed_at)`, not a mutable global checklist row.

Required entitlement rule: `workshop/[slug]` may expose the tabs only when the current user is an Admin, a paid workshop buyer for that workshop, or an eligible VIP member. Public catalog metadata may remain visible without tab content.

## Updated conversion backlog

- Main: `/` plus dynamic landing/funnel routes and `/service`, `/portofolio`, `/blog`, `/blog/[slug]`.
- Commerce: `/checkout/[product]` and status pages; do not recreate archived HTML one-for-one.
- Learn: public `/kelas`, dynamic protected `/workshop/[slug]`, member dashboard, course player, VIP lounge.
- Admin: existing dashboard/LMS/voucher routes plus new `/admin/workshops` Workshop Kit Manager.
- Explicitly excluded: `karyawan.html`.

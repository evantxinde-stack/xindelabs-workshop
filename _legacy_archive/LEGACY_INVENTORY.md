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
- `karyawan.html` → legacy HTML page (`/karyawan`)
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

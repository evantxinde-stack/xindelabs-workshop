# PRD — Build Your Own Personalized Agent [For Sales Person]

> **Status:** Frontend & Admin CMS akan di-build via vibe coding (Bolt/Lovable/v0/Cursor).
> **Backend integration** (Mayar payment, n8n, Google Sheets, Discord, Supabase wiring) dikerjakan terpisah.
> **Repository:** github.com/evantxinde-stack/xindelabs-workshop (sudah terhubung Vercel — auto-deploy tiap push)

---

## 1. Ringkasan Produk

Ecourse subscription untuk **sales person** (agen asuransi, agen properti, freelancer) yang mau belajar bangun AI Agent pribadi buat follow-up otomatis, riset calon client, bikin konten promosi, dan handle objeksi — tanpa coding.

| Item | Nilai |
|---|---|
| Nama produk | Build Your Own Personalized Agent |
| Segmen | FOR SALES PERSON |
| Harga tier 1 | **Rp 599.000 / tahun** (subscription, auto-deploy nanti) |
| Harga tier 2 | **Rp 999.000 / lifetime** (sekali bayar, akses selamanya) |
| Konten | Video Course + AI Bot Tanya Jawab + Prompt Library + Komunitas Discord + AI News + Use-case Update |
| Target | Sales person non-teknis, mobile-first |

---

## 2. Tema Desain (WAJIB)

**Futuristic Neon — Dark Green / Green / White**

```
Palette:
  --bg:        #030f0a          (hampir hitam, green tint)
  --bg-2:      #07231a          (card/surface)
  --border:    #0f3d2e          (border halus)
  --green:     #00ff88          (NEON primary — aksen utama)
  --green-dim: #00cc6e          (hover/secondary)
  --cyan:      #00e5ff          (secondary glow, opsional)
  --white:     #eafff5          (teks utama)
  --muted:     #7fbfa3          (teks sekunder)
  --danger:    #ff5c7a          (error)
```

**Rules desain:**
- Bold neon glow: `box-shadow: 0 0 20px rgba(0,255,136,.35)` pada tombol/CTA & elemen hero
- Gradient text untuk kata kunci: `background: linear-gradient(90deg, #00ff88, #00e5ff); -webkit-background-clip: text;`
- Elemen terminal/monospace (font: SF Mono / JetBrains Mono / Consolas) — identitas "tech builder"
- Dark background dominan, hijau neon sebagai aksen, putih untuk teks
- Efek glow subtle di card border (hover), grid background pattern halus di hero (CSS, bukan gambar)
- **Responsive WAJIB**: mobile (≤600px) & desktop. Mobile: stack 1 kolom, nav jadi hamburger. Desktop: grid 2-3 kolom, hero layout seimbang

---

## 3. Halaman & Routing

Semua halaman **static HTML** (boleh React/Next kalau vibe tool default-nya gitu — asal hasil akhirnya deployable di Vercel & route-nya match):

| Route | Halaman |
|---|---|
| `/` atau `/agent-course/` | Landing page (index.html) |
| `/checkout` atau `/agent-course/checkout.html` | Checkout + lead form |
| `/login` atau `/agent-course/login.html` | Login/Daftar (Supabase Auth) |
| `/member` atau `/agent-course/member.html` | Member area / LMS |
| `/admin` atau `/agent-course/admin.html` | **Admin CMS** (baru, dibangun di sini) |
| `/success` | Halaman sukses + Pixel Purchase |

> ⚠️ Contract: path di atas HARUS konsisten — backend (n8n/Mayar) akan redirect ke path sukses/pending/failed. Pilih satu & konsisten.

---

## 4. Landing Page — Section Order (WAJIB)

1. **Navbar** — logo, link (Course, Yang Didapat, Harga, Login), CTA "Daftar Course"
2. **Hero** — headline provokatif + subheadline + CTA + harga mulai + badge segmen
3. **Video Intro** — YouTube embed (responsive 16:9), caption mono
4. **Live Proof** — 3 angka (24/7, 10x follow-up, 30 detik riset) + disclaimer [contoh]
5. **Modules** — terminal window style, `ls modules/ --published`, daftar modul beginner/level-up/pro
6. **6 Benefits** — grid: 🎬 Video Course, 🤖 AI Bot Tanya Jawab, 📚 Kumpulan Prompt, 💬 Komunitas Discord, 📰 AI News, 🔄 Use-case Update
7. **Testimoni** — 2-3 quote + nama mono
8. **Pricing (2 TIER)** — dua kartu:
   - **Tahunan:** Rp 599.000/tahun (≈Rp 1.600/hari)
   - **Lifetime:** Rp 999.000 sekali bayar (BADGE "TERBAIK" / "SELAMANYA")
9. **FAQ** — 6-8 accordion (newbie, coding, khusus sales?, beda ChatGPT, refund, pembayaran)
10. **Closing CTA** + footer

**Semua teks konten diambil dari CMS** (lihat §6) dengan fallback ke default yang di-hardcode di file.

---

## 5. Checkout Page (WAJIB — ini LEAD CAPTURE)

### Form (semua wajib):
- Nama Lengkap
- Email Aktif
- No. WhatsApp (pattern: 08xx, min 9 digit)
- **Discord User ID** (angka 17-18 digit) + **tutorial collapsible** dengan 2 tab: 📱 Mobile / 💻 Desktop (Developer Mode → Copy User ID)

### Pilihan Tier (radio/selector sebelum tombol bayar):
```
( ) Rp 599.000 — 1 tahun
( ) Rp 999.000 — Lifetime (sekali bayar)
```

### 🔗 INTEGRATION CONTRACT (JANGAN DIUBAH — backend sudah live):
```javascript
// POST ke webhook n8n (SUDAH LIVE)
const N8N_WEBHOOK = "https://n8n.43-133-131-126.sslip.io/webhook/create-payment";

// Payload (harga menyesuaikan tier yang dipilih user):
{
  nama: "...",
  email: "...",
  wa: "...",
  discord: "...",
  produk: "build-your-own-personalized-agent",
  harga: 599000   // atau 999000 untuk lifetime
}

// Response: { payment_url: "https://xindelabs.myr.id/invoices/XXX" }
// → window.location.href = payment_url (redirect ke Mayar payment page)
```

### Meta Pixel (WAJIB):
```html
fbq('init', '921699146613715');
fbq('track', 'PageView');
fbq('track', 'InitiateCheckout');  // saat halaman checkout terbuka
```

---

## 6. Admin CMS (baru — dibangun di vibe coding)

### Tujuan
Lo (admin) bisa ubah konten landing page sendiri tanpa sentuh kode.

### Auth
- Login pakai **Supabase Auth** (email+password, sama dengan member)
- Cek role admin: query tabel `admins` by email (sudah di-setup di SQL)
- Kalau bukan admin → tampilkan "akses ditolak"

### Data — tabel `site_content` (Supabase, sudah dibuat SQL-nya):
```
key: 'homepage'
value: jsonb {
  hero_title, hero_subtitle,
  video_youtube_id, video_caption,
  price_yearly (599000), price_lifetime (999000),
  discord_link, whatsapp_link, instagram_handle,
  testimonials: [{quote, name}],
  faqs: [{q, a}]
}
```

### Form CMS (semua editable):
- Hero title & subtitle
- Video YouTube ID
- Harga tahunan & lifetime
- Link Discord / WhatsApp / Instagram
- Testimoni (add/remove rows)
- FAQ (add/remove rows)

### 🔗 INTEGRATION CONTRACT (Supabase):
```javascript
// CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
const SUPABASE_URL = "https://XXXX.supabase.co";      // ganti dari project lo
const SUPABASE_ANON_KEY = "eyJ...";                   // ganti

// Baca (semua orang boleh):
const { data } = await supabase.from('site_content')
  .select('value').eq('key', 'homepage').single();

// Tulis (hanya admin — RLS sudah handle di backend):
await supabase.from('site_content')
  .upsert({ key: 'homepage', value: newContent });
```

### Landing page juga baca dari sini (dengan fallback):
```javascript
// Load konten dari CMS → kalau gagal/gak ada, pakai default hardcoded
```

---

## 7. Member Area / LMS

- **Login gate**: wajib login (Supabase session), kalau belum → redirect /login
- **Membership check**: query `members` by email → kalau `status='paid'`:
  - `tier='yearly'` → cek `paid_until` masih ≥ hari ini
  - `tier='lifetime'` → selalu aktif
  - kalau expired/ga ada → tampilkan "Belum Jadi Member" + CTA checkout
- **Isi**: grid modul (level badge + judul + durasi), klik → buka player YouTube embed di atas
- **Link ekstra**: AI Bot, Discord, Prompt Library, AI News (bisa dari CMS juga)
- **Logout button**

### Modul (default — bisa lo ubah via CMS nanti):
```
beginner ·Kenalan sama AI Agent: Bukan Cuma ChatGPT
beginner ·Setup Agent Pertama Lo dalam 30 Menit
beginner ·Bikin Agent Follow-up WA yang Bales Sendiri
level-up ·Agent Riset Calon Client
level-up ·Agent Konten: 10 Caption Promosi dalam 1 Menit
level-up ·Agent Objeksi: Jawab Mahal, Nanti Dulu, Pikir-pikir
level-up ·Hubungin Agent ke WhatsApp & Email
pro ·Agent Rekap: Laporan Closing Otomatis
pro ·Cara Ngatur Banyak Agent Biar Ga Kacau
```

---

## 8. Success Page

- 🎉 + "Pembayaran Berhasil" + langkah: cek email (link course + Discord invite), cek spam
- Pixel: `fbq('track', 'Purchase', {value: <harga>, currency: 'IDR'})`

---

## 9. Non-Goals (JANGAN dikerjakan di frontend/CMS)

- ❌ Jangan bikin sistem pembayaran sendiri — webhook n8n yang handle (contract §5)
- ❌ Jangan bikin auth sendiri — pakai Supabase Auth
- ❌ Jangan simpan data member di localStorage sebagai sumber kebenaran — tabel `members` di Supabase
- ❌ Jangan bikin backend/API sendiri — n8n + Apps Script + Supabase yang handle

---

## 10. Acceptance Criteria

- [ ] Theme neon dark-green/green/white, responsive mobile & desktop
- [ ] Landing semua section + video YouTube embed
- [ ] Pricing 2 tier (599rb/tahun, 999rb/lifetime) — pilihan tier mempengaruhi payload harga checkout
- [ ] Checkout form lengkap (nama, email, WA, Discord ID + tutorial) → POST contract §5 → redirect payment_url
- [ ] Login page (Supabase Auth)
- [ ] Member area: login-gate + membership check + modul + video player
- [ ] Admin CMS: login admin → edit semua konten → tersimpan di site_content → landing page reflect perubahan
- [ ] Meta Pixel di semua halaman
- [ ] Deployable di Vercel, auto-deploy dari GitHub

---

## 11. Setelah Frontend Beres (Backend yang dikerjain di luar scope ini)

1. n8n create-payment: harga dinamis (599k/999k) + product Mayar baru
2. n8n callback → Apps Script /mark-paid → status PAID + Discord invite + email invitation
3. Apps Script follow-up belum bayar (H+2/H+24/H+72)
4. Supabase: insert member (email, tier, paid_until) saat payment sukses
5. Konek Discord bot invite + role assignment

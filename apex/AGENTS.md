# RTK (Rust Token Killer)

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

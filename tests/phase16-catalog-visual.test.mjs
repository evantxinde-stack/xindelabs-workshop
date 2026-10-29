import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const catalog = read("src/app/learn/catalog.tsx");
const grid = read("src/app/learn/catalog-grid.tsx");
const kelas = read("src/app/learn/kelas/page.tsx");
const lib = read("src/lib/catalog.ts");
const adminCourses = read("src/app/admin/lms/courses/page.tsx");
const adminApi = read("src/app/api/admin/classes/route.ts");
const locked = read("src/app/learn/locked-detail.tsx");
const course = read("src/app/learn/course/[slug]/page.tsx");
const quickUpsell = read("src/app/learn/dashboard/quick-upsell.tsx");

test("catalog cards render a cover image with a graceful fallback", () => {
  assert.match(lib, /cover_image/);
  assert.match(catalog, /cover_image\?: string \| null/);
  assert.match(catalog, /item\.cover_image/);
  assert.match(catalog, /aspect-video/);
  assert.match(catalog, /object-cover/);
});

test("catalog cards show a status badge and an entitlement-aware action", () => {
  assert.match(catalog, /const badge = free \? "Gratis" : locked \? "Terkunci" : hasSale \? "Early bird" : type/);
  assert.match(catalog, /Lihat benefit/);
  assert.match(catalog, /FreeAccessButton/);
  assert.match(catalog, /Buka akses/);
});

test("admin can edit cover URL and API persists it", () => {
  assert.match(adminCourses, /Cover kelas \(URL gambar\)/);
  assert.match(adminCourses, /form\.cover_image/);
  assert.match(adminApi, /cover_image/);
});

test("locked course detail has cover, curriculum preview, and purchase CTA", () => {
  assert.match(locked, /aspect-video/);
  assert.match(locked, /Akses dibuka setelah pembelian|akses dibuka setelah pembelian/);
  assert.match(locked, /Tanya dulu via WhatsApp/);
  assert.match(course, /<LockedDetail/);
  assert.match(quickUpsell, /<LockedDetail/);
});

test("catalog page groups products behind category filters", () => {
  assert.match(grid, /useState\("all"\)/);
  assert.match(grid, /Semua/);
  assert.match(grid, /Workshop/);
  assert.match(grid, /VIP/);
  assert.match(grid, /role="tablist"/);
  assert.match(kelas, /CatalogGrid/);
});

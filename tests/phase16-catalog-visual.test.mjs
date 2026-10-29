import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const catalog = read("src/app/learn/catalog.tsx");
const grid = read("src/app/learn/catalog-grid.tsx");
const kelas = read("src/app/learn/kelas/page.tsx");
const lib = read("src/lib/catalog.ts");

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

test("catalog page groups products behind category filters", () => {
  assert.match(grid, /useState\("all"\)/);
  assert.match(grid, /Semua/);
  assert.match(grid, /Workshop/);
  assert.match(grid, /VIP/);
  assert.match(grid, /role="tablist"/);
  assert.match(kelas, /CatalogGrid/);
});

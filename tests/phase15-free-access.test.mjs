import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/api/member/free-access/route.ts", import.meta.url), "utf8");
const button = readFileSync(new URL("../src/app/learn/free-access-button.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/app/learn/catalog.tsx", import.meta.url), "utf8");
const gate = readFileSync(new URL("../src/lib/membership-access.ts", import.meta.url), "utf8");

test("free workshop claim requires a published zero-price workshop", () => {
  assert.match(route, /product_type !== "workshop"/);
  assert.match(route, /Number\(cls\.price\) !== 0/);
  assert.match(route, /!cls\.is_published/);
});

test("free workshop claim requires member session and persists both identifiers", () => {
  assert.match(route, /member_access_token/);
  assert.match(route, /owned_classes/);
  assert.match(route, /cls\.id, cls\.slug/);
  assert.doesNotMatch(route, /createInvoice|MAYAR_API_KEY/);
});

test("catalog uses the free-access action instead of checkout for zero-price workshops", () => {
  assert.match(catalog, /FreeAccessButton/);
  assert.match(catalog, /const free = Number\(item\.price\) === 0/);
  assert.match(catalog, /free && type === "workshop"/);
  assert.match(button, /\/api\/member\/free-access/);
});

test("free workshop entitlement bypasses paid billing status but paid classes do not", () => {
  assert.match(gate, /const freeWorkshop = cls\?\.product_type === "workshop" && Number\(cls\?\.price\) === 0/);
  assert.match(gate, /if \(freeWorkshop\)/);
  assert.match(gate, /if \(access === "none"\) return false/);
});

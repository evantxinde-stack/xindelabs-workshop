import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ownsClass } from "../src/lib/membership-access.ts";

const cls = (slug, product_type = "course") => ({ id: slug, slug, product_type });

test("annual members only own Hermes and never VIP", () => {
  const member = { payment_option: "annual", billing_status: "active", paid_until: "2099-01-01", owned_classes: [] };
  assert.equal(ownsClass(member, cls("kelas-bangun-hermes-agent")), true);
  assert.equal(ownsClass(member, cls("kelas-lain")), false);
  assert.equal(ownsClass(member, cls("mentoring-vip-bulanan")), false);
});

test("lifetime members own regular classes but VIP stays gated", () => {
  const member = { payment_option: "lifetime", billing_status: "active", owned_classes: [] };
  assert.equal(ownsClass(member, cls("kelas-lain")), true);
  assert.equal(ownsClass(member, cls("mentoring-vip-bulanan")), false);
});

test("member auth has canonical OAuth redirect, logout, and password settings", () => {
  const login = readFileSync(new URL("../src/app/learn/login/page.tsx", import.meta.url), "utf8");
  const dashboard = readFileSync(new URL("../src/app/learn/dashboard/page.tsx", import.meta.url), "utf8");
  const menu = readFileSync(new URL("../src/components/MemberAccountMenu.tsx", import.meta.url), "utf8");
  assert.match(login, /\/learn\/auth\/callback/);
  assert.match(login, /learn\.xindelabs\.web\.id/);
  assert.match(dashboard, /MemberAccountMenu/);
  assert.match(menu, /\/api\/member\/logout/);
  assert.match(menu, /\/api\/member\/password/);
});

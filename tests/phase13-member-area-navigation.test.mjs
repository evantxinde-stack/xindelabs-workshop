import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const course = readFileSync(new URL("../src/app/learn/course/[slug]/page.tsx", import.meta.url), "utf8");
const workshop = readFileSync(new URL("../src/app/learn/workshop/[slug]/page.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/app/learn/catalog.tsx", import.meta.url), "utf8");

test("course and workshop pages provide a return-to-classes link", () => {
  assert.match(course, /BackToClasses/);
  assert.match(workshop, /BackToClasses/);
  assert.match(catalog, /href=\"\/learn\/dashboard\"/);
});

test("locked member pages show member pricing before checkout", () => {
  assert.match(course, /member_cross_sell_price/);
  assert.match(workshop, /member_cross_sell_price/);
  assert.match(course, /Beli harga member/);
  assert.match(workshop, /harga member/);
});

test("existing members can recover a password from the login page", () => {
  const login = readFileSync(new URL("../src/app/learn/login/page.tsx", import.meta.url), "utf8");
  const reset = readFileSync(new URL("../src/app/learn/reset-password/page.tsx", import.meta.url), "utf8");
  assert.match(login, /resetPasswordForEmail/);
  assert.match(login, /\/learn\/reset-password/);
  assert.match(reset, /exchangeCodeForSession/);
  assert.match(reset, /updateUser\(\{\s*password/);
});

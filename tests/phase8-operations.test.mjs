import test from "node:test";
import assert from "node:assert/strict";
import { isValidEmail } from "../src/lib/validate.ts";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("email validation rejects addresses Resend cannot deliver", () => {
  assert.equal(isValidEmail("valid@example.com"), true);
  assert.equal(isValidEmail("qa+test@xindelabs.web.id"), true);
  // Regression: this exact address produced 4 permanently-stuck queue rows.
  assert.equal(isValidEmail("samdoingjob.@gmail.com"), false);
  assert.equal(isValidEmail(".leading@gmail.com"), false);
  assert.equal(isValidEmail("two..dots@gmail.com"), false);
  assert.equal(isValidEmail("no-at-sign"), false);
  assert.equal(isValidEmail("name@"), false);
  assert.equal(isValidEmail("name@gmail"), false);
});

test("email dispatcher parks malformed addresses instead of retrying forever", () => {
  const email = read("src/lib/email.ts");
  assert.match(email, /isValidEmail\(lead\.email\)/);
  assert.match(email, /status: "skipped", error: `invalid lead email/);
});

test("admin membership view is read-only and grouped by renewal state", () => {
  const page = read("src/app/admin/membership/page.tsx");
  assert.match(page, /requireAdmin/);
  assert.match(page, /renewalWindow/);
  assert.match(page, /Masa tenggang/);
  assert.doesNotMatch(page, /\.update\(|\.insert\(|\.delete\(/);

  const lead = read("src/app/api/lead/route.ts");
  assert.match(lead, /isValidEmail\(email\)/);
});

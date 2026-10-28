import test from "node:test";
import assert from "node:assert/strict";
import { renewalWindow, graceUntil } from "../src/lib/billing.ts";

const now = new Date("2026-10-28T00:00:00Z");

test("renewal window distinguishes active, due, grace, expired, lifetime", () => {
  assert.equal(renewalWindow(null, now).state, "lifetime");
  assert.equal(renewalWindow("2026-12-01", now).state, "active");
  assert.equal(renewalWindow("2026-11-10", now).state, "due");
  assert.equal(renewalWindow("2026-10-25", now).state, "grace");
  assert.equal(renewalWindow("2026-10-01", now).state, "expired");
});

test("grace ends seven days after paid_until", () => {
  assert.equal(graceUntil("2026-10-28"), "2026-11-04");
});

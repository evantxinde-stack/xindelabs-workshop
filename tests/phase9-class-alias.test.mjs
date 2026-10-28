import test from "node:test";
import assert from "node:assert/strict";
import { ownsClass, billingAccess, classProductSlugs } from "../src/lib/membership-access.ts";

const cls = { id: "ece5f2bd", slug: "kelas-bangun-hermes-agent" };
const annualPaid = { email: "a@b.com", status: "paid", billing_status: "active", payment_option: "annual", paid_until: "2027-10-06", product: "build-your-own-personalized-agent" };

test("legacy BYOPA product slug still unlocks the renamed class", () => {
  assert.equal(ownsClass(annualPaid, cls, []), true);
});

test("empty owned_classes does not mask the product slug", () => {
  // Production rows carry owned_classes: [] — that must not hide `product`.
  assert.equal(ownsClass({ ...annualPaid, owned_classes: [] }, cls, []), true);
});

test("owned_classes and product are unioned, not either/or", () => {
  assert.equal(ownsClass({ ...annualPaid, product: "vip", owned_classes: ["build-your-own-personalized-agent"] }, cls, []), true);
  assert.equal(ownsClass({ ...annualPaid, product: "build-your-own-personalized-agent", owned_classes: ["vip"] }, cls, []), true);
});

test("unrelated class stays locked for that member", () => {
  assert.equal(ownsClass(annualPaid, { id: "cd9300ed", slug: "mentoring-vip-bulanan" }, []), false);
});

test("class accepts both its own slug and the legacy product slug", () => {
  const accepted = classProductSlugs(cls);
  assert.ok(accepted.includes("kelas-bangun-hermes-agent"));
  assert.ok(accepted.includes("build-your-own-personalized-agent"));
});

test("explicit owned_classes and paid orders still grant access", () => {
  const member = { ...annualPaid, product: "lain", owned_classes: ["kelas-bangun-hermes-agent"] };
  assert.equal(ownsClass(member, cls, []), true);
  const byOrder = { ...annualPaid, product: "lain" };
  assert.equal(ownsClass(byOrder, cls, [{ status: "paid", class_id: "ece5f2bd", product: "x" }]), true);
});

test("read-only grace members are denied ownership", () => {
  const grace = { ...annualPaid, billing_status: "grace" };
  assert.equal(billingAccess(grace) === "none", false);
  assert.equal(ownsClass(grace, cls, []), true);
  assert.equal(ownsClass({ ...annualPaid, billing_status: "revoked" }, cls, []), false);
});

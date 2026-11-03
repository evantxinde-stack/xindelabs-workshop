import test from "node:test";
import assert from "node:assert/strict";
import { billingAccess, ownsClass, memberProducts } from "../src/lib/membership-access.ts";
import { isRenewal } from "../src/lib/billing.ts";

test("revoked membership has no LMS access, including old lifetime records", () => {
  assert.equal(billingAccess({ payment_option: "lifetime", billing_status: "revoked" }), "none");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "grace" }), "read_only");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "active", paid_until: "2099-01-01" }), "active");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "active", paid_until: "2020-01-01" }), "none");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "active", paid_until: new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10) }), "read_only");
});

test("owned_classes array and legacy product string both grant class access", () => {
  const cls = { id: "c1", slug: "hermes-workshop" };
  assert.deepEqual(memberProducts({ owned_classes: ["hermes-workshop"] }), ["hermes-workshop"]);
  assert.equal(ownsClass({ owned_classes: ["hermes-workshop"], billing_status: "active" }, cls), true);
  assert.equal(ownsClass({ product: "other, hermes-workshop", billing_status: "active" }, cls), true);
});

test("all-access grants any class only when not revoked", () => {
  assert.equal(ownsClass({ is_all_access: true, billing_status: "active" }, { slug: "x" }), true);
  assert.equal(ownsClass({ is_all_access: true, billing_status: "revoked" }, { slug: "x" }), false);
});

test("free tutorial registrant never inherits lifetime access", () => {
  // members.payment_option defaults to 'lifetime' on free signup; tier is authoritative.
  const free = { status: "free", tier: "free", payment_option: "lifetime", billing_status: "active", owned_classes: ["tutorial-bangun-hermes"] };
  const paid = { id: "c1", slug: "kelas-bangun-hermes-agent", product_type: "course", price: 599000 };
  assert.equal(ownsClass(free, paid), false);
  assert.equal(ownsClass(free, { id: "f1", slug: "tutorial-bangun-hermes", product_type: "course", price: 0 }), true);
  assert.equal(ownsClass({ tier: "lifetime", payment_option: "lifetime", billing_status: "active" }, paid), true);
  assert.equal(isRenewal(free, "kelas-bangun-hermes-agent"), false);
});

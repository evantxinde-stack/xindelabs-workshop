import test from "node:test";
import assert from "node:assert/strict";
import { billingAccess, ownsClass, memberProducts } from "../src/lib/membership-access.ts";

test("revoked membership has no LMS access, including old lifetime records", () => {
  assert.equal(billingAccess({ payment_option: "lifetime", billing_status: "revoked" }), "none");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "grace" }), "read_only");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "active", paid_until: "2099-01-01" }), "active");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "active", paid_until: "2020-01-01" }), "none");
  assert.equal(billingAccess({ payment_option: "annual", billing_status: "active", paid_until: "2026-10-25" }), "read_only");
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

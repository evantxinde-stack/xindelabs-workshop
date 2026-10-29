import test from "node:test";
import assert from "node:assert/strict";
import { ownsClass } from "../src/lib/membership-access.ts";

test("owned_classes stores class IDs and still grants access", () => {
  const member = { billing_status: "active", owned_classes: ["class-hermes-id"], product: "" };
  const cls = { id: "class-hermes-id", slug: "kelas-bangun-hermes-agent" };
  assert.equal(ownsClass(member, cls), true);
});

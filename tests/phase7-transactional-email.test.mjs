import test from "node:test";
import assert from "node:assert/strict";
import { isRenewal } from "../src/lib/billing.ts";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("renewal is detected for owned annual products, not lifetime", () => {
  assert.equal(isRenewal({ payment_option: "annual", product: "hermes-workshop" }, "hermes-workshop"), true);
  assert.equal(isRenewal({ payment_option: "annual", product: "other,hermes-workshop" }, "hermes-workshop"), true);
  assert.equal(isRenewal({ payment_option: "lifetime", product: "hermes-workshop" }, "hermes-workshop"), false);
  assert.equal(isRenewal({ payment_option: "annual", product: "other" }, "hermes-workshop"), false);
});

test("paid fulfillment dispatches email immediately and cron remains fallback", () => {
  const orders = read("src/lib/orders.ts");
  assert.match(orders, /dispatchDueEmails\(leadId\)/);
  assert.match(orders, /await dispatchNow\(order\.lead_id\)/);
  const migration = read("supabase/migrations/20261029100000_transactional_payment_emails.sql");
  assert.match(migration, /renewal_confirmed/);
  assert.match(migration, /email_steps/);
});

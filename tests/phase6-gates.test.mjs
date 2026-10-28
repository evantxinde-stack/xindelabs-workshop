import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

test("LMS routes enforce billing + ownership", () => {
  const progress = read("src/app/api/member/progress/route.ts");
  assert.match(progress, /billingAccess\(member\) !== "active"/);
  assert.match(progress, /ownsClass\(member, cls, orders/);

  const certificate = read("src/app/api/member/certificate/route.ts");
  assert.match(certificate, /ownsClass\(member, cls, orders/);

  const workshop = read("src/app/api/member/workshop-progress/route.ts");
  assert.match(workshop, /member_access_token/);
  assert.match(workshop, /billingAccess\(member\) !== "active"/);
  assert.doesNotMatch(workshop, /b\.member_id/);

  for (const page of ["src/app/learn/course/[slug]/page.tsx", "src/app/learn/workshop/[slug]/page.tsx"]) {
    assert.match(read(page), /billingAccess\(member\)\s*!==?\s*"none"/, page);
  }

  const dashboard = read("src/app/learn/dashboard/page.tsx");
  assert.match(dashboard, /ownsClass\(member,\s*x,/);
  assert.match(dashboard, /renewalWindow\(member/);
});

test("cron syncs annual renewals and queues reminders", () => {
  const cron = read("src/app/api/cron/send-email/route.ts");
  assert.match(cron, /syncAnnualRenewals/);
  assert.match(cron, /queueRenewalReminders/);
  assert.match(cron, /revokeExpiredMemberships/);

  const membership = read("src/lib/membership.ts");
  assert.match(membership, /graceUntil\(member\.paid_until\)/);
  assert.match(membership, /renewalWindow\(m\.paid_until\)\.state === "due"/);
});

test("renewal email template vars come from the member row", () => {
  const email = read("src/lib/email.ts");
  assert.match(email, /sequenceKey === "renewal_reminder"/);
  assert.match(email, /renewal_url/);
});

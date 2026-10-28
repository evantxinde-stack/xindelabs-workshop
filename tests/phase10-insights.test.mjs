import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { maskEmail, memberInsight, certificateStatus } from "../src/lib/insights.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("maskEmail hides the local part but keeps the domain", () => {
  assert.equal(maskEmail("evant.xinde@gmail.com"), "e***@gmail.com");
  assert.equal(maskEmail("a@b.co"), "a***@b.co");
  assert.equal(maskEmail(""), "");
  assert.equal(maskEmail(null), "");
});

test("memberInsight counts owned classes, finished lessons and certificates", () => {
  const member = { email: "A@B.com", product: "build-your-own-personalized-agent", tier: "yearly", billing_status: "active", payment_option: "annual", paid_until: "2027-10-06" };
  const classes = [
    { id: "c1", slug: "kelas-bangun-hermes-agent", title: "Kelas" },
    { id: "c2", slug: "mentoring-vip-bulanan", title: "VIP" },
  ];
  const lessons = [
    { id: "l1", class_id: "c1", sort_order: 1 },
    { id: "l2", class_id: "c1", sort_order: 2 },
    { id: "l3", class_id: "c2", sort_order: 1 },
  ];
  const progress = [
    { email: "a@b.com", class_id: "c1", lesson_id: "l1", completed: true },
    { email: "a@b.com", class_id: "c1", lesson_id: "l2", completed: false },
    { email: "other@b.com", class_id: "c1", lesson_id: "l2", completed: true },
  ];
  const certificates = [{ email: "a@b.com", class_id: "c1" }];
  const orders = [{ email: "a@b.com", status: "paid", amount: 149000, product: "build-your-own-personalized-agent" }];

  const insight = memberInsight({ member, classes, lessons, progress, certificates, orders });
  assert.deepEqual(insight.ownedClasses, ["c1"]);
  assert.equal(insight.lessonsDone, 1);
  assert.equal(insight.lessonsTotal, 2);
  assert.equal(insight.progressPct, 50);
  assert.equal(insight.certificates, 1);
  assert.equal(insight.paidRevenue, 149000);
  assert.equal(insight.access, "active");
});

test("memberInsight is empty and safe for a member with no data", () => {
  const insight = memberInsight({ member: null, classes: [], lessons: [], progress: [], certificates: [], orders: [] });
  assert.deepEqual(insight.ownedClasses, []);
  assert.equal(insight.progressPct, 0);
  assert.equal(insight.access, "none");
});

test("certificateStatus validates format and existence", () => {
  assert.equal(certificateStatus("XL-ABC-123", { certificate_number: "XL-ABC-123" }), "valid");
  assert.equal(certificateStatus("XL-ABC-123", null), "not_found");
  assert.equal(certificateStatus("", null), "invalid");
  assert.equal(certificateStatus("x", null), "invalid");
});

test("public verification page looks certificates up by number and masks the email", () => {
  const page = read("src/app/certificate/[number]/page.tsx");
  assert.match(page, /certificate_number/);
  assert.match(page, /maskEmail/);
});

test("player links to the public verification page", () => {
  const player = read("src/app/learn/course/[slug]/player.tsx");
  assert.match(player, /\/certificate\//);
});

test("admin member insights page reports learning and billing columns", () => {
  const page = read("src/app/admin/members/page.tsx");
  assert.match(page, /memberInsight/);
  assert.match(page, /lesson_progress/);
  assert.match(page, /certificates/);
});

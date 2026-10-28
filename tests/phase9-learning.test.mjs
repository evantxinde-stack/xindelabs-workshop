import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { progressPct, doneLessonIds, nextLesson, certificateEligible } from "../src/lib/learning.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const lessons = [
  { id: "l1", sort_order: 1, title: "A" },
  { id: "l2", sort_order: 2, title: "B" },
  { id: "l3", sort_order: 3, title: "C" },
];

test("doneLessonIds keeps only completed rows for that class", () => {
  const rows = [
    { lesson_id: "l1", class_id: "c1", completed: true },
    { lesson_id: "l2", class_id: "c1", completed: false },
    { lesson_id: "l3", class_id: "c1", completed: true },
  ];
  assert.deepEqual(doneLessonIds(rows, "c1"), ["l1", "l3"]);
});

test("progressPct is the share of lessons completed, never over 100", () => {
  assert.equal(progressPct(lessons, []), 0);
  assert.equal(progressPct(lessons, ["l1"]), 33);
  assert.equal(progressPct(lessons, ["l1", "l2", "l3"]), 100);
  assert.equal(progressPct(lessons, ["l1", "l2", "l3", "ghost"]), 100);
  assert.equal(progressPct([], ["l1"]), 0);
});

test("nextLesson is the first incomplete lesson in order", () => {
  assert.equal(nextLesson(lessons, [])?.id, "l1");
  assert.equal(nextLesson(lessons, ["l1"])?.id, "l2");
  assert.equal(nextLesson(lessons, ["l1", "l2", "l3"]), null);
});

test("certificate is claimable only when every lesson is done", () => {
  assert.equal(certificateEligible(lessons, []), false);
  assert.equal(certificateEligible(lessons, ["l1", "l2"]), false);
  assert.equal(certificateEligible(lessons, ["l1", "l2", "l3"]), true);
  assert.equal(certificateEligible([], []), false);
});

test("course player seeds progress from the server instead of resetting to zero", () => {
  const player = read("src/app/learn/course/[slug]/player.tsx");
  assert.match(player, /initialDone/);
  assert.match(player, /useState<string\[\]>\(initialDone/);
  assert.match(player, /progressPct/);
});

test("course player wires the certificate claim button and shows a claimed certificate", () => {
  const player = read("src/app/learn/course/[slug]/player.tsx");
  assert.match(player, /onClick=\{claimCertificate\}/);
  assert.match(player, /existingCertificate|certificateNumber/);
});

test("course server page passes saved progress and certificate to the player", () => {
  const page = read("src/app/learn/course/[slug]/page.tsx");
  assert.match(page, /lesson_progress/);
  assert.match(page, /certificates/);
  assert.match(page, /initialDone=/);
});

test("member dashboard renders real progress per owned class", () => {
  const dash = read("src/app/learn/dashboard/page.tsx");
  assert.match(dash, /lesson_progress/);
  assert.match(dash, /progressPct\(/);
  assert.doesNotMatch(dash, /Progress 0%/);
});

test("funnel analytics covers LMS completion and revenue", () => {
  const leaks = read("src/app/admin/leaks/page.tsx");
  assert.match(leaks, /lesson_progress/);
  assert.match(leaks, /certificates/);
  assert.match(leaks, /revenue|pendapatan/i);
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildTutorialLadder, tutorialEvent } from "../src/lib/tutorial-ladder.ts";

test("tutorial ladder uses published product slugs for VIP and course offers", () => {
  const ladder = buildTutorialLadder([
    { slug: "hidden", title: "Hidden", product_type: "workshop", is_published: false },
    { slug: "mentoring-vip-bulanan", title: "VIP", product_type: "course", is_published: true },
    { slug: "kelas-bangun-hermes-agent", title: "Kelas", product_type: "course", is_published: true },
    { slug: "tutorial-bangun-hermes", title: "Tutorial", product_type: "course", is_published: true },
  ]);
  assert.equal(ladder.vip.slug, "mentoring-vip-bulanan");
  assert.equal(ladder.course.slug, "kelas-bangun-hermes-agent");
  assert.equal(ladder.free.learn, "/learn/course/tutorial-bangun-hermes");
});

test("tutorial events stay scoped to the tutorial source", () => {
  assert.deepEqual(tutorialEvent("lead-1", "vip_offer_viewed", 1), {
    lead_id: "lead-1", event_type: "vip_offer_viewed", step: 1, funnel: "tutorial_hermes",
  });
});

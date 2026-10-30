export type LadderProduct = {
  slug: string;
  title: string;
  product_type?: string | null;
  is_published?: boolean | null;
};

const VIP_SLUG = "mentoring-vip-bulanan";
const COURSE_SLUG = "kelas-bangun-hermes-agent";
const FREE_SLUG = "tutorial-bangun-hermes";

export function buildTutorialLadder(rows: LadderProduct[]) {
  const published = rows.filter((r) => r.is_published !== false && r.slug);
  const vip = published.find((r) => r.slug === VIP_SLUG) ?? published.find((r) => r.product_type === "vip");
  const course = published.find((r) => r.slug === COURSE_SLUG);
  const free = published.find((r) => r.slug === FREE_SLUG);
  return { vip, course, free: { href: "/join-group", learn: free ? `/learn/course/${free.slug}` : "/learn" } };
}

export function tutorialEvent(leadId: string, eventType: string, step: number) {
  return { lead_id: leadId, event_type: eventType, step, funnel: "tutorial_hermes" };
}

export type LadderProduct = {
  slug: string;
  title: string;
  product_type?: string | null;
  is_published?: boolean | null;
};

const VIP_SLUG = "mentoring-vip-bulanan";

export function buildTutorialLadder(rows: LadderProduct[]) {
  const published = rows.filter((r) => r.is_published !== false && r.slug);
  const vip =
    published.find((r) => r.slug === VIP_SLUG) ??
    published.find((r) => r.product_type === "membership" || r.product_type === "vip");
  const course =
    published.find((r) => r.product_type === "workshop") ??
    published.find((r) => r.product_type === "course");
  return { vip, course, free: { href: "/join-group", learn: "/learn" } };
}

export function tutorialEvent(leadId: string, eventType: string, step: number) {
  return { lead_id: leadId, event_type: eventType, step, funnel: "tutorial_hermes" };
}

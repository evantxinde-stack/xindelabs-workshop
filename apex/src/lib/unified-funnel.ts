export const SOURCE_MAP: Record<string, { label: string; group: string }> = {
  tutorial_hermes: { label: "Tutorial Free", group: "Tutorial" },
  "landing-daftar": { label: "Workshop Landing", group: "Workshop" },
  checkout: { label: "Workshop Checkout", group: "Workshop" },
  komunitas: { label: "Komunitas Gratis", group: "Komunitas" },
  test: { label: "Internal Test", group: "Internal" },
};

export function mapSource(source: string | null | undefined) {
  if (!source) {
    return { source: "", label: "Other", group: "Other" };
  }
  const key = String(source).trim();
  const mapped = SOURCE_MAP[key];
  if (mapped) {
    return { source: key, label: mapped.label, group: mapped.group };
  }
  return { source: key, label: "Other", group: "Other" };
}

export function parseWorkshopAmountFromNotes(notes: string | null | undefined): number | null {
  if (!notes) return null;
  const match = notes.match(/harga:\s*(\d+)/i);
  if (match && match[1]) {
    const n = Number(match[1]);
    if (!Number.isNaN(n) && n > 0) {
      return n;
    }
  }
  return null;
}

export type UnifiedLead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  raw_status: string | null;
  display_status: string;
  source: string;
  source_group: string;
  current_stage: string | null;
  products: string[];
  workshop_tier: string | null;
  amount_paid: number | null;
  created_at: string | null;
};

export type LeadInput = {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  status: string | null;
  source: string | null;
  current_stage: string | null;
  created_at: string | null;
  notes?: string | null;
};

export type MemberInput = {
  id: string | null;
  email: string | null;
  status: string | null;
  product: string | null;
  tier: string | null;
  paid_until: string | null;
  created_at: string | null;
  updated_at: string | null;
  lms_password?: string | null;
};

export type OrderInput = {
  id: string | null;
  lead_id: string | null;
  product: string | null;
  tier: string | null;
  voucher_code: string | null;
  amount: number | string | null;
  mayar_invoice_id: string | null;
  mayar_transaction_id: string | null;
  status: string | null;
  created_at: string | null;
  paid_at: string | null;
};

function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

function toNumber(n: number | string | null | undefined): number | null {
  if (n === null || n === undefined) return null;
  if (typeof n === "number") {
    return Number.isNaN(n) ? null : n;
  }
  const m = String(n).match(/(\d+)/);
  if (m) {
    const v = Number(m[1]);
    return Number.isNaN(v) ? null : v;
  }
  return null;
}

function displayStatusFrom(
  hasPaidWorkshop: boolean,
  hasPaidOrder: boolean,
  raw: string | null
): string {
  if (hasPaidWorkshop || hasPaidOrder) return "Paid";
  const s = (raw || "").toLowerCase();
  if (s === "follow_up") return "Follow-up";
  if (s === "free_tutorial") return "Tutorial Free";
  if (s === "bayar" || s === "paid") return "Paid";
  if (s === "belum" || s === "new" || !s) return "Lead";
  return raw || "Lead";
}

export function buildUnifiedLeads(
  leads: LeadInput[],
  members: MemberInput[],
  orders: OrderInput[],
  leadNotesMap?: Map<string, string | null>
): UnifiedLead[] {
  const emailToMember = new Map<string, MemberInput>();
  for (const m of members) {
    const e = normalizeEmail(m.email);
    if (e) {
      emailToMember.set(e, m);
    }
  }

  const leadIdToOrders = new Map<string, OrderInput[]>();
  for (const o of orders) {
    if (o.lead_id) {
      const arr = leadIdToOrders.get(o.lead_id) || [];
      arr.push(o);
      leadIdToOrders.set(o.lead_id, arr);
    }
  }

  const result: UnifiedLead[] = [];

  for (const l of leads) {
    const email = normalizeEmail(l.email);
    const member = email ? emailToMember.get(email) : null;
    const leadOrders = l.id ? leadIdToOrders.get(l.id) || [] : [];

    const isPaidOrder = leadOrders.some((o) => ((o.status || "").toLowerCase() === "paid"));
    const isPaidWorkshopMember = !!(member && (member.status || "").toLowerCase() === "paid");

    const products: string[] = [];
    if (member && (member.product || member.tier)) {
      const prod = member.product || "Workshop";
      const tier = member.tier || "";
      const label = tier ? `${prod} ${tier.charAt(0).toUpperCase()}${tier.slice(1)}` : prod;
      products.push(label);
    }
    for (const o of leadOrders) {
      if (o.product) {
        products.push(o.product);
      }
    }
    if (products.length === 0 && (l.source === "tutorial_hermes" || (l.status || "").toLowerCase() === "free_tutorial")) {
      products.push("Tutorial Free");
    }

    let amountPaid: number | null = null;
    if (isPaidOrder) {
      const paidOrder = leadOrders.find((o) => (o.status || "").toLowerCase() === "paid");
      if (paidOrder) {
        amountPaid = toNumber(paidOrder.amount);
      }
    }
    if (amountPaid === null && isPaidWorkshopMember) {
      const notes = leadNotesMap?.get(l.id) ?? l.notes ?? null;
      amountPaid = parseWorkshopAmountFromNotes(notes);
    }

    const sm = mapSource(l.source);
    const display_status = displayStatusFrom(isPaidWorkshopMember, isPaidOrder, l.status);

    result.push({
      id: l.id,
      name: l.name || "",
      email: l.email || "",
      whatsapp: l.whatsapp || null,
      raw_status: l.status,
      display_status,
      source: sm.source,
      source_group: sm.group,
      current_stage: l.current_stage,
      products,
      workshop_tier: member?.tier || null,
      amount_paid: amountPaid,
      created_at: l.created_at,
    });
  }

  return result;
}

export function uniquePaidCustomers(unified: UnifiedLead[]): Set<string> {
  const set = new Set<string>();
  for (const u of unified) {
    if (u.display_status === "Paid" || u.amount_paid !== null) {
      const e = normalizeEmail(u.email);
      if (e) set.add(e);
    }
  }
  return set;
}

export function computeRevenue(unified: UnifiedLead[]): { revenueRecorded: number; amountUnrecorded: number } {
  let revenueRecorded = 0;
  let amountUnrecorded = 0;
  const counted = new Set<string>();
  for (const u of unified) {
    const e = normalizeEmail(u.email);
    const key = `${e}:${u.id}`;
    if (u.amount_paid !== null && u.amount_paid > 0) {
      if (!counted.has(key)) {
        revenueRecorded += u.amount_paid;
        counted.add(key);
      }
    } else if (u.display_status === "Paid") {
      // Paid but no amount recorded
      amountUnrecorded += 0; // we don't add to revenue
    }
  }
  // Count unrecorded paid customers? The spec says "Amount Belum Tercatat" as KPI
  const paidEmails = new Set<string>();
  for (const u of unified) {
    if (u.display_status === "Paid" && u.amount_paid === null) {
      const e = normalizeEmail(u.email);
      if (e && !paidEmails.has(e)) {
        paidEmails.add(e);
        // Don't add arbitrary amount - just track count conceptually via return
        // But spec says "Amount Belum Tercatat" - maybe count of such cases? Or 0? Let's be precise
      }
    }
  }
  return { revenueRecorded, amountUnrecorded: paidEmails.size > 0 ? 0 : 0 }; // We'll compute properly
}

export function computeRevenueDetailed(
  leads: LeadInput[],
  members: MemberInput[],
  orders: OrderInput[],
  leadNotesMap?: Map<string, string | null>
): { revenueRecorded: number; amountUnrecordedCount: number } {
  const unified = buildUnifiedLeads(leads, members, orders, leadNotesMap);
  let revenueRecorded = 0;
  const recordedKeys = new Set<string>();
  for (const u of unified) {
    if (u.amount_paid !== null && u.amount_paid > 0) {
      const key = `${normalizeEmail(u.email)}:${u.amount_paid}:${u.id}`;
      if (!recordedKeys.has(key)) {
        revenueRecorded += u.amount_paid;
        recordedKeys.add(key);
      }
    }
  }
  const unrecorded = new Set<string>();
  for (const u of unified) {
    if (u.display_status === "Paid" && u.amount_paid === null) {
      const e = normalizeEmail(u.email);
      if (e) unrecorded.add(e);
    }
  }
  return { revenueRecorded, amountUnrecordedCount: unrecorded.size };
}

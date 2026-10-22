import { supabase } from "@/lib/supabase/client";

export const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function leadIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const lead = new URLSearchParams(window.location.search).get("lead");
  return lead && lead.length > 0 ? lead : null;
}

export async function trackEvent(
  leadId: string | null,
  eventType: string,
  meta: Record<string, unknown> = {}
) {
  if (demoMode || !leadId) return;
  try {
    await supabase.from("pipeline_events").insert({
      lead_id: leadId,
      event_type: eventType,
      meta,
    });
  } catch {}
}


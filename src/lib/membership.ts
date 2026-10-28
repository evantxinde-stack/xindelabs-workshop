import { admin } from "@/lib/supabase/server";

export async function revokeExpiredMemberships() {
  const now = new Date().toISOString();
  const { data: expired, error } = await admin
    .from("members")
    .select("id")
    .eq("payment_option", "annual")
    .eq("billing_status", "grace")
    .lt("grace_until", now)
    .limit(100);

  if (error) throw error;
  let revoked = 0;
  for (const member of expired ?? []) {
    const { error: updateError } = await admin
      .from("members")
      .update({ billing_status: "revoked", revoked_at: now })
      .eq("id", member.id)
      .eq("payment_option", "annual")
      .eq("billing_status", "grace");
    if (updateError) throw updateError;
    revoked++;
  }
  return { checked: expired?.length ?? 0, revoked };
}

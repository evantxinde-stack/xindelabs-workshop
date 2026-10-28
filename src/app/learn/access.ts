import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { admin, } from "@/lib/supabase/server";
import { ADMIN_COOKIE, sessionToken } from "@/lib/admin-session";

export async function learnMember() {
  const token = (await cookies()).get("member_access_token")?.value;
  if (!token) return { user: null, member: null, admin: false };
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key");
  const { data: { user } } = await auth.auth.getUser(token);
  if (!user?.email) return { user: null, member: null, admin: false };
  const { data: member } = await admin.from("members").select("*").eq("email", user.email).maybeSingle();
  return { user, member, admin: false };
}
export async function isAdminMember() { const password = process.env.ADMIN_PASSWORD || ""; const token = (await cookies()).get(ADMIN_COOKIE)?.value; return Boolean(password && token && token === await sessionToken(password)); }
export function billingAccess(member: any) { if (!member) return "none" as const; if (member.is_all_access || member.is_vip || member.payment_option === "lifetime") return "active" as const; if (member.billing_status === "active") return "active" as const; if (member.billing_status === "grace" || member.billing_status === "read_only") return "read_only" as const; return "none" as const; }
export function ownsClass(member: any, cls: any, orders: any[] = []) { if (!member) return false; if (billingAccess(member) === "none") return false; if (member.is_all_access || member.is_vip) return true; const names = String(member.product || "").toLowerCase().split(",").map(x=>x.trim()); return names.includes(String(cls.slug || "").toLowerCase()) || orders.some(o => o.status === "paid" && (o.class_id === cls.id || String(o.product || "").toLowerCase() === String(cls.slug || "").toLowerCase())); }
export function youtubeUrl(id: string) { return id.startsWith("http") ? id : `https://www.youtube.com/embed/${encodeURIComponent(id)}`; }

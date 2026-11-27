import { admin } from "@/lib/supabase/server";
import { parseJsonValue } from "@/lib/content";
import { DEFAULT_SITE_CONFIG, mergeSiteConfig, type SiteConfig } from "@/lib/site-config";

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const { data, error } = await admin
      .from("settings")
      .select("key,value")
      .in("key", ["site_config", "wa_admin_number"]);

    if (error || !data) return DEFAULT_SITE_CONFIG;

    const rawConfig = data.find((r) => r.key === "site_config")?.value;
    const waAdmin = data.find((r) => r.key === "wa_admin_number")?.value;
    const parsed = rawConfig ? parseJsonValue(rawConfig) : null;

    return mergeSiteConfig(parsed, typeof waAdmin === "string" ? waAdmin : null);
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

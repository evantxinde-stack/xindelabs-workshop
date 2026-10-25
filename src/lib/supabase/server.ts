import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "build-placeholder-key";

export const admin = createClient(url, key, { auth: { persistSession: false } });
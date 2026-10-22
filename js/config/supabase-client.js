// Supabase client configuration for unified ecosystem
// Uses existing config from js/config.js as fallback
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const getConfig = () => {
  if (typeof window !== 'undefined' && window.XINDE) {
    return {
      url: window.XINDE.SUPABASE_URL,
      key: window.XINDE.SUPABASE_ANON_KEY
    };
  }
  return { url: '', key: '' };
};

const config = getConfig();
export const supabase = config.url && config.key 
  ? createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  : null;

export const isSupabaseConfigured = () => !!supabase;

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = "Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.";
  console.error(errorMsg);
  console.error("Current values:", {
    VITE_SUPABASE_URL: supabaseUrl || "undefined",
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? "[REDACTED]" : "undefined"
  });
  throw new Error(errorMsg);
}

if (import.meta.env.DEV) {
  console.log("Supabase client initializing with URL:", supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      fetch,
      headers: {
        'apikey': supabaseAnonKey,
      }
    },
  }
);

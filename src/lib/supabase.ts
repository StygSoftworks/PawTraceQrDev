// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "pkce",          // more secure for SPAs
      persistSession: true,        // keep users logged in
      autoRefreshToken: true,      // refresh in the background
      //storage: localStorage,       // default, explicit for clarity
      detectSessionInUrl: true,    // detect auth params in URL on init
      // Add these for production:
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: { fetch },             // use native fetch
  }
);

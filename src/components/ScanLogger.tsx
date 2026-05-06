import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";

export function ScanLogger({ shortId }: { shortId: string | undefined }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!shortId) return;

    const run = async () => {
      try {
        await supabase.rpc("log_scan", {
          p_short_id: shortId,
          p_referrer: document.referrer || null,
          p_ua: navigator.userAgent,
          p_city: null,
          p_region: null,
          p_country: null,
          p_lat: null,
          p_lng: null,
          p_scanned_by: user?.id ?? null,
        });
      } catch (e) {
        console.warn("log_scan failed:", e);
      }
    };
    run();
  }, [shortId, user?.id]);

  return null;
}

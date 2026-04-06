import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";

export function ScanLogger({
  shortId,
  askGeo = true,
}: {
  shortId: string | undefined;
  askGeo?: boolean;
}) {
  const { user } = useAuth();

  useEffect(() => {
    if (!shortId) return;

    let cancelled = false;

    const log = async () => {
      try {
        let coords: { lat?: number; lng?: number } = {};

        if (askGeo && "geolocation" in navigator) {
          try {
            const p = await new Promise<GeolocationPosition>((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
            );
            coords = { lat: p.coords.latitude, lng: p.coords.longitude };
          } catch {
            /* denied or timeout */
          }
        }

        if (cancelled) return;

        await supabase.rpc("log_scan", {
          p_short_id: shortId,
          p_referrer: document.referrer || null,
          p_ua: navigator.userAgent,
          p_city: null,
          p_region: null,
          p_country: null,
          p_lat: coords.lat ?? null,
          p_lng: coords.lng ?? null,
          p_scanned_by: user?.id ?? null,
        });
      } catch (e) {
        console.warn("log_scan failed:", e);
      }
    };

    log();
    return () => {
      cancelled = true;
    };
  }, [shortId, askGeo, user?.id]);

  return null;
}

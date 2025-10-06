import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Logs a scan to the DB via RPC when mounted.
 * - pass shortId from the URL (e.g. /p/:shortId)
 * - if `askGeo` is true, it will try to include coords (with user permission)
 */
export function ScanLogger({
  shortId,
  askGeo = true,
}: {
  shortId: string | undefined;
  askGeo?: boolean;
}) {
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
            /* denied or timeout — ignore */
          }
        }

        if (cancelled) return;

        await supabase.rpc("log_scan", {
          p_short_id: shortId,
          p_referrer: document.referrer || null,
          p_ua: navigator.userAgent,
          p_city: null,    // optionally fill if you add a geo-IP service
          p_region: null,
          p_country: null,
          p_lat: coords.lat ?? null,
          p_lng: coords.lng ?? null,
        });
      } catch (e) {
        // don’t bother the user if this fails
        console.warn("log_scan failed:", e);
      }
    };

    log();
    return () => {
      cancelled = true;
    };
  }, [shortId, askGeo]);

  return null;
}

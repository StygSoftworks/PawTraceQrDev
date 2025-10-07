// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ---------- ENV ----------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "sandbox").toLowerCase(); // 'sandbox' | 'live'
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID"); // from PayPal dashboard
const PP_API_BASE = PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
// ---------- HELPERS ----------
async function getPayPalAccessToken() {
  const basic = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PP_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
  const json = await res.json();
  return json.access_token;
}
async function verifyWebhookSignature(headers, event) {
  // Required PayPal headers
  const transmission_id = headers.get("paypal-transmission-id") ?? "";
  const transmission_time = headers.get("paypal-transmission-time") ?? "";
  const cert_url = headers.get("paypal-cert-url") ?? "";
  const auth_algo = headers.get("paypal-auth-algo") ?? "";
  const transmission_sig = headers.get("paypal-transmission-sig") ?? "";
  if (!transmission_id || !transmission_time || !auth_algo || !transmission_sig) {
    console.error("Missing PayPal verification headers");
    return false;
  }
  const accessToken = await getPayPalAccessToken();
  const body = {
    transmission_id,
    transmission_time,
    cert_url,
    auth_algo,
    transmission_sig,
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: event
  };
  const res = await fetch(`${PP_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    console.error("Verify call failed:", res.status, await res.text());
    return false;
  }
  const json = await res.json();
  // Response shape: { "verification_status": "SUCCESS" | "FAILURE" }
  return json.verification_status === "SUCCESS";
}
// Optional: idempotency guard (avoid reprocessing the same event)
// Requires you add a nullable column to subscriptions: last_event_id text
async function alreadyProcessed(svc, user_id, event_id) {
  if (!event_id) return false;
  const { data, error } = await svc.from("subscriptions").select("last_event_id").eq("user_id", user_id).single();
  if (error) return false;
  return data?.last_event_id === event_id;
}
serve(async (req)=>{
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  try {
    const event = await req.json().catch(()=>null);
    if (!event) return new Response("Bad Request", {
      status: 400
    });
    // 1) Verify PayPal signature
    const ok = await verifyWebhookSignature(req.headers, event);
    if (!ok) return new Response("Invalid signature", {
      status: 400
    });
    // 2) Process event
    const eventType = event?.event_type;
    const eventId = event?.id;
    const resource = event?.resource ?? {};
    const subId = resource?.id; // PayPal subscription id
    if (!eventType || !subId) {
      console.warn("Missing eventType or subscription id", event);
      return new Response("ok"); // ignore quietly
    }
    // Find our subscriber by PayPal sub id (can be base or addon column)
    const { data: rows, error: findErr } = await svc.from("subscriptions").select("user_id, base_paypal_sub_id, addon_paypal_sub_id, last_event_id").or(`base_paypal_sub_id.eq.${subId},addon_paypal_sub_id.eq.${subId}`).limit(1);
    if (findErr) {
      console.error(findErr);
      return new Response("error", {
        status: 500
      });
    }
    const row = rows?.[0];
    if (!row) {
      // You might want to log unknown sub IDs
      console.warn("Webhook for unknown subscription id:", subId);
      return new Response("ok");
    }
    // Idempotency check
    if (await alreadyProcessed(svc, row.user_id, eventId)) {
      return new Response("ok"); // already handled
    }
    // Map event types → status transitions
    // https://developer.paypal.com/docs/api-basics/notifications/webhooks/event-names/
    let statusPatch = null;
    switch(eventType){
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
        statusPatch = {
          status: "active"
        };
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
        statusPatch = {
          status: "canceled"
        };
        break;
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        statusPatch = {
          status: "suspended"
        };
        break;
      case "BILLING.SUBSCRIPTION.EXPIRED":
        statusPatch = {
          status: "canceled"
        };
        break;
      case "BILLING.SUBSCRIPTION.UPDATED":
        // Optional: adjust addon_quantity if you sell add-ons as a quantity/plan change.
        // Example: if you store quantity elsewhere, read it and compute here.
        statusPatch = {
          status: "active"
        };
        break;
      // Payment events if you need them (not required for basic state):
      // "PAYMENT.SALE.COMPLETED", "PAYMENT.SALE.DENIED" etc.
      default:
        // Unknown/irrelevant event; still record it
        statusPatch = null;
        break;
    }
    // 3) Persist state + audit fields
    const patch = {
      ...statusPatch ?? {},
      last_event: eventType,
      last_event_id: eventId ?? null,
      updated_at: new Date().toISOString()
    };
    const { error: updErr } = await svc.from("subscriptions").update(patch).eq("user_id", row.user_id);
    if (updErr) {
      console.error(updErr);
      return new Response("error", {
        status: 500
      });
    }
    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("error", {
      status: 500
    });
  }
});

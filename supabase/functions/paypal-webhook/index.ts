// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ---------- ENV ----------
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "sandbox").toLowerCase();
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID");
const PP_API_BASE = PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
// Plan IDs to determine type
const PLAN_BASE_MONTH = Deno.env.get("VITE_PP_PLAN_BASE_MONTH");
const PLAN_BASE_YEAR = Deno.env.get("VITE_PP_PLAN_BASE_YEAR");
const PLAN_ADDON_MONTH = Deno.env.get("VITE_PP_PLAN_ADDON_MONTH");
const PLAN_ADDON_YEAR = Deno.env.get("VITE_PP_PLAN_ADDON_YEAR");
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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} - ${text}`);
  }
  const json = await res.json();
  return json.access_token;
}
async function verifyWebhookSignature(headers, event) {
  const transmission_id = headers.get("paypal-transmission-id") ?? "";
  const transmission_time = headers.get("paypal-transmission-time") ?? "";
  const cert_url = headers.get("paypal-cert-url") ?? "";
  const auth_algo = headers.get("paypal-auth-algo") ?? "";
  const transmission_sig = headers.get("paypal-transmission-sig") ?? "";
  if (!transmission_id || !transmission_time || !auth_algo || !transmission_sig) {
    console.error("Missing PayPal verification headers");
    return false;
  }
  if (!PAYPAL_WEBHOOK_ID) {
    console.error("PAYPAL_WEBHOOK_ID not set");
    return false;
  }
  try {
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
      const text = await res.text();
      console.error("Verify call failed:", res.status, text);
      return false;
    }
    const json = await res.json();
    return json.verification_status === "SUCCESS";
  } catch (err) {
    console.error("Verification error:", err);
    return false;
  }
}
function isBasePlan(planId) {
  return planId === PLAN_BASE_MONTH || planId === PLAN_BASE_YEAR;
}
function isAddonPlan(planId) {
  return planId === PLAN_ADDON_MONTH || planId === PLAN_ADDON_YEAR;
}
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  try {
    const event = await req.json().catch(()=>null);
    if (!event) {
      console.error("Bad Request: Could not parse JSON");
      return new Response("Bad Request", {
        status: 400
      });
    }
    console.log("Received webhook:", event.event_type);
    // Verify PayPal signature
    const ok = await verifyWebhookSignature(req.headers, event);
    if (!ok) {
      console.error("Invalid signature");
      return new Response("Invalid signature", {
        status: 401
      });
    }
    const eventType = event?.event_type;
    const resource = event?.resource ?? {};
    const subId = resource?.id;
    const customId = resource?.custom_id; // user_id
    const planId = resource?.plan_id;
    const nextBillingTime = resource?.billing_info?.next_billing_time || null;
    if (!eventType) {
      return new Response("ok");
    }
    console.log("Event details:", {
      eventType,
      subId,
      customId,
      planId
    });
    // Handle subscription events
    switch(eventType){
      case "BILLING.SUBSCRIPTION.CREATED":
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        {
          if (!subId || !customId || !planId) {
            console.warn("Missing required fields", {
              subId,
              customId,
              planId
            });
            return new Response("ok");
          }
          const isBase = isBasePlan(planId);
          const isAddon = isAddonPlan(planId);
          if (!isBase && !isAddon) {
            console.warn("Unknown plan ID:", planId);
            return new Response("ok");
          }
          // Check if subscription row exists for this user
          const { data: existing, error: fetchErr } = await svc.from("subscriptions").select("*").eq("user_id", customId).single();
          if (fetchErr && fetchErr.code !== 'PGRST116') {
            console.error("Fetch error:", fetchErr);
            return new Response("error", {
              status: 500
            });
          }
          if (isBase) {
            // Create or update base subscription
            const payload = existing ? {
              paypal_sub_id_base: subId,
              paypal_plan_id_base: planId,
              status: "active",
              next_billing_time: nextBillingTime,
              renewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } : {
              user_id: customId,
              paypal_sub_id_base: subId,
              paypal_plan_id_base: planId,
              status: "active",
              next_billing_time: nextBillingTime,
              addon_quantity: 0,
              renewed_at: new Date().toISOString()
            };
            const { error } = existing ? await svc.from("subscriptions").update(payload).eq("user_id", customId) : await svc.from("subscriptions").insert(payload);
            if (error) {
              console.error("Base subscription error:", error);
              return new Response("error", {
                status: 500
              });
            }
            console.log(`Base subscription ${subId} activated for ${customId}`);
          } else if (isAddon) {
            // Create or update addon subscription
            const currentQuantity = existing?.addon_quantity ?? 0;
            const newQuantity = currentQuantity + 1;
            const payload = existing ? {
              paypal_sub_id_addon: subId,
              paypal_plan_id_addon: planId,
              addon_quantity: newQuantity,
              status: "active",
              next_billing_time: nextBillingTime,
              updated_at: new Date().toISOString()
            } : {
              user_id: customId,
              paypal_sub_id_addon: subId,
              paypal_plan_id_addon: planId,
              addon_quantity: 1,
              status: "active",
              next_billing_time: nextBillingTime
            };
            const { error } = existing ? await svc.from("subscriptions").update(payload).eq("user_id", customId) : await svc.from("subscriptions").insert(payload);
            if (error) {
              console.error("Addon subscription error:", error);
              return new Response("error", {
                status: 500
              });
            }
            console.log(`Addon subscription ${subId} activated for ${customId}, quantity: ${newQuantity}`);
          }
          break;
        }
      case "BILLING.SUBSCRIPTION.UPDATED":
        {
          if (!subId) break;
          // Find which column has this subscription ID
          const { data: subs, error: findErr } = await svc.from("subscriptions").select("*").or(`paypal_sub_id_base.eq.${subId},paypal_sub_id_addon.eq.${subId}`).limit(1);
          if (findErr || !subs || subs.length === 0) {
            console.warn("Subscription not found for update:", subId);
            break;
          }
          const { error } = await svc.from("subscriptions").update({
            next_billing_time: nextBillingTime,
            updated_at: new Date().toISOString()
          }).eq("user_id", subs[0].user_id);
          if (error) {
            console.error("Update error:", error);
          }
          break;
        }
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        {
          if (!subId) break;
          const newStatus = eventType.includes("CANCELLED") ? "canceled" : eventType.includes("SUSPENDED") ? "suspended" : "expired";
          // Find which subscription this is
          const { data: subs, error: findErr } = await svc.from("subscriptions").select("*").or(`paypal_sub_id_base.eq.${subId},paypal_sub_id_addon.eq.${subId}`).limit(1);
          if (findErr || !subs || subs.length === 0) {
            console.warn("Subscription not found:", subId);
            break;
          }
          const sub = subs[0];
          const isBase = sub.paypal_sub_id_base === subId;
          if (isBase) {
            // Base canceled - update status and clear base fields
            const { error } = await svc.from("subscriptions").update({
              paypal_sub_id_base: null,
              paypal_plan_id_base: null,
              status: sub.paypal_sub_id_addon ? "active" : newStatus,
              updated_at: new Date().toISOString()
            }).eq("user_id", sub.user_id);
            if (error) {
              console.error("Cancel base error:", error);
            }
          } else {
            // Addon canceled - decrease quantity
            const newQuantity = Math.max(0, (sub.addon_quantity ?? 1) - 1);
            const { error } = await svc.from("subscriptions").update({
              paypal_sub_id_addon: newQuantity > 0 ? sub.paypal_sub_id_addon : null,
              paypal_plan_id_addon: newQuantity > 0 ? sub.paypal_plan_id_addon : null,
              addon_quantity: newQuantity,
              status: sub.paypal_sub_id_base || newQuantity > 0 ? "active" : newStatus,
              updated_at: new Date().toISOString()
            }).eq("user_id", sub.user_id);
            if (error) {
              console.error("Cancel addon error:", error);
            }
          }
          break;
        }
      default:
        console.log("Unhandled event:", eventType);
        break;
    }
    return new Response("ok", {
      status: 200
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("error", {
      status: 500
    });
  }
});

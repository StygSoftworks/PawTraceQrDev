import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_ENV = (Deno.env.get("PAYPAL_ENV") ?? "sandbox").toLowerCase();

const PP_API_BASE =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const basic = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PP_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} - ${text}`);
  }

  const json = await res.json();
  return json.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(
      `${PP_API_BASE}/v2/checkout/orders/${order_id}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureRes.ok) {
      const text = await captureRes.text();
      console.error("PayPal capture failed:", text);
      return new Response(
        JSON.stringify({ error: "Failed to capture payment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const captureData = await captureRes.json();

    if (captureData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({
          error: "Payment not completed",
          status: captureData.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const purchaseUnit = captureData.purchase_units?.[0];
    const itemQuantity = parseInt(
      purchaseUnit?.items?.[0]?.quantity ?? "1",
      10
    );
    const quantity = isNaN(itemQuantity) ? 1 : itemQuantity;

    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const reservedTags = [];

    for (let i = 0; i < quantity; i++) {
      const { data: qrData, error: qrError } = await svc.rpc(
        "reserve_qr_code",
        { p_tag_type: "dog" }
      );

      if (qrError || !qrData || qrData.length === 0) {
        console.error("Failed to reserve QR code:", qrError);
        continue;
      }

      const reserved = qrData[0];

      const { error: updateError } = await svc
        .from("qr_codes")
        .update({
          purchased_by: user.id,
          purchased_at: new Date().toISOString(),
          purchase_price: 15.0,
          paypal_order_id: order_id,
        })
        .eq("id", reserved.qr_id);

      if (updateError) {
        console.error("Failed to update QR code ownership:", updateError);
        continue;
      }

      reservedTags.push({
        qr_id: reserved.qr_id,
        short_id: reserved.qr_short_id,
        qr_url: reserved.qr_qr_url,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        tags_purchased: reservedTags.length,
        tags: reservedTags,
        paypal_order_id: order_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("capture-tag-order error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

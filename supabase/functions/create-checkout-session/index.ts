import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://pawtraceqr.com";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

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
    const { type } = body as { type: "annual" | "lifetime" | "replacement" };

    if (!type || !["annual", "lifetime", "replacement"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid type. Must be annual, lifetime, or replacement." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await svc
      .from("profiles")
      .select("stripe_customer_id, email, display_name")
      .eq("id", user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name: profile?.display_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      await svc
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", user.id);
    }

    const priceId = getPriceId(type);
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Price not configured for this type." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSubscription = type === "annual";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/billing/cancel`,
      metadata: {
        user_id: user.id,
        purchase_type: type,
      },
    };

    if (isSubscription) {
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
          purchase_type: type,
        },
      };
    } else {
      sessionParams.payment_intent_data = {
        metadata: {
          user_id: user.id,
          purchase_type: type,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const stripeCode = (e as { code?: string })?.code;
    return new Response(
      JSON.stringify({
        error: msg,
        stripe_code: stripeCode ?? null,
        hint: "Check that STRIPE_SECRET_KEY and STRIPE_PRICE_* secrets are valid and from the same Stripe mode (test vs live).",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getPriceId(type: string): string | null {
  switch (type) {
    case "annual":
      return Deno.env.get("STRIPE_PRICE_ANNUAL") ?? null;
    case "lifetime":
      return Deno.env.get("STRIPE_PRICE_LIFETIME") ?? null;
    case "replacement":
      return Deno.env.get("STRIPE_PRICE_REPLACEMENT") ?? null;
    default:
      return null;
  }
}

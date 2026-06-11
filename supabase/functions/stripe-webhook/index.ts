import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });
const GRACE_PERIOD_DAYS = 30;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(svc, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(svc, event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(svc, event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(svc, event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(svc, event.data.object as Stripe.Invoice);
        break;
      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});

async function handleCheckoutCompleted(
  svc: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const purchaseType = session.metadata?.purchase_type;

  if (!userId || !purchaseType) {
    console.error("Missing metadata on checkout session", session.id);
    return;
  }

  const { data: qrData, error: qrError } = await svc.rpc("reserve_qr_code", {
    p_tag_type: "dog",
  });

  if (qrError || !qrData || qrData.length === 0) {
    console.error("Failed to reserve QR code:", qrError);
    return;
  }

  const reserved = qrData[0];

  await svc
    .from("qr_codes")
    .update({
      purchased_by: userId,
      purchased_at: new Date().toISOString(),
      purchase_price: purchaseType === "annual" ? 8 : purchaseType === "lifetime" ? 40 : 5,
    })
    .eq("id", reserved.qr_id);

  const entitlementType = purchaseType === "annual" ? "annual" : "lifetime";
  const now = new Date();
  const periodEnd = purchaseType === "annual"
    ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    : null;

  const entitlement: Record<string, unknown> = {
    user_id: userId,
    qr_code_id: reserved.qr_id,
    entitlement_type: entitlementType,
    stripe_customer_id: session.customer as string,
    stripe_checkout_session_id: session.id,
    status: "active",
    current_period_start: now.toISOString(),
  };

  if (session.subscription) {
    entitlement.stripe_subscription_id = session.subscription as string;
  }
  if (periodEnd) {
    entitlement.current_period_end = periodEnd.toISOString();
  }

  const { error: entError } = await svc.from("tag_entitlements").insert(entitlement);
  if (entError) {
    console.error("Failed to create entitlement:", entError);
    return;
  }

  await svc
    .from("profiles")
    .update({ stripe_customer_id: session.customer as string })
    .eq("id", userId)
    .is("stripe_customer_id", null);
}

async function handleSubscriptionUpdated(
  svc: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const subId = subscription.id;
  const status = mapStripeStatus(subscription.status);
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString();

  await svc
    .from("tag_entitlements")
    .update({
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subId);
}

async function handleSubscriptionDeleted(
  svc: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  await svc
    .from("tag_entitlements")
    .update({
      status: "expired",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handlePaymentFailed(
  svc: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const subId = invoice.subscription as string | null;
  if (!subId) return;

  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

  await svc
    .from("tag_entitlements")
    .update({
      status: "past_due",
      grace_period_end: graceEnd.toISOString(),
    })
    .eq("stripe_subscription_id", subId);
}

async function handlePaymentSucceeded(
  svc: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const subId = invoice.subscription as string | null;
  if (!subId) return;

  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  const updates: Record<string, unknown> = {
    status: "active",
    grace_period_end: null,
  };
  if (periodEnd) {
    updates.current_period_end = new Date(periodEnd * 1000).toISOString();
  }

  await svc
    .from("tag_entitlements")
    .update(updates)
    .eq("stripe_subscription_id", subId);
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
}

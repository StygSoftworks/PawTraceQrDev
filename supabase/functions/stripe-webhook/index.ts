import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: { name: 'PawTrace Integration', version: '1.0.0' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));
    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.info(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const userId = session.metadata?.user_id;
  const purchaseType = session.metadata?.purchase_type as 'annual' | 'lifetime' | 'replacement' | undefined;

  if (!userId || !purchaseType) {
    console.error('Missing metadata on checkout session:', session.id);
    return;
  }

  // Sync to stripe_customers table
  await supabase.from('stripe_customers').upsert(
    { user_id: userId, customer_id: customerId },
    { onConflict: 'user_id' },
  );

  if (session.mode === 'subscription') {
    await syncCustomerSubscription(customerId);
    await provisionEntitlement(userId, customerId, purchaseType, session.id, session.subscription as string);
  } else if (session.mode === 'payment' && session.payment_status === 'paid') {
    await supabase.from('stripe_orders').insert({
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent as string,
      customer_id: customerId,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: 'completed',
    });
    await provisionEntitlement(userId, customerId, purchaseType, session.id, null);
  }

  console.info(`Checkout completed for user ${userId}, type: ${purchaseType}`);
}

async function provisionEntitlement(
  userId: string,
  stripeCustomerId: string,
  purchaseType: 'annual' | 'lifetime' | 'replacement',
  checkoutSessionId: string,
  subscriptionId: string | null,
) {
  const { data: qrData, error: qrError } = await supabase.rpc('reserve_qr_code');

  if (qrError || !qrData || qrData.length === 0) {
    console.error('Failed to reserve QR code:', qrError);
    return;
  }

  const qrCodeId = qrData[0].qr_id;

  let currentPeriodEnd: string | null = null;
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
    } catch (e) {
      console.error('Failed to retrieve subscription for period end:', e);
    }
  }

  const { error: entError } = await supabase.from('tag_entitlements').insert({
    user_id: userId,
    qr_code_id: qrCodeId,
    entitlement_type: purchaseType === 'replacement' ? 'annual' : purchaseType,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscriptionId,
    stripe_checkout_session_id: checkoutSessionId,
    status: 'active',
    current_period_end: currentPeriodEnd,
  });

  if (entError) {
    console.error('Failed to create entitlement:', entError);
    await supabase.rpc('release_qr_code', { p_qr_id: qrCodeId });
    return;
  }

  console.info(`Entitlement created for user ${userId}, qr_code: ${qrCodeId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  await syncCustomerSubscription(customerId);

  const entitlementStatus = mapStripeStatusToEntitlement(subscription.status);

  const { error } = await supabase
    .from('tag_entitlements')
    .update({
      status: entitlementStatus,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update entitlement for subscription:', subscription.id, error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('tag_entitlements')
    .update({
      status: 'expired',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to expire entitlement for subscription:', subscription.id, error);
  }

  const customerId = subscription.customer as string;
  await syncCustomerSubscription(customerId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) return;

  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  const { error } = await supabase
    .from('tag_entitlements')
    .update({
      status: 'past_due',
      grace_period_end: gracePeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Failed to update entitlement for failed payment:', subscriptionId, error);
  }
}

function mapStripeStatusToEntitlement(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'expired';
  }
}

async function syncCustomerSubscription(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      await supabase.from('stripe_subscriptions').upsert(
        { customer_id: customerId, status: 'not_started' },
        { onConflict: 'customer_id' },
      );
      return;
    }

    const subscription = subscriptions.data[0];
    await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method &&
        typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      { onConflict: 'customer_id' },
    );
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
  }
}

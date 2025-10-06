// src/components/SubscribeButton.tsx
import { useEffect, useRef } from "react";


type Props = { planId: string };

export default function SubscribeButton({ planId }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.paypal || !ref.current) return;

    window.paypal.Buttons({
      style: { label: "subscribe", height: 45 },
      createSubscription: (_data: any, actions: any) =>
        actions.subscription.create({ plan_id: planId }),
      onApprove: async (data: any) => {
        // Send subscription id + plan id to your backend/Supabase
        // so you can entitle the user immediately (and also rely on webhooks).
        const { subscriptionID } = data; // aka billing agreement id
        await fetch("/api/paypal/subscription/attach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: planId, subscription_id: subscriptionID }),
        });
        // Show success UI, refresh entitlements, etc.
      },
    }).render(ref.current);
  }, [planId]);

  return <div ref={ref} />;
}

// usage example
// <SubscribeButton planId={PAYPAL_PLANS.BASE_MONTHLY} />
// <SubscribeButton planId={PAYPAL_PLANS.BASE_YEARLY} />
// <SubscribeButton planId={PAYPAL_PLANS.ADDON_MONTHLY} />
// <SubscribeButton planId={PAYPAL_PLANS.ADDON_YEARLY} />

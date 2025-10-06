// src/routes/Pricing.tsx
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {PAYPAL_PLANS, PLAN_TO_PRODUCT} from "@/config/billing"

declare global { interface Window { paypal?: any } }

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;



function renderButton(container: HTMLElement, planId: string, productType: "base"|"addon") {
  window.paypal.Buttons({
    style: { label: "subscribe" },
    createSubscription: (_: any, actions: any) => actions.subscription.create({ plan_id: planId }),
    onApprove: async ({ subscriptionID }: { subscriptionID: string }) => {
      await supabase.functions.invoke("record-paypal-sub", {
        body: { plan_id: planId, subscription_id: subscriptionID, product_type: productType },
      });
      window.location.href = "/billing/success";
    },
    onCancel: () => (window.location.href = "/billing/cancel"),
    onError: (err: any) => { console.error(err); alert("Payment error"); },
  }).render(container);
}

export default function Pricing() {
  const baseMonthlyRef = useRef<HTMLDivElement>(null);
  const baseYearlyRef  = useRef<HTMLDivElement>(null);
  const addonMonthlyRef = useRef<HTMLDivElement>(null);
  const addonYearlyRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.paypal) return;
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    s.async = true;
    s.onload = () => {
      baseMonthlyRef.current && renderButton(baseMonthlyRef.current, PAYPAL_PLANS.BASE_MONTHLY, PLAN_TO_PRODUCT[PAYPAL_PLANS.BASE_MONTHLY]);
      baseYearlyRef.current  && renderButton(baseYearlyRef.current,  PAYPAL_PLANS.BASE_YEARLY,  PLAN_TO_PRODUCT[PAYPAL_PLANS.BASE_YEARLY]);
      addonMonthlyRef.current && renderButton(addonMonthlyRef.current, PAYPAL_PLANS.ADDON_MONTHLY, PLAN_TO_PRODUCT[PAYPAL_PLANS.ADDON_MONTHLY]);
      addonYearlyRef.current  && renderButton(addonYearlyRef.current,  PAYPAL_PLANS.ADDON_YEARLY,  PLAN_TO_PRODUCT[PAYPAL_PLANS.ADDON_YEARLY]);
    };
    document.body.appendChild(s);
  }, []);

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Choose your plan</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">PawTrace Base</h2>
          <p className="text-muted-foreground mb-4">Up to 3 pets</p>
          <div ref={baseMonthlyRef} className="mb-4" />
          <div ref={baseYearlyRef} />
        </div>
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Extra Pets Add-on</h2>
          <p className="text-muted-foreground mb-4">Adds +1 pet per add-on</p>
          <div ref={addonMonthlyRef} className="mb-4" />
          <div ref={addonYearlyRef} />
        </div>
      </div>
    </div>
  );
}

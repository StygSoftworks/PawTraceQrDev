// src/routes/Pricing.tsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PAYPAL_PLANS } from "@/config/billing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

declare global { interface Window { paypal?: any } }

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

function renderButton(container: HTMLElement, planId: string) {
  window.paypal.Buttons({
    style: { label: "subscribe", height: 50 },
    createSubscription: (_: any, actions: any) => actions.subscription.create({ plan_id: planId }),
    onApprove: async ({ subscriptionID }: { subscriptionID: string }) => {
      await supabase.functions.invoke("record-paypal-sub", {
        body: { plan_id: planId, subscription_id: subscriptionID },
      });
      window.location.href = "/billing/success";
    },
    onCancel: () => (window.location.href = "/billing/cancel"),
    onError: (err: any) => { console.error(err); alert("Payment error"); },
  }).render(container);
}

export default function Pricing() {
  const monthlyRef = useRef<HTMLDivElement>(null);
  const yearlyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.paypal) return;
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    s.async = true;
    s.onload = () => {
      monthlyRef.current && renderButton(monthlyRef.current, PAYPAL_PLANS.PER_PET_MONTHLY);
      yearlyRef.current && renderButton(yearlyRef.current, PAYPAL_PLANS.PER_PET_YEARLY);
    };
    document.body.appendChild(s);
  }, []);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple Per-Pet Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each subscription activates one pet profile with a QR code. Buy multiple subscriptions for multiple pets.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all">
            <CardHeader className="pb-8">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Monthly</CardTitle>
                <Badge variant="outline">Popular</Badge>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$4.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">per pet</p>
              </div>
              <CardDescription className="mt-4">
                Perfect for getting started with flexible monthly billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unique QR code for your pet</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Public pet profile page</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Missing pet alerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Location sharing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Customizable themes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
              <div ref={monthlyRef} />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-primary/50 hover:border-primary transition-all">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              Best Value
            </div>
            <CardHeader className="pb-8">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Yearly</CardTitle>
                <Badge className="bg-green-600">Save 17%</Badge>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$49.99</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">per pet ($4.16/month)</p>
              </div>
              <CardDescription className="mt-4">
                Save money with annual billing and lock in your rate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unique QR code for your pet</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Public pet profile page</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Missing pet alerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Location sharing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Customizable themes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Priority support</span>
                </div>
              </div>
              <div ref={yearlyRef} />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Purchase a subscription for each pet you want to activate</li>
              <li>Add your pet's information in your <Link to="/dashboard" className="text-primary hover:underline">Dashboard</Link></li>
              <li>Assign your purchased subscription to activate the pet profile</li>
              <li>Download and attach the QR code to your pet's collar</li>
              <li>Manage subscriptions anytime from your <Link to="/billing" className="text-primary hover:underline">Billing page</Link></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

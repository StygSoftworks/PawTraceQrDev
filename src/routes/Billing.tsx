// src/routes/Billing.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SubRow = {
  id: string;
  user_id: string;
  paypal_sub_id_base: string | null;
  paypal_plan_id_base: string | null;
  paypal_sub_id_addon: string | null;
  paypal_plan_id_addon: string | null;
  addon_quantity: number;
  status: string;
  next_billing_time: string | null;
  created_at: string;
  updated_at: string;
};

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get plan IDs and environment from env
  const baseMonthlyPlanId = import.meta.env.VITE_PP_PLAN_BASE_MONTH as string | undefined;
  const baseYearlyPlanId = import.meta.env.VITE_PP_PLAN_BASE_YEAR as string | undefined;
  const addonMonthlyPlanId = import.meta.env.VITE_PP_PLAN_ADDON_MONTH as string | undefined;
  const addonYearlyPlanId = import.meta.env.VITE_PP_PLAN_ADDON_YEAR as string | undefined;
  
  const paypalEnv = import.meta.env.VITE_PAYPAL_ENV as string | undefined;
  const paypalDomain = paypalEnv === 'production' 
    ? 'https://www.paypal.com'
    : 'https://www.sandbox.paypal.com';

  // Construct PayPal subscription URLs with custom_id (user_id)
  const baseMonthlyUrl = baseMonthlyPlanId && userId
    ? `${paypalDomain}/webapps/billing/plans/subscribe?plan_id=${baseMonthlyPlanId}&custom_id=${userId}`
    : undefined;
  const baseYearlyUrl = baseYearlyPlanId && userId
    ? `${paypalDomain}/webapps/billing/plans/subscribe?plan_id=${baseYearlyPlanId}&custom_id=${userId}`
    : undefined;
  const addonMonthlyUrl = addonMonthlyPlanId && userId
    ? `${paypalDomain}/webapps/billing/plans/subscribe?plan_id=${addonMonthlyPlanId}&custom_id=${userId}`
    : undefined;
  const addonYearlyUrl = addonYearlyPlanId && userId
    ? `${paypalDomain}/webapps/billing/plans/subscribe?plan_id=${addonYearlyPlanId}&custom_id=${userId}`
    : undefined;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      // Get current user
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);

      if (!uid) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Fetch user's subscription row (one row per user)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (!mounted) return;

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription row exists yet - this is fine
          setSubscription(null);
        } else {
          console.error("load subscription error:", error);
          setSubscription(null);
        }
      } else {
        setSubscription(data as SubRow);
      }
      setLoading(false);
    }

    load();

    // Optional: refresh when tab gets focus
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const { hasBase, addonCount, petLimit, isActive } = useMemo(() => {
    const hasBase = !!subscription?.paypal_sub_id_base;
    const addonCount = subscription?.addon_quantity ?? 0;
    const isActive = subscription?.status === "active";
    const petLimit = (hasBase && isActive ? 3 : 0) + addonCount;
    return { hasBase, addonCount, petLimit, isActive };
  }, [subscription]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Billing & Subscription</h1>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Billing & Subscription</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to view or manage your subscription.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const nextBilling = subscription?.next_billing_time
    ? new Date(subscription.next_billing_time).toLocaleDateString()
    : null;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Billing & Subscription</h1>

      {/* Summary / current entitlement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your plan summary</CardTitle>
          <CardDescription>
            {hasBase ? "Base plan active" : "No base plan"} • {addonCount} add-on(s) • Pet limit:{" "}
            <span className="font-medium">{petLimit}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!subscription ? (
            <div className="text-sm text-muted-foreground">No subscription on file.</div>
          ) : (
            <div className="divide-y">
              {hasBase && (
                <div className="flex justify-between items-center py-3">
                  <div>
                    <div className="font-medium">PawTrace Base Plan</div>
                    <div className="text-xs text-muted-foreground">
                      Status: <Badge variant="outline" className="uppercase">{subscription.status}</Badge>{" "}
                      {nextBilling && <>• Renews: {nextBilling}</>}
                    </div>
                    {subscription.paypal_plan_id_base && (
                      <div className="text-xs text-muted-foreground">
                        Plan ID: <span className="font-mono">{subscription.paypal_plan_id_base}</span>
                      </div>
                    )}
                  </div>
                  {isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              
              {subscription.paypal_sub_id_addon && addonCount > 0 && (
                <div className="flex justify-between items-center py-3">
                  <div>
                    <div className="font-medium">Extra Pets Add-ons ({addonCount})</div>
                    <div className="text-xs text-muted-foreground">
                      Status: <Badge variant="outline" className="uppercase">{subscription.status}</Badge>{" "}
                      {nextBilling && <>• Renews: {nextBilling}</>}
                    </div>
                    {subscription.paypal_plan_id_addon && (
                      <div className="text-xs text-muted-foreground">
                        Plan ID: <span className="font-mono">{subscription.paypal_plan_id_addon}</span>
                      </div>
                    )}
                  </div>
                  {isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PawTrace Base</CardTitle>
            <CardDescription>Up to 3 pets included</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">$3 / mo</div>
            <Button 
              asChild 
              className="w-full" 
              disabled={!baseMonthlyUrl || hasBase}
            >
              <a href={baseMonthlyUrl} target="_blank" rel="noreferrer">
                {hasBase ? "Already Subscribed" : "Subscribe Monthly (PayPal)"}
              </a>
            </Button>

            <div className="text-sm text-muted-foreground">or</div>

            <div className="text-2xl font-bold">$30 / yr</div>
            <Button 
              asChild 
              variant="outline" 
              className="w-full" 
              disabled={!baseYearlyUrl || hasBase}
            >
              <a href={baseYearlyUrl} target="_blank" rel="noreferrer">
                {hasBase ? "Already Subscribed" : "Subscribe Yearly (PayPal)"}
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extra Pets Add-on</CardTitle>
            <CardDescription>Each add-on adds 1 pet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">$1.50 / mo</div>
            <Button 
              asChild 
              className="w-full" 
              disabled={!addonMonthlyUrl}
            >
              <a href={addonMonthlyUrl} target="_blank" rel="noreferrer">
                Add Monthly (PayPal)
              </a>
            </Button>

            <div className="text-sm text-muted-foreground">or</div>

            <div className="text-2xl font-bold">$18 / yr</div>
            <Button 
              asChild 
              variant="outline" 
              className="w-full" 
              disabled={!addonYearlyUrl}
            >
              <a href={addonYearlyUrl} target="_blank" rel="noreferrer">
                Add Yearly (PayPal)
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Note about PayPal portal and managing subscriptions */}
      <p className="mt-6 text-xs text-muted-foreground">
        Payments are handled by PayPal. After subscribing, it can take a moment for your subscription to appear here. 
        To cancel or manage your subscription, log in to PayPal and go to Settings → Payments → Manage automatic payments.
      </p>
    </div>
  );
}
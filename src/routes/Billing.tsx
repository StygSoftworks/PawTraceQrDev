// src/routes/Billing.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";

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

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Get plan IDs and environment from env
  const baseMonthlyPlanId = import.meta.env.VITE_PP_PLAN_BASE_MONTH as string | undefined;
  const baseYearlyPlanId = import.meta.env.VITE_PP_PLAN_BASE_YEAR as string | undefined;
  const addonMonthlyPlanId = import.meta.env.VITE_PP_PLAN_ADDON_MONTH as string | undefined;
  const addonYearlyPlanId = import.meta.env.VITE_PP_PLAN_ADDON_YEAR as string | undefined;
  
  const paypalEnv = (import.meta.env.VITE_PAYPAL_ENV as string | undefined) || 'production';
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

  // Refs for PayPal button containers
  const baseMonthlyRef = useRef<HTMLDivElement>(null);
  const baseYearlyRef = useRef<HTMLDivElement>(null);
  const addonMonthlyRef = useRef<HTMLDivElement>(null);
  const addonYearlyRef = useRef<HTMLDivElement>(null);

  // Validate configuration on mount
  useEffect(() => {
    const errors: string[] = [];
    
    if (!paypalClientId) {
      errors.push("PayPal Client ID not configured");
    }
    if (!baseMonthlyPlanId) {
      errors.push("Base Monthly plan ID not configured");
    }
    if (!baseYearlyPlanId) {
      errors.push("Base Yearly plan ID not configured");
    }
    if (!addonMonthlyPlanId) {
      errors.push("Addon Monthly plan ID not configured");
    }
    if (!addonYearlyPlanId) {
      errors.push("Addon Yearly plan ID not configured");
    }

    if (errors.length > 0) {
      setConfigError(errors.join(". "));
      console.error("PayPal configuration errors:", errors);
    }

    // Log environment (helps with debugging)
    console.log("PayPal environment:", paypalEnv);
    console.log("Plan IDs configured:", {
      baseMonthly: !!baseMonthlyPlanId,
      baseYearly: !!baseYearlyPlanId,
      addonMonthly: !!addonMonthlyPlanId,
      addonYearly: !!addonYearlyPlanId,
    });
  }, [paypalClientId, baseMonthlyPlanId, baseYearlyPlanId, addonMonthlyPlanId, addonYearlyPlanId, paypalEnv]);

  // Load PayPal SDK
  useEffect(() => {
    if (!paypalClientId) {
      console.error("VITE_PAYPAL_CLIENT_ID not set");
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement("script");
    // Use sandbox or production based on environment
    const sdkUrl = paypalEnv === 'sandbox' 
      ? `https://www.sandbox.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription`
      : `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription`;
    
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      console.log('✅ PayPal SDK loaded successfully for:', paypalEnv);
      setPaypalLoaded(true);
    };
    script.onerror = () => {
      console.error("❌ Failed to load PayPal SDK");
      setConfigError("Failed to load PayPal SDK. Please refresh the page.");
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount to avoid reload issues
    };
  }, [paypalClientId, paypalEnv]);

  useEffect(() => {
    let mounted = true;

    // Check if user just returned from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscribed') === 'true') {
      setJustSubscribed(true);
      window.history.replaceState({}, '', '/billing');
      setTimeout(() => setJustSubscribed(false), 10000);
    }

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

      // Fetch user's subscription row
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("load subscription error:", error);
        setSubscription(null);
      } else {
        setSubscription(data as SubRow | null);
      }
      setLoading(false);
    }

    load();

    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);

  // Calculate subscription status
  const { hasBase, addonCount, petLimit, isActive } = useMemo(() => {
    const hasBase = !!subscription?.paypal_sub_id_base;
    const addonCount = subscription?.addon_quantity ?? 0;
    const isActive = subscription?.status === "active";
    const petLimit = (hasBase && isActive ? 3 : 0) + addonCount;
    return { hasBase, addonCount, petLimit, isActive };
  }, [subscription]);

  // Initialize PayPal buttons
  useEffect(() => {
    // Don't run if conditions not met
    if (loading || !userId || !paypalLoaded || !window.paypal || configError) {
      console.log('Not ready for buttons:', { loading, userId, paypalLoaded, configError });
      return;
    }

    console.log('🔵 Creating PayPal buttons...');

    const timer = setTimeout(() => {
      const createButton = (
        container: HTMLDivElement | null, 
        planId: string | undefined, 
        label: string
      ) => {
        if (!container) {
          console.error(`❌ Container missing for ${label}`);
          return;
        }
        if (!planId) {
          console.error(`❌ Plan ID missing for ${label}`);
          container.innerHTML = '<p class="text-xs text-red-500">Plan not configured</p>';
          return;
        }

        // Clear existing button
        container.innerHTML = '';

        try {
          window.paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'gold',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: (data: any, actions: any) => {
              console.log(`Creating subscription for ${label} with plan:`, planId.slice(0, 10) + '...');
              return actions.subscription.create({
                plan_id: planId,
                custom_id: userId,
              });
            },
            onApprove: async (data: any) => {
              console.log('✅ Subscription approved:', data.subscriptionID);
              
              setJustSubscribed(true);
              setTimeout(() => setJustSubscribed(false), 10000);

              // Reload subscription data
              setTimeout(async () => {
                const { data: subData } = await supabase
                  .from("subscriptions")
                  .select("*")
                  .eq("user_id", userId)
                  .maybeSingle();
                if (subData) setSubscription(subData as SubRow);
              }, 2000);
            },
            onCancel: () => {
              console.log('ℹ️ Subscription cancelled by user');
            },
            onError: (err: any) => {
              console.error('❌ PayPal subscription error:', err);
              
              // Show user-friendly error
              const errorMsg = err?.message || 'An error occurred with PayPal';
              if (errorMsg.includes('RESOURCE_NOT_FOUND') || errorMsg.includes('INVALID_RESOURCE_ID')) {
                alert('The subscription plan is not available. Please contact support.');
              } else {
                alert('An error occurred. Please try again or contact support.');
              }
            }
          }).render(container);
          console.log(`✅ Button rendered for ${label}`);
        } catch (error) {
          console.error(`❌ Failed to create button for ${label}:`, error);
          container.innerHTML = '<p class="text-xs text-red-500">Button error</p>';
        }
      };

      // Create buttons based on subscription status
      if (!hasBase) {
        createButton(baseMonthlyRef.current, baseMonthlyPlanId, 'Base Monthly');
        createButton(baseYearlyRef.current, baseYearlyPlanId, 'Base Yearly');
      }
      
      createButton(addonMonthlyRef.current, addonMonthlyPlanId, 'Addon Monthly');
      createButton(addonYearlyRef.current, addonYearlyPlanId, 'Addon Yearly');
    }, 200);

    return () => clearTimeout(timer);
  }, [loading, paypalLoaded, userId, hasBase, configError, baseMonthlyPlanId, baseYearlyPlanId, addonMonthlyPlanId, addonYearlyPlanId]);

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

      {/* Configuration error */}
      {configError && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Configuration Error</p>
                <p className="text-sm text-red-700 mt-1">{configError}</p>
                {paypalEnv === 'sandbox' && (
                  <p className="text-xs text-red-600 mt-2">Running in SANDBOX mode</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success message */}
      {justSubscribed && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Subscription successful!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your subscription is being processed. It may take a few moments to appear below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
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

      {/* Purchase cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PawTrace Base</CardTitle>
            <CardDescription>Up to 3 pets included</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">$3 / mo</div>
            {hasBase ? (
              <Button className="w-full" disabled>
                Already Subscribed
              </Button>
            ) : (
              <div ref={baseMonthlyRef} className="min-h-[45px]">
                {!paypalLoaded && <Loader2 className="animate-spin h-5 w-5 mx-auto" />}
              </div>
            )}

            <div className="text-sm text-muted-foreground">or</div>

            <div className="text-2xl font-bold">$30 / yr</div>
            {hasBase ? (
              <Button className="w-full" variant="outline" disabled>
                Already Subscribed
              </Button>
            ) : (
              <div ref={baseYearlyRef} className="min-h-[45px]">
                {!paypalLoaded && <Loader2 className="animate-spin h-5 w-5 mx-auto" />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extra Pets Add-on</CardTitle>
            <CardDescription>Each add-on adds 1 pet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">$1.50 / mo</div>
            <div ref={addonMonthlyRef} className="min-h-[45px]">
              {!paypalLoaded && <Loader2 className="animate-spin h-5 w-5 mx-auto" />}
            </div>

            <div className="text-sm text-muted-foreground">or</div>

            <div className="text-2xl font-bold">$18 / yr</div>
            <div ref={addonYearlyRef} className="min-h-[45px]">
              {!paypalLoaded && <Loader2 className="animate-spin h-5 w-5 mx-auto" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">About subscriptions</p>
              <p>
                Payments are handled by PayPal. After subscribing, it can take up to 60 seconds for your subscription to appear here. 
                To cancel or manage your subscription, log in to PayPal and go to Settings → Payments → Manage automatic payments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
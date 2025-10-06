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
  type: "base" | "addon";
  status: "active" | "canceled" | "suspended" | "expired" | "pending" | string;
  provider: "paypal";
  provider_subscription_id: string | null;
  plan_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const baseMonthlyUrl = import.meta.env.VITE_PAYPAL_BASE_MONTHLY_URL as string | undefined;
  const baseYearlyUrl  = import.meta.env.VITE_PAYPAL_BASE_YEARLY_URL as string | undefined;
  const addonMonthlyUrl = import.meta.env.VITE_PAYPAL_ADDON_MONTHLY_URL as string | undefined;
  const addonYearlyUrl  = import.meta.env.VITE_PAYPAL_ADDON_YEARLY_URL as string | undefined;

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
        setSubs([]);
        setLoading(false);
        return;
      }

      // Fetch only this user's subs (RLS-safe)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("load subscriptions error:", error);
        setSubs([]);
      } else {
        setSubs((data ?? []) as SubRow[]);
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

  const { baseActive, addonActiveCount, petLimit } = useMemo(() => {
    const active = subs.filter(s => s.status === "active");
    const baseActive = active.some(s => s.type === "base");
    const addonActiveCount = active.filter(s => s.type === "addon").length;
    const petLimit = (baseActive ? 3 : 0) + addonActiveCount;
    return { baseActive, addonActiveCount, petLimit };
  }, [subs]);

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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Billing & Subscription</h1>

      {/* Summary / current entitlement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your plan summary</CardTitle>
          <CardDescription>
            {baseActive ? "Base plan active" : "No base plan"} • {addonActiveCount} add-on(s) • Pet limit:{" "}
            <span className="font-medium">{petLimit}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No subscriptions on file.</div>
          ) : (
            <div className="divide-y">
              {subs.map((s) => {
                const next = s.current_period_end
                  ? new Date(s.current_period_end).toLocaleDateString()
                  : null;
                return (
                  <div key={s.id} className="flex justify-between items-center py-3">
                    <div>
                      <div className="font-medium">
                        {s.type === "addon" ? "Extra Pets Add-on" : "PawTrace Base"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Status: <Badge variant="outline" className="uppercase">{s.status}</Badge>{" "}
                        {next && <>• Renews: {next}</>}
                      </div>
                      {s.plan_id && (
                        <div className="text-xs text-muted-foreground">
                          Plan ID: <span className="font-mono">{s.plan_id}</span>
                        </div>
                      )}
                    </div>
                    {s.status === "active" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
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
            <Button asChild className="w-full" disabled={!baseMonthlyUrl}>
              <a href={baseMonthlyUrl} target="_blank" rel="noreferrer">
                Subscribe Monthly (PayPal)
              </a>
            </Button>

            <div className="text-sm text-muted-foreground">or</div>

            <div className="text-2xl font-bold">$30 / yr</div>
            <Button asChild variant="outline" className="w-full" disabled={!baseYearlyUrl}>
              <a href={baseYearlyUrl} target="_blank" rel="noreferrer">
                Subscribe Yearly (PayPal)
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
            <Button asChild className="w-full" disabled={!addonMonthlyUrl}>
              <a href={addonMonthlyUrl} target="_blank" rel="noreferrer">
                Add Monthly (PayPal)
              </a>
            </Button>

            <div className="text-sm text-muted-foreground">or</div>

            <div className="text-2xl font-bold">$18 / yr</div>
            <Button asChild variant="outline" className="w-full" disabled={!addonYearlyUrl}>
              <a href={addonYearlyUrl} target="_blank" rel="noreferrer">
                Add Yearly (PayPal)
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* (Optional) Note about PayPal portal */}
      <p className="mt-6 text-xs text-muted-foreground">
        Payments are handled by PayPal. After subscribing, it can take a moment for your subscription to appear here.
      </p>
    </div>
  );
}

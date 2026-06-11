import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { PRICE_ANNUAL, PRICE_LIFETIME, PRICE_REPLACEMENT } from "@/config/billing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Check, QrCode, Tag, Shield, RefreshCw, CircleAlert as AlertCircle, Crown, Zap,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Pricing() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(type: "annual" | "lifetime" | "replacement") {
    if (!session) return;
    setLoading(type);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Failed to start checkout");
        setLoading(null);
        return;
      }

      if (window.top !== window.self) {
        window.open(data.url, "_blank");
      } else {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  const annualFeatures = [
    "Unique QR code tag for your pet",
    "Public pet profile page",
    "Missing pet alerts & location sharing",
    "Customizable profile themes",
    "Manage via Stripe Customer Portal",
    "Cancel anytime",
  ];

  const lifetimeFeatures = [
    "Everything in Annual plan",
    "One-time payment, no renewals",
    "Lifetime access guaranteed",
    "Priority support",
    "Never worry about expiration",
    "Best value for long-term protection",
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Keep Your Pet Safe</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you. Every tag gives your pet a digital ID
            that helps reunite them with you if they ever get lost.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="max-w-lg mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Annual Plan */}
          <Card className="relative overflow-hidden border-2 border-primary/50 hover:border-primary transition-all shadow-lg">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              Most Popular
            </div>
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Annual Tag</CardTitle>
                  <CardDescription>Renews yearly</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">${PRICE_ANNUAL}</span>
                  <span className="text-muted-foreground text-lg">/year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">per tag &middot; auto-renews annually</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {annualFeatures.map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {user ? (
                <Button
                  onClick={() => handleCheckout("annual")}
                  disabled={loading !== null}
                  size="lg"
                  className="w-full gap-2 h-12 text-base"
                >
                  {loading === "annual" ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Zap className="h-5 w-5" /> Subscribe for ${PRICE_ANNUAL}/year</>
                  )}
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full gap-2 h-12 text-base">
                  <Link to="/signin">
                    <Tag className="h-5 w-5" />
                    Sign in to Purchase
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lifetime Plan */}
          <Card className="relative overflow-hidden border-2 hover:border-amber-500/50 transition-all shadow-lg">
            <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              Best Value
            </div>
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                  <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Lifetime Tag</CardTitle>
                  <CardDescription>One-time purchase</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">${PRICE_LIFETIME}</span>
                  <span className="text-muted-foreground text-lg">once</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">per tag &middot; no recurring charges ever</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {lifetimeFeatures.map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {user ? (
                <Button
                  onClick={() => handleCheckout("lifetime")}
                  disabled={loading !== null}
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 h-12 text-base border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  {loading === "lifetime" ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Crown className="h-5 w-5 text-amber-600" /> Buy Lifetime for ${PRICE_LIFETIME}</>
                  )}
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline" className="w-full gap-2 h-12 text-base">
                  <Link to="/signin">
                    <Crown className="h-5 w-5" />
                    Sign in to Purchase
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Physical Tag + Replacement */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-2 hover:border-primary/30 transition-all">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Physical Tag</CardTitle>
                  <CardDescription>Already have one?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">Free</span>
                <Badge variant="secondary">1 year included</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Scan your physical tag to activate it. Your first year is included free, then ${PRICE_ANNUAL}/year to keep it active.
              </p>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  How to activate:
                </p>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Scan the QR code on your tag</li>
                  <li>Create an account or sign in</li>
                  <li>Add your pet's details -- done!</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Replacement Tag</CardTitle>
                  <CardDescription>Lost your tag?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${PRICE_REPLACEMENT}</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get a new digital tag at a reduced price. Your pet's data is safe -- just assign the new tag to your existing pet profile.
              </p>
              {user ? (
                <Button
                  onClick={() => handleCheckout("replacement")}
                  disabled={loading !== null}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {loading === "replacement" ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Shield className="h-4 w-4" /> Get Replacement Tag</>
                  )}
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/signin">Sign in to Purchase</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Purchase a digital tag or activate a physical one</li>
              <li>Set up your pet's profile with photo, name, and contact info</li>
              <li>The QR tag links to your pet's public page</li>
              <li>Anyone who finds your pet can scan the tag and contact you</li>
              <li>Manage all your tags from your <Link to="/billing" className="text-primary hover:underline">Tags page</Link></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { TAG_PRICE } from "@/config/billing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Check, QrCode, Tag,
  ShoppingCart, RefreshCw, CircleAlert as AlertCircle,
} from "lucide-react";

declare global { interface Window { paypal?: any } }

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Pricing() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paypalRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  useEffect(() => {
    if (!user || !session || paypalRendered.current) return;
    if (window.paypal) {
      renderPayPalButton();
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    s.async = true;
    s.onload = () => renderPayPalButton();
    document.body.appendChild(s);
  }, [user, session]);

  function renderPayPalButton() {
    if (!paypalRef.current || !window.paypal || paypalRendered.current) return;
    paypalRendered.current = true;

    window.paypal.Buttons({
      style: { label: "pay", height: 50, shape: "rect", color: "gold" },
      createOrder: async () => {
        setError(null);
        setPurchasing(true);
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-tag-order`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            Apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ quantity: 1 }),
        });
        const data = await res.json();
        if (!res.ok || !data.order_id) {
          setPurchasing(false);
          throw new Error(data.error || "Failed to create order");
        }
        return data.order_id;
      },
      onApprove: async (data: { orderID: string }) => {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/capture-tag-order`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            Apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ order_id: data.orderID }),
        });
        const result = await res.json();
        setPurchasing(false);
        if (result.success) {
          navigate("/billing/success");
        } else {
          setError(result.error || "Payment capture failed");
        }
      },
      onCancel: () => {
        setPurchasing(false);
        navigate("/billing/cancel");
      },
      onError: (err: any) => {
        console.error(err);
        setPurchasing(false);
        setError("Payment error. Please try again.");
      },
    }).render(paypalRef.current);
  }

  const features = [
    "Unique QR code tag for your pet",
    "Public pet profile page",
    "Missing pet alerts",
    "Location sharing from finders",
    "Customizable profile themes",
    "Lifetime access -- no recurring fees",
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">One Tag. One Price. Lifetime Protection.</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Buy a PawTrace QR tag for ${TAG_PRICE} and keep your pet safe forever. No subscriptions, no hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="relative overflow-hidden border-2 border-primary/50 hover:border-primary transition-all shadow-lg">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              Digital Tag
            </div>
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">PawTrace QR Tag</CardTitle>
                  <CardDescription>One-time purchase</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">${TAG_PRICE}</span>
                  <span className="text-muted-foreground text-lg">one-time</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">per tag -- no recurring charges</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {user ? (
                <div className="space-y-3">
                  <div ref={paypalRef} />
                  {purchasing && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              ) : (
                <Button asChild size="lg" className="w-full gap-2 h-12 text-base">
                  <Link to="/signin">
                    <ShoppingCart className="h-5 w-5" />
                    Sign in to Purchase
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-all">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Physical Tag</CardTitle>
                  <CardDescription>Already have one?</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">Free</span>
                  <span className="text-muted-foreground text-lg">to activate</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Scan your tag to set it up instantly</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  How to activate your physical tag:
                </p>
                <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-decimal list-inside">
                  <li>Scan the QR code on your tag with your phone</li>
                  <li>Create an account or sign in</li>
                  <li>Add your pet's details -- done!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Purchase a digital tag online or get a physical tag</li>
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

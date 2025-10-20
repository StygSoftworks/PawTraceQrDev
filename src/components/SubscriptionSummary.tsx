// src/components/SubscriptionSummary.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";

type SubRow = {
  id: string;
  user_id: string;
  paypal_sub_id_base: string | null;
  paypal_plan_id_base: string | null;
  paypal_addon_subs: Array<{ sub_id: string; plan_id: string }> | null;
  addon_quantity: number;
  status: string;
  next_billing_time: string | null;
  renewed_at: string | null;
  created_at: string;
  updated_at: string;
};

interface SubscriptionSummaryProps {
  hasBase: boolean;
  addonCount: number;
  petLimit: number;
  subscription: SubRow | null;
  isActive: boolean;
  nextBilling: string | null;
}

export default function SubscriptionSummary({
  hasBase,
  addonCount,
  petLimit,
  subscription,
  isActive,
  nextBilling,
}: SubscriptionSummaryProps) {
  return (
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
            
            {subscription.paypal_addon_subs && subscription.paypal_addon_subs.length > 0 && addonCount > 0 && (
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
  );
}
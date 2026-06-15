import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { getStatusBadgeVariant, getStatusLabel } from "@/config/billing";
import type { EntitlementType, EntitlementStatus } from "@/config/billing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tag, PawPrint, ShoppingBag, Link as LinkIcon, Unlink, ExternalLink,
  Crown, RefreshCw, CreditCard, CalendarClock, CircleAlert as AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

type TagEntitlement = {
  id: string;
  qr_code_id: string;
  entitlement_type: EntitlementType;
  status: EntitlementStatus;
  current_period_end: string | null;
  grace_period_end: string | null;
  created_at: string;
  qr_codes: {
    short_id: string;
    pet_id: string | null;
    pets: { name: string; id: string } | null;
  } | null;
};

async function getEntitlements(userId: string): Promise<TagEntitlement[]> {
  const { data, error } = await supabase
    .from("tag_entitlements")
    .select(`
      id,
      qr_code_id,
      entitlement_type,
      status,
      current_period_end,
      grace_period_end,
      created_at,
      qr_codes!inner (
        short_id,
        pet_id,
        pets ( name, id )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TagEntitlement[];
}

export default function Billing() {
  const { user, session } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const { data: entitlements, isLoading } = useQuery({
    queryKey: ["entitlements", user?.id],
    queryFn: () => getEntitlements(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  async function openBillingPortal() {
    if (!session) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-billing-portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Apikey: SUPABASE_ANON_KEY,
        },
      });
      const data = await res.json();
      if (data.url) {
        if (window.top !== window.self) {
          window.open(data.url, "_blank");
        } else {
          window.location.href = data.url;
        }
      } else {
        setPortalError("Could not open billing portal. Please try again.");
      }
    } catch {
      setPortalError("Could not connect to billing service. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const activeEntitlements = entitlements?.filter(
    (e) => e.status === "active" || e.entitlement_type === "lifetime"
  ) ?? [];
  const inactiveEntitlements = entitlements?.filter(
    (e) => e.status !== "active" && e.entitlement_type !== "lifetime"
  ) ?? [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">My Tags</h1>
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to view your tags.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            My Tags
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your PawTrace tags
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={openBillingPortal}
            disabled={portalLoading || !entitlements?.length}
          >
            {portalLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage Billing
          </Button>
          <Button asChild className="gap-2 transition-all hover:scale-105">
            <Link to="/pricing">
              <ShoppingBag className="h-4 w-4" />
              Buy Tags
            </Link>
          </Button>
        </div>
      </div>

      {portalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{portalError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !entitlements || entitlements.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Tag className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">No tags yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Purchase a digital tag or scan a physical tag to get started.
              </p>
            </div>
            <Button asChild className="gap-2 mt-4">
              <Link to="/pricing">
                <ShoppingBag className="h-4 w-4" />
                Get Your First Tag
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <SummaryBar
            total={entitlements.length}
            active={activeEntitlements.length}
            inactive={inactiveEntitlements.length}
          />

          {activeEntitlements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                Active Tags
                <Badge variant="secondary" className="ml-1">{activeEntitlements.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeEntitlements.map((ent) => (
                  <EntitlementCard key={ent.id} entitlement={ent} />
                ))}
              </div>
            </div>
          )}

          {inactiveEntitlements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Unlink className="h-4 w-4 text-muted-foreground" />
                Inactive Tags
                <Badge variant="secondary" className="ml-1">{inactiveEntitlements.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {inactiveEntitlements.map((ent) => (
                  <EntitlementCard key={ent.id} entitlement={ent} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ total, active, inactive }: { total: number; active: number; inactive: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Tags</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{inactive}</p>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EntitlementCard({ entitlement }: { entitlement: TagEntitlement }) {
  const pet = entitlement.qr_codes?.pets;
  const shortId = entitlement.qr_codes?.short_id ?? "---";
  const isLifetime = entitlement.entitlement_type === "lifetime";
  const isActive = entitlement.status === "active" || isLifetime;

  return (
    <Card className={`transition-all hover:shadow-md ${!isActive ? "border-amber-200/50 dark:border-amber-800/30 opacity-75" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            isLifetime
              ? "bg-amber-100 dark:bg-amber-900/30"
              : isActive
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-slate-100 dark:bg-slate-800/30"
          }`}>
            {isLifetime ? (
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : pet ? (
              <PawPrint className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Tag className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {pet?.name ?? "Unassigned Tag"}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{shortId}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(entitlement.status)} className="text-xs">
            {getStatusLabel(entitlement.status, entitlement.entitlement_type)}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {isLifetime ? (
              "Never expires"
            ) : entitlement.current_period_end ? (
              `Renews ${format(new Date(entitlement.current_period_end), "MMM d, yyyy")}`
            ) : (
              "No renewal date"
            )}
          </div>
          {pet && (
            <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
              <Link to={`/p/${shortId}`}>
                <ExternalLink className="h-3 w-3" />
                View
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

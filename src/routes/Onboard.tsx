import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { OnboardAuth } from "@/components/onboard/OnboardAuth";
import { OnboardPetForm } from "@/components/onboard/OnboardPetForm";
import { OnboardSuccess } from "@/components/onboard/OnboardSuccess";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert, Hop as Home } from "lucide-react";

type Step = "auth" | "pet" | "done";

export default function Onboard() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(user ? "pet" : "auth");
  const [createdShortId, setCreatedShortId] = useState<string | null>(null);

  const { data: isClaimable, isLoading } = useQuery({
    queryKey: ["qr-claimable", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.rpc("check_qr_claimable", { p_short_id: id });
      return data === true;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (user && step === "auth") {
      setStep("pet");
    }
  }, [user, step]);

  const handleAuthComplete = () => {
    setStep("pet");
  };

  const handlePetCreated = (shortId: string) => {
    setCreatedShortId(shortId);
    setStep("done");
  };

  const stepIndex = step === "auth" ? 0 : step === "pet" ? 1 : 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative mx-auto max-w-xl px-4 sm:px-6 py-8 md:py-12">
        {(isLoading || authLoading) ? (
          <Card className="shadow-xl">
            <CardContent className="p-8 space-y-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : !isClaimable ? (
          <Card className="shadow-xl">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <TriangleAlert className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Tag Unavailable</CardTitle>
                  <CardDescription className="text-base">
                    This tag has already been claimed or is no longer available.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              {["Account", "Pet Profile", "Done"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`h-0.5 w-8 sm:w-12 transition-colors duration-300 ${i <= stepIndex ? "bg-primary" : "bg-border"}`} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        i < stepIndex
                          ? "bg-primary text-primary-foreground"
                          : i === stepIndex
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < stepIndex ? "\u2713" : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${i <= stepIndex ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {step === "auth" && (
              <OnboardAuth onComplete={handleAuthComplete} />
            )}

            {step === "pet" && id && (
              <OnboardPetForm shortId={id} onComplete={handlePetCreated} />
            )}

            {step === "done" && (
              <OnboardSuccess shortId={createdShortId || id || ""} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

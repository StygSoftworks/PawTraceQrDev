import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { listPetsByOwner } from "@/lib/pets";
import Header from "@/components/Header";
import { OnboardAuth } from "@/components/onboard/OnboardAuth";
import { OnboardPetForm } from "@/components/onboard/OnboardPetForm";
import { OnboardSuccess } from "@/components/onboard/OnboardSuccess";
import { ClaimTagDialog } from "@/components/ClaimTagDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TriangleAlert, Hop as Home, PawPrint, Plus } from "lucide-react";

type Step = "auth" | "choose" | "pet" | "done";

export default function Onboard() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(user ? "choose" : "auth");
  const [createdShortId, setCreatedShortId] = useState<string | null>(null);
  const [assignedPetName, setAssignedPetName] = useState<string | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  const { data: isClaimable, isLoading } = useQuery({
    queryKey: ["qr-claimable", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.rpc("check_qr_claimable", { p_short_id: id });
      return data === true;
    },
    staleTime: 30_000,
  });

  const { data: userPets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets", user?.id],
    queryFn: () => (user?.id ? listPetsByOwner(user.id) : []),
    enabled: !!user?.id,
    staleTime: 10_000,
  });

  const hasPets = userPets && userPets.length > 0;

  useEffect(() => {
    if (user && step === "auth") {
      setStep("choose");
    }
  }, [user, step]);

  useEffect(() => {
    if (user && step === "choose" && !petsLoading && !hasPets) {
      setStep("pet");
    }
  }, [user, step, petsLoading, hasPets]);

  const handleAuthComplete = () => {
    localStorage.removeItem("pending_tag_claim");
    setStep("choose");
  };

  const handlePetCreated = (shortId: string) => {
    setCreatedShortId(shortId);
    setStep("done");
  };

  const handleClaimSuccess = (result: {
    petName: string;
    newShortId: string;
    oldShortId: string | null;
  }) => {
    setCreatedShortId(result.newShortId);
    setAssignedPetName(result.petName);
    setClaimDialogOpen(false);
    setStep("done");
  };

  const isLoggedIn = !!user;
  const steps = isLoggedIn
    ? ["Pet Profile", "Done"]
    : ["Account", "Pet Profile", "Done"];

  const stepIndex = (() => {
    if (!isLoggedIn) {
      if (step === "auth") return 0;
      if (step === "choose" || step === "pet") return 1;
      return 2;
    }
    if (step === "choose" || step === "pet") return 0;
    return 1;
  })();

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
              {steps.map((label, i) => (
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
              <OnboardAuth onComplete={handleAuthComplete} shortId={id} />
            )}

            {step === "choose" && hasPets && id && (
              <Card className="shadow-xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <CardHeader className="text-center space-y-2">
                  <CardTitle className="text-2xl">What would you like to do?</CardTitle>
                  <CardDescription className="text-base">
                    Tag <span className="font-mono font-medium">{id}</span> is ready to be linked.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {userPets?.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => setClaimDialogOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                      >
                        {pet.photo_url ? (
                          <img
                            src={pet.photo_url}
                            alt={pet.name}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <PawPrint className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Assign to {pet.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {pet.species}
                            {pet.breed ? ` - ${pet.breed}` : ""}
                          </p>
                        </div>
                        {pet.short_id && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {pet.short_id}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 gap-2 text-base"
                    onClick={() => setStep("pet")}
                  >
                    <Plus className="h-5 w-5" />
                    Create a New Pet Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === "pet" && id && (
              <OnboardPetForm shortId={id} onComplete={handlePetCreated} />
            )}

            {step === "done" && (
              <OnboardSuccess
                shortId={createdShortId || id || ""}
                assignedPetName={assignedPetName}
              />
            )}
          </div>
        )}
      </main>

      {id && (
        <ClaimTagDialog
          shortId={id}
          open={claimDialogOpen}
          onOpenChange={setClaimDialogOpen}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}

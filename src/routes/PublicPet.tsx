// src/routes/PublicPet.tsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PawPrint, TriangleAlert as AlertTriangle, Phone, Mail, MapPin, Info, Hop as Home, Heart, Clock } from "lucide-react";
import { ScanLogger } from "@/components/ScanLogger";
import { PetScanBadge } from "@/components/PetScanBadge";
import Header from "@/components/Header";
type PublicPet = {
  id: string;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string | null;
  description: string | null;
  color: string | null;
  photo_url: string | null;
  missing: boolean;
  missing_since: string | null;
  short_id: string;
  owner_email: string | null;
  owner_phone: string | null;
};

function timeSince(iso?: string | null) {
  if (!iso) return "";
  const start = new Date(iso).getTime();
  const now = Date.now();
  if (isNaN(start) || now <= start) return "just now";

  const diff = now - start;
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const rHours = hours % 24;
    return `${days} day${days>1?"s":""}${rHours ? `, ${rHours} hour${rHours>1?"s":""}` : ""}`;
  }
  if (hours > 0) {
    const rMins = mins % 60;
    return `${hours} hour${hours>1?"s":""}${rMins ? `, ${rMins} min` : ""}`;
  }
  return `${mins} min`;
}

export default function PublicPet() {
  const { id } = useParams();
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-pet", id],
    enabled: !!id,
    queryFn: async (): Promise<PublicPet | null> => {
      const { data, error } = await supabase
        .from("public_pets")
        .select("*")
        .eq("short_id", id)
        .maybeSingle();

      if (error) throw error;
      return data as PublicPet | null;
    },
    staleTime: 60_000,
  });

  return (
    <>
    <ScanLogger shortId={id} askGeo={true} />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 md:py-12">
        {isLoading ? (
          <Card className="overflow-hidden shadow-xl">
            <div className="grid gap-6 p-6 lg:grid-cols-[400px,1fr]">
              <Skeleton className="h-96 w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </Card>
        ) : isError || !data ? (
          <Card className="shadow-xl">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Pet Not Found</CardTitle>
                  <CardDescription className="text-base">
                    This QR code may be invalid or the pet profile is no longer available
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
            {/* Missing Alert */}
            {data.missing && (
              <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="text-base font-medium">
                  <span className="block mb-1">🚨 This pet is currently MISSING!</span>
                  {data.missing_since && (
                    <span className="text-sm opacity-90">
                      Missing for {timeSince(data.missing_since)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Card className="overflow-hidden shadow-xl border-primary/10">
              <CardHeader className="space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
                        <PawPrint className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-3xl tracking-tight">
                        {data.name}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                        {data.species === "dog" ? "🐕" : data.species === "cat" ? "🐱" : "🐾"} {data.species}
                      </Badge>
                      {data.breed && (
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {data.breed}
                        </Badge>
                      )}
                      {data.color && (
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {data.color}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant={data.missing ? "destructive" : "default"}
                    className={`text-sm px-4 py-2 gap-2 ${data.missing ? 'animate-pulse' : ''}`}
                  >
                    {data.missing ? (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        Missing
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        Safe at Home
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid gap-8 p-6 lg:grid-cols-[1fr,400px]">
                {/* Left Column - Info */}
                <div className="space-y-6 order-2 lg:order-1">
                  {/* About Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Info className="h-5 w-5 text-primary" />
                      About {data.name}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {data.description || "No additional description provided."}
                    </p>
                  </div>

                  {/* Contact Section */}
                  {(data.owner_email || data.owner_phone) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Phone className="h-5 w-5 text-primary" />
                        Contact Owner
                      </div>
                      
                      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          If you've found this pet, please contact the owner using the information below
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                        {data.owner_phone && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <a 
                                href={`tel:${data.owner_phone}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {data.owner_phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {data.owner_email && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <a 
                                href={`mailto:${data.owner_email}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {data.owner_email}
                              </a>
                            </div>
                          </div>
                        )}

                        {data.missing && (
                          <div className="flex items-center gap-3 pt-2">
                            <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Last Seen</p>
                              <p className="text-sm text-muted-foreground">
                                {data.missing_since 
                                  ? timeSince(data.missing_since) + " ago"
                                  : "Recently"
                                }
                              </p>
                            </div>

                          
                          </div>
                        )}

                        {/* Pets Scan Count */}
                        <div className="flex items-center justify-between">
                      
                          <PetScanBadge petId={data.id} days={30} label="Scans" />
                        </div>

                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {data.owner_phone && (
                          <Button asChild className="flex-1 gap-2" variant={"success"}>
                            <a href={`tel:${data.owner_phone}`}>
                              <Phone className="h-4 w-4" />
                              Call Owner
                            </a>
                          </Button>
                        )}
                        {data.owner_email && (
                          <Button asChild variant="outline" className="flex-1 gap-2">
                            <a href={`mailto:${data.owner_email}`}>
                              <Mail className="h-4 w-4" />
                              Send Email
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Share Location Helper */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <MapPin className="h-5 w-5 text-primary" />
                      Found This Pet?
                    </div>
                    <Alert>
                      <AlertDescription className="space-y-2">
                        <p className="text-sm">
                          Please share your location with the owner when you contact them. 
                          This helps reunite pets faster!
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* Right Column - Photo */}
                <div className="space-y-4 order-1 lg:order-2">
                  {data.photo_url ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setImageModalOpen(true)}
                        className="group relative w-full overflow-hidden rounded-xl border-2 border-primary/10 ring-4 ring-primary/5 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      >
                        <img
                          src={data.photo_url}
                          alt={`${data.name}`}
                          className="w-full h-auto max-h-[600px] object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-4 py-2 rounded-lg text-sm">
                            Click to enlarge
                          </span>
                        </div>
                      </button>
                      <p className="text-xs text-center text-muted-foreground">
                        Click image to view full size
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 rounded-xl border-2 border-dashed border-primary/20 bg-slate-50 dark:bg-slate-900">
                      <PawPrint className="h-16 w-16 text-primary/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No photo provided</p>
                    </div>
                  )}
                </div>

         
              </CardContent>
            </Card>

          </div>
        )}
      </main>

      {/* Full Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              {data?.name}'s Photo
            </DialogTitle>
          </DialogHeader>
          {data?.photo_url && (
            <div className="p-6 pt-4 overflow-auto">
              <img
                src={data.photo_url}
                alt={`${data.name} full size`}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
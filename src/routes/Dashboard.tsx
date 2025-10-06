// src/routes/Dashboard.tsx
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecentActivityTable } from "@/components/RecentActivityTable";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { DeletePetDialog } from "@/components/DeletePetDialog";
import { useQROperations } from "@/hooks/useQROperations";

import { 
  PawPrint, Plus, QrCode, Edit, Trash2, Eye, 
  AlertTriangle, Activity, RefreshCw, AlertCircle, Sparkles
} from "lucide-react";

import { PetDialog } from "@/components/PetDialog";
import type { PetRow } from "@/lib/pets";
import { listPetsByOwner, updatePet } from "@/lib/pets";

export default function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ownerId = user?.id ?? null;

  const { backfillAllQR, isBackfilling } = useQROperations(ownerId);

  const { data: pets, isLoading, isError } = useQuery({
    queryKey: ["pets", ownerId],
    queryFn: async () => (ownerId ? listPetsByOwner(ownerId) : ([] as PetRow[])),
    enabled: !!ownerId,
    staleTime: 30_000,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PetRow | null>(null);
  const [qrTarget, setQrTarget] = useState<PetRow | null>(null);
  const [missingTarget, setMissingTarget] = useState<PetRow | null>(null);
  const [togglingMissing, setTogglingMissing] = useState(false);

  const viewPetPage = (pet: PetRow) => {
    const baseUrl = window.location.origin;
    const petUrl = `${baseUrl}/p/${pet.short_id}`;
    window.open(petUrl, "_blank");
  };

  const handleSaved = async () => {
    await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
    setEditTarget(null);
    setAddOpen(false);
  };

  const handleDeleted = async () => {
    await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
    setDeleteTarget(null);
  };

  const setMissingMutation = useMutation({
    mutationFn: async ({ id, missing }: { id: string; missing: boolean }) => {
      return updatePet(id, {
        missing,
        missing_since: missing ? new Date().toISOString() : null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
    },
  });

  const handleToggleMissing = async (pet: PetRow, next: boolean) => {
    if (next) {
      setMissingTarget(pet);
    } else {
      try {
        setTogglingMissing(true);
        await setMissingMutation.mutateAsync({ id: pet.id, missing: false });
      } catch (e: any) {
        alert(e?.message ?? "Failed to update");
      } finally {
        setTogglingMissing(false);
      }
    }
  };

  const confirmSetMissing = async () => {
    if (!missingTarget) return;
    try {
      setTogglingMissing(true);
      await setMissingMutation.mutateAsync({ id: missingTarget.id, missing: true });
    } catch (e: any) {
      alert(e?.message ?? "Failed to update");
    } finally {
      setTogglingMissing(false);
      setMissingTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
            <PawPrint className="h-5 w-5 text-primary" />
          </div>
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your pets, QR codes, and track activity
        </p>
      </div>

      <Tabs defaultValue="pets" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pets" className="gap-2">
            <PawPrint className="h-4 w-4" />
            My Pets
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* Pets tab */}
        <TabsContent value="pets" className="space-y-4">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Registered Pets
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage profiles, photos, QR tags, and missing status
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={backfillAllQR} 
                    disabled={!ownerId || isBackfilling}
                    className="gap-2 transition-all hover:scale-105"
                  >
                    <RefreshCw className={`h-4 w-4 ${isBackfilling ? 'animate-spin' : ''}`} />
                    {isBackfilling ? "Working…" : "Backfill QR"}
                  </Button>
                  <Button 
                    onClick={() => setAddOpen(true)} 
                    disabled={!ownerId}
                    className="gap-2 transition-all hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    Add Pet
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-4 space-y-3">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-32 w-full rounded-md" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-9 w-16" />
                        <Skeleton className="h-9 w-16" />
                        <Skeleton className="h-9 w-16" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Failed to load pets. Please try again.</AlertDescription>
                </Alert>
              ) : pets && pets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pets.map((p) => (
                    <Card key={p.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-primary/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg truncate flex items-center gap-2">
                            <PawPrint className="h-4 w-4 text-primary flex-shrink-0" />
                            {p.name}
                          </CardTitle>
                          <div className="flex flex-col gap-1.5 items-end">
                            {p.missing && (
                              <Badge variant="destructive" className="gap-1 animate-pulse">
                                <AlertTriangle className="h-3 w-3" />
                                Missing
                              </Badge>
                            )}
                            <Badge variant="secondary" className="capitalize text-xs">
                              {p.species}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2 text-sm">
                          {p.breed || p.description || "No description"}
                        </CardDescription>
                      </CardHeader>

                      {p.photo_url && (
                        <div className="px-4 pb-3">
                          <img
                            src={p.photo_url}
                            alt={`${p.name} photo`}
                            className="w-full h-40 rounded-lg object-cover ring-1 ring-primary/10"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <CardContent className="space-y-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => setEditTarget(p)}
                            className="gap-1.5 flex-1 transition-all hover:scale-105"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>

                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => viewPetPage(p)}
                            className="gap-1.5 flex-1 transition-all hover:scale-105"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant={p.qr_url ? "outline" : "secondary"}
                            onClick={() => setQrTarget(p)}
                            className="gap-1.5 flex-1 transition-all hover:scale-105"
                            title={p.qr_url ? "View QR" : "Generate QR"}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            {p.qr_url ? "QR" : "Create"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`missing-${p.id}`} className="text-sm font-medium cursor-pointer">
                              Mark Missing
                            </Label>
                            <Switch
                              id={`missing-${p.id}`}
                              checked={!!p.missing}
                              disabled={togglingMissing || setMissingMutation.isPending}
                              onCheckedChange={(next) => handleToggleMissing(p, next)}
                            />
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <PawPrint className="h-10 w-10 text-primary/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-foreground">No pets yet</p>
                    <p className="text-sm text-muted-foreground">
                      Click <span className="font-medium text-foreground">Add Pet</span> to create your first pet profile
                    </p>
                  </div>
                  <Button onClick={() => setAddOpen(true)} className="gap-2 mt-4">
                    <Plus className="h-4 w-4" />
                    Add Your First Pet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add dialog */}
          <PetDialog
            mode="add"
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={handleSaved}
          />

          {/* Edit dialog */}
          {editTarget && (
            <PetDialog
              mode="edit"
              open={!!editTarget}
              onOpenChange={(v) => !v && setEditTarget(null)}
              initialPet={{
                id: editTarget.id,
                name: editTarget.name,
                species: editTarget.species,
                breed: editTarget.breed ?? undefined,
                color: editTarget.color ?? undefined,
                weight: editTarget.weight ?? undefined,
                birthdate: editTarget.birthdate ?? undefined,
                microchipId: editTarget.microchip_id ?? undefined,
                description: editTarget.description ?? undefined,
                notes: editTarget.notes ?? undefined,
                vaccinations: editTarget.vaccinations
                  ? {
                      rabies: editTarget.vaccinations.rabies ?? false,
                      rabiesExpires: editTarget.vaccinations.rabiesExpires ?? undefined,
                    }
                  : undefined,
                photoPreview: editTarget.photo_url ?? undefined,
              }}
              onSubmit={handleSaved}
            />
          )}

          {/* QR Code Dialog */}
          {ownerId && (
            <QRCodeDialog
              pet={qrTarget}
              open={!!qrTarget}
              onOpenChange={(open) => !open && setQrTarget(null)}
              ownerId={ownerId}
            />
          )}

          {/* Delete Pet Dialog */}
          <DeletePetDialog
            pet={deleteTarget}
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            onDeleted={handleDeleted}
          />

          {/* Confirm "set missing" dialog */}
          <AlertDialog open={!!missingTarget} onOpenChange={(v) => !v && setMissingTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Mark {missingTarget?.name} as missing?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This helps highlight their profile and can trigger your outreach flow. You can turn this off later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={togglingMissing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={togglingMissing}
                  onClick={confirmSetMissing}
                  className="gap-2"
                >
                  {togglingMissing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Yes, mark missing"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="mt-4">
          <RecentActivityTable days={30} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
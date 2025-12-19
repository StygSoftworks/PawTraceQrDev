import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/profile/useProfile";

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
import { LocationSharesCard } from "@/components/LocationSharesCard";
import { PetSharingDialog } from "@/components/PetSharingDialog";
import { PendingInvitationsCard } from "@/components/PendingInvitationsCard";

import {
  PawPrint, Plus, QrCode, Edit, Trash2, Eye,
  AlertTriangle, Activity, RefreshCw, AlertCircle, Sparkles, ShieldCheck, ShieldAlert,
  Users, UserCheck
} from "lucide-react";

import { PetDialog } from "@/components/PetDialog";
import type { PetRow } from "@/lib/pets";
import { listPetsByOwner, togglePetMissing } from "@/lib/pets";
import { getSharedPets, getShareCount } from "@/lib/pet-sharing";
import { getSubscriptionBadgeVariant } from "@/config/billing";

type SharedPetRow = PetRow & {
  share_id: string;
  can_edit: boolean;
  owner_name: string | null;
  owner_email: string | null;
  is_shared: true;
};

export default function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ownerId = user?.id ?? null;
  const { data: profile } = useProfile();

  const { data: pets, isLoading, isError } = useQuery({
    queryKey: ["pets", ownerId],
    queryFn: async () => (ownerId ? listPetsByOwner(ownerId) : ([] as PetRow[])),
    enabled: !!ownerId,
    staleTime: 30_000,
  });

  const { data: sharedPets, isLoading: sharedLoading } = useQuery({
    queryKey: ["shared-pets"],
    queryFn: getSharedPets,
    enabled: !!ownerId,
    staleTime: 30_000,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PetRow | null>(null);
  const [qrTarget, setQrTarget] = useState<PetRow | null>(null);
  const [shareTarget, setShareTarget] = useState<PetRow | null>(null);
  const [missingTarget, setMissingTarget] = useState<PetRow | null>(null);
  const [togglingMissing, setTogglingMissing] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  useEffect(() => {
    if (!profile || !pets || isLoading || dismissedThisSession) return;

    const hasNoPets = pets.length === 0;
    const isFirstTime = profile.has_created_first_pet === false;

    if (hasNoPets && isFirstTime && !addOpen) {
      setAddOpen(true);
    }
  }, [profile, pets, isLoading, addOpen, dismissedThisSession]);

  const viewPetPage = (pet: PetRow | SharedPetRow) => {
    const baseUrl = window.location.origin;
    const petUrl = `${baseUrl}/p/${pet.short_id}`;
    window.open(petUrl, "_blank");
  };

  const handleSaved = async () => {
    await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
    await qc.invalidateQueries({ queryKey: ["shared-pets"] });
    await qc.invalidateQueries({ queryKey: ["profile", ownerId] });
    setEditTarget(null);
    setAddOpen(false);
  };

  const handleAddDialogChange = (open: boolean) => {
    setAddOpen(open);
    if (!open && profile?.has_created_first_pet === false && (!pets || pets.length === 0)) {
      setDismissedThisSession(true);
    }
  };

  const handleDeleted = async () => {
    await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
    setDeleteTarget(null);
  };

  const setMissingMutation = useMutation({
    mutationFn: async ({ id, missing }: { id: string; missing: boolean }) => {
      return togglePetMissing(id, missing);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
      await qc.invalidateQueries({ queryKey: ["shared-pets"] });
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

      <PendingInvitationsCard />

      {dismissedThisSession && profile?.has_created_first_pet === false && (!pets || pets.length === 0) && (
        <Alert className="border-primary/30 bg-primary/5 animate-in fade-in-50 slide-in-from-top-5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-sm">
              Ready to get started? Create your first pet profile to activate your QR tag
            </span>
            <Button
              size="sm"
              onClick={() => {
                setDismissedThisSession(false);
                setAddOpen(true);
              }}
              className="gap-2 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Pet
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pets" className="space-y-4">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="pets" className="gap-2">
            <PawPrint className="h-4 w-4" />
            My Pets
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Shared
            {sharedPets && sharedPets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {sharedPets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <Activity className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

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
                <Button
                  onClick={() => setAddOpen(true)}
                  disabled={!ownerId}
                  className="gap-2 transition-all hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  Add Pet
                </Button>
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
                    <OwnedPetCard
                      key={p.id}
                      pet={p}
                      onEdit={() => setEditTarget(p)}
                      onView={() => viewPetPage(p)}
                      onQr={() => setQrTarget(p)}
                      onShare={() => setShareTarget(p)}
                      onDelete={() => setDeleteTarget(p)}
                      onToggleMissing={(next) => handleToggleMissing(p, next)}
                      togglingMissing={togglingMissing || setMissingMutation.isPending}
                    />
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

          <PetDialog
            mode="add"
            open={addOpen}
            onOpenChange={handleAddDialogChange}
            onSubmit={handleSaved}
          />

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
                environment: editTarget.environment,
              }}
              onSubmit={handleSaved}
            />
          )}

          {ownerId && (
            <QRCodeDialog
              pet={qrTarget}
              open={!!qrTarget}
              onOpenChange={(open) => !open && setQrTarget(null)}
              ownerId={ownerId}
            />
          )}

          <DeletePetDialog
            pet={deleteTarget}
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            onDeleted={handleDeleted}
          />

          <PetSharingDialog
            pet={shareTarget}
            open={!!shareTarget}
            onOpenChange={(open) => !open && setShareTarget(null)}
          />

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
                      Saving...
                    </>
                  ) : (
                    "Yes, mark missing"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Shared With Me
                </CardTitle>
                <CardDescription className="text-base">
                  Pets that others have shared with you
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {sharedLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4 space-y-3">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-32 w-full rounded-md" />
                    </Card>
                  ))}
                </div>
              ) : sharedPets && sharedPets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedPets.map((p: SharedPetRow) => (
                    <SharedPetCard
                      key={p.id}
                      pet={p}
                      onEdit={p.can_edit ? () => setEditTarget(p) : undefined}
                      onView={() => viewPetPage(p)}
                      onToggleMissing={(next) => handleToggleMissing(p, next)}
                      togglingMissing={togglingMissing || setMissingMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-10 w-10 text-primary/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-foreground">No shared pets</p>
                    <p className="text-sm text-muted-foreground">
                      When someone shares a pet with you, it will appear here
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <LocationSharesCard />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <RecentActivityTable days={30} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type OwnedPetCardProps = {
  pet: PetRow;
  onEdit: () => void;
  onView: () => void;
  onQr: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggleMissing: (next: boolean) => void;
  togglingMissing: boolean;
};

function OwnedPetCard({
  pet,
  onEdit,
  onView,
  onQr,
  onShare,
  onDelete,
  onToggleMissing,
  togglingMissing,
}: OwnedPetCardProps) {
  const { data: shareCount } = useQuery({
    queryKey: ["pet-share-count", pet.id],
    queryFn: () => getShareCount(pet.id),
    staleTime: 60_000,
  });

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg truncate flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-primary flex-shrink-0" />
            {pet.name}
          </CardTitle>
          <div className="flex flex-col gap-1.5 items-end">
            {pet.missing && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                Missing
              </Badge>
            )}
            {shareCount && shareCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                {shareCount} shared
              </Badge>
            )}
            <Badge
              variant={getSubscriptionBadgeVariant(pet.subscription_status)}
              className="gap-1 text-xs"
            >
              {pet.subscription_status === 'active' ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3 w-3" />
                  {pet.subscription_status === 'expired' ? 'Expired' :
                   pet.subscription_status === 'cancelled' ? 'Cancelled' :
                   pet.subscription_status === 'pending' ? 'Pending' : 'Inactive'}
                </>
              )}
            </Badge>
            <Badge variant="secondary" className="capitalize text-xs">
              {pet.species}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-sm">
          {pet.breed || pet.description || "No description"}
        </CardDescription>
      </CardHeader>

      {pet.photo_url && (
        <div className="px-4 pb-3">
          <img
            src={pet.photo_url}
            alt={`${pet.name} photo`}
            className="w-full h-40 rounded-lg object-cover ring-1 ring-primary/10"
            loading="lazy"
          />
        </div>
      )}

      <CardContent className="space-y-3 pt-3 border-t">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={onEdit}
            className="gap-1.5 flex-1 transition-all hover:scale-105"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="gap-1.5 flex-1 transition-all hover:scale-105"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onQr}
            className="gap-1.5 flex-1 transition-all hover:scale-105"
            title="View QR Code"
          >
            <QrCode className="h-3.5 w-3.5" />
            QR
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onShare}
            className="gap-1.5 flex-1 transition-all hover:scale-105"
          >
            <Users className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Label htmlFor={`missing-${pet.id}`} className="text-sm font-medium cursor-pointer">
              Mark Missing
            </Label>
            <Switch
              id={`missing-${pet.id}`}
              checked={!!pet.missing}
              disabled={togglingMissing}
              onCheckedChange={onToggleMissing}
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type SharedPetCardProps = {
  pet: SharedPetRow;
  onEdit?: () => void;
  onView: () => void;
  onToggleMissing: (next: boolean) => void;
  togglingMissing: boolean;
};

function SharedPetCard({
  pet,
  onEdit,
  onView,
  onToggleMissing,
  togglingMissing,
}: SharedPetCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg truncate flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-primary flex-shrink-0" />
            {pet.name}
          </CardTitle>
          <div className="flex flex-col gap-1.5 items-end">
            {pet.missing && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                Missing
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 text-xs bg-primary/5">
              <UserCheck className="h-3 w-3" />
              {pet.can_edit ? "Can edit" : "View only"}
            </Badge>
            <Badge variant="secondary" className="capitalize text-xs">
              {pet.species}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-sm">
          <span className="text-muted-foreground">
            Shared by {pet.owner_name || pet.owner_email || "Unknown"}
          </span>
        </CardDescription>
      </CardHeader>

      {pet.photo_url && (
        <div className="px-4 pb-3">
          <img
            src={pet.photo_url}
            alt={`${pet.name} photo`}
            className="w-full h-40 rounded-lg object-cover ring-1 ring-primary/10"
            loading="lazy"
          />
        </div>
      )}

      <CardContent className="space-y-3 pt-3 border-t">
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button
              size="sm"
              onClick={onEdit}
              className="gap-1.5 flex-1 transition-all hover:scale-105"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="gap-1.5 flex-1 transition-all hover:scale-105"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Label htmlFor={`missing-shared-${pet.id}`} className="text-sm font-medium cursor-pointer">
              Mark Missing
            </Label>
            <Switch
              id={`missing-shared-${pet.id}`}
              checked={!!pet.missing}
              disabled={togglingMissing}
              onCheckedChange={onToggleMissing}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

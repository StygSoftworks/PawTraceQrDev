import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { listPetsByOwner } from "@/lib/pets";
import { assignTagToExistingPet } from "@/lib/claim-tag";
import type { PetRow } from "@/lib/pets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PawPrint,
  Check,
  ArrowRight,
  CircleAlert as AlertCircle,
  RefreshCw,
  Tag,
} from "lucide-react";

type Props = {
  shortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: {
    petName: string;
    newShortId: string;
    oldShortId: string | null;
  }) => void;
};

export function ClaimTagDialog({
  shortId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedPet, setSelectedPet] = useState<PetRow | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{
    petName: string;
    newShortId: string;
    oldShortId: string | null;
  } | null>(null);

  const { data: pets, isLoading } = useQuery({
    queryKey: ["pets", user?.id],
    queryFn: () => (user?.id ? listPetsByOwner(user.id) : []),
    enabled: open && !!user?.id,
    staleTime: 10_000,
  });

  const handleAssign = async () => {
    if (!selectedPet) return;
    setAssigning(true);
    setError(null);

    try {
      const res = await assignTagToExistingPet(shortId, selectedPet.id);
      setResult({
        petName: res.pet_name,
        newShortId: res.new_short_id,
        oldShortId: res.old_short_id,
      });
      setDone(true);

      qc.invalidateQueries({ queryKey: ["pets", user?.id] });
      qc.invalidateQueries({ queryKey: ["public-pet", shortId] });
      qc.invalidateQueries({ queryKey: ["qr-claimable", shortId] });
      qc.invalidateQueries({ queryKey: ["user-tags"] });

      onSuccess?.({
        petName: res.pet_name,
        newShortId: res.new_short_id,
        oldShortId: res.old_short_id,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign tag");
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedPet(null);
      setError(null);
      setDone(false);
      setResult(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {done ? "Tag Assigned" : "Assign Tag to Pet"}
          </DialogTitle>
          {!done && (
            <DialogDescription>
              Choose which pet should use tag{" "}
              <span className="font-mono font-medium">{shortId}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {done && result ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center space-y-3 py-4">
              <div className="h-14 w-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Check className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-lg">
                  Tag linked to {result.petName}!
                </p>
                <p className="text-sm text-muted-foreground">
                  Tag{" "}
                  <span className="font-mono">{result.newShortId}</span>{" "}
                  is now active.
                </p>
              </div>
            </div>

            {result.oldShortId && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                  The old tag{" "}
                  <span className="font-mono font-medium">
                    {result.oldShortId}
                  </span>{" "}
                  has been unlinked and returned to your account. You can
                  reassign it from your dashboard.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={() =>
                  window.open(`/p/${result.newShortId}`, "_blank")
                }
              >
                View Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !pets || pets.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <PawPrint className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  You don't have any pets yet. Create a new pet profile to use
                  this tag.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {pets.map((pet) => {
                  const isSelected = selectedPet?.id === pet.id;
                  const hasExistingTag = !!pet.short_id;

                  return (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
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
                        <p className="font-medium truncate">{pet.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {pet.species}
                          {pet.breed ? ` - ${pet.breed}` : ""}
                        </p>
                      </div>
                      {hasExistingTag && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          {pet.short_id}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPet?.short_id && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                  {selectedPet.name} already has tag{" "}
                  <span className="font-mono font-medium">
                    {selectedPet.short_id}
                  </span>
                  . It will be unlinked and returned to your account for
                  reassignment.
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full gap-2"
              disabled={!selectedPet || assigning}
              onClick={handleAssign}
            >
              {assigning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Tag className="h-4 w-4" />
                  Assign Tag to {selectedPet?.name ?? "Pet"}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

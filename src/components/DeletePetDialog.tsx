// src/components/DeletePetDialog.tsx
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert as AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { deletePet, deletePetPhotoByUrl } from "@/lib/pets";
import type { PetRow } from "@/lib/pets";

interface DeletePetDialogProps {
  pet: PetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeletePetDialog({ pet, open, onOpenChange, onDeleted }: DeletePetDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pet) return;
    
    setIsDeleting(true);
    try {
      // Delete photo first if it exists
      if (pet.photo_url) {
        await deletePetPhotoByUrl(pet.photo_url);
      }
      
      // Then delete the pet record
      await deletePet(pet.id);
      
      // Notify parent component
      onDeleted();
      
      // Close dialog
      onOpenChange(false);
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete pet");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!pet) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {pet.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes {pet.name}'s profile
            {pet.photo_url ? ", photo," : ""} and QR tag link. You cannot undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Yes, Delete Forever
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
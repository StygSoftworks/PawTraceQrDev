import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Edit,
  Eye,
  Clock,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getPetCollaborators,
  sharePetWithUser,
  revokePetShare,
  updateSharePermissions,
  type PetShareWithDetails,
} from "@/lib/pet-sharing";
import type { PetRow } from "@/lib/pets";

const ShareSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  canEdit: z.boolean(),
});

type ShareForm = z.infer<typeof ShareSchema>;

type PetSharingDialogProps = {
  pet: PetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PetSharingDialog({ pet, open, onOpenChange }: PetSharingDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ShareForm>({
    resolver: zodResolver(ShareSchema),
    defaultValues: { email: "", canEdit: false },
  });

  const canEdit = watch("canEdit");

  const { data: collaborators, isLoading } = useQuery({
    queryKey: ["pet-collaborators", pet?.id],
    queryFn: () => (pet ? getPetCollaborators(pet.id) : Promise.resolve([])),
    enabled: !!pet && open,
  });

  const shareMutation = useMutation({
    mutationFn: async (data: ShareForm) => {
      if (!pet) throw new Error("No pet selected");
      return sharePetWithUser(pet.id, data.email, data.canEdit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-collaborators", pet?.id] });
      reset();
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokePetShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-collaborators", pet?.id] });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ shareId, canEdit }: { shareId: string; canEdit: boolean }) =>
      updateSharePermissions(shareId, canEdit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-collaborators", pet?.id] });
    },
  });

  const onSubmit = (data: ShareForm) => {
    setError(null);
    shareMutation.mutate(data);
  };

  if (!pet) return null;

  const activeCollaborators = collaborators?.filter(
    (c) => c.status === "accepted" || c.status === "pending"
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share {pet.name}
          </DialogTitle>
          <DialogDescription>
            Invite family members or friends to view and manage {pet.name}'s profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                {...register("email")}
                disabled={shareMutation.isPending}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="canEdit" className="flex items-center gap-2 cursor-pointer">
                  <Edit className="h-4 w-4" />
                  Allow editing
                </Label>
                <p className="text-sm text-muted-foreground">
                  {canEdit
                    ? "Can view and edit pet details"
                    : "Can only view pet details"}
                </p>
              </div>
              <Switch
                id="canEdit"
                checked={canEdit}
                onCheckedChange={(checked) => setValue("canEdit", checked)}
                disabled={shareMutation.isPending}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={shareMutation.isPending}
            >
              {shareMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending invitation...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Collaborators
              {activeCollaborators.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {activeCollaborators.length}
                </Badge>
              )}
            </h4>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : activeCollaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No one has access to this pet yet. Send an invitation above.
              </p>
            ) : (
              <div className="space-y-2">
                {activeCollaborators.map((collab) => (
                  <CollaboratorRow
                    key={collab.id}
                    collaborator={collab}
                    onRevoke={() => revokeMutation.mutate(collab.id)}
                    onToggleEdit={(canEdit) =>
                      updatePermissionMutation.mutate({ shareId: collab.id, canEdit })
                    }
                    isRevoking={revokeMutation.isPending}
                    isUpdating={updatePermissionMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type CollaboratorRowProps = {
  collaborator: PetShareWithDetails;
  onRevoke: () => void;
  onToggleEdit: (canEdit: boolean) => void;
  isRevoking: boolean;
  isUpdating: boolean;
};

function CollaboratorRow({
  collaborator,
  onRevoke,
  onToggleEdit,
  isRevoking,
  isUpdating,
}: CollaboratorRowProps) {
  const displayName = collaborator.shared_user_name || collaborator.shared_user_email || collaborator.shared_with_email;
  const isPending = collaborator.status === "pending";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{displayName}</span>
          {isPending ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              Pending
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Check className="h-3 w-3" />
              Accepted
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {collaborator.can_edit ? (
            <span className="flex items-center gap-1">
              <Edit className="h-3 w-3" />
              Can edit
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              View only
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isPending && (
          <Switch
            checked={collaborator.can_edit}
            onCheckedChange={onToggleEdit}
            disabled={isUpdating}
            aria-label="Toggle edit permission"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRevoke}
          disabled={isRevoking}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

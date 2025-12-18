import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Check, X, Edit, Eye, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  getPendingInvitations,
  acceptPetShare,
  declinePetShare,
  type ShareInvitation,
} from "@/lib/pet-sharing";

export function PendingInvitationsCard() {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["pending-invitations"],
    queryFn: getPendingInvitations,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptPetShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["shared-pets"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declinePetShare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Pending Invitations
          <Badge variant="default" className="ml-auto">
            {invitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => (
          <InvitationRow
            key={invitation.id}
            invitation={invitation}
            onAccept={() => acceptMutation.mutate(invitation.id)}
            onDecline={() => declineMutation.mutate(invitation.id)}
            isAccepting={acceptMutation.isPending}
            isDeclining={declineMutation.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}

type InvitationRowProps = {
  invitation: ShareInvitation;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
};

function InvitationRow({
  invitation,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: InvitationRowProps) {
  const isProcessing = isAccepting || isDeclining;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-background">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{invitation.pet_name}</span>
          {invitation.can_edit ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Edit className="h-3 w-3" />
              Can edit
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <Eye className="h-3 w-3" />
              View only
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Shared by {invitation.owner_name || invitation.owner_email || "Unknown"}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(invitation.created_at), "MMM d, yyyy")}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isProcessing}
          className="gap-1"
        >
          {isAccepting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          disabled={isProcessing}
          className="gap-1"
        >
          {isDeclining ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Decline
        </Button>
      </div>
    </div>
  );
}

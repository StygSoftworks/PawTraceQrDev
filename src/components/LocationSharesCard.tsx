import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Eye, Archive, Clock, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

type LocationShare = {
  id: string;
  pet_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  finder_note: string | null;
  finder_contact: string | null;
  shared_at: string;
  viewed_at: string | null;
  archived_at: string | null;
  pet_name: string;
};

export function LocationSharesCard() {
  const queryClient = useQueryClient();

  const { data: shares, isLoading } = useQuery({
    queryKey: ["location-shares"],
    queryFn: async (): Promise<LocationShare[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("location_shares")
        .select(`
          id,
          pet_id,
          latitude,
          longitude,
          accuracy,
          finder_note,
          finder_contact,
          shared_at,
          viewed_at,
          archived_at,
          pets!inner(name)
        `)
        .eq("owner_id", user.id)
        .is("archived_at", null)
        .order("shared_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((share: any) => ({
        ...share,
        pet_name: share.pets.name,
      }));
    },
  });

  const markViewedMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("location_shares")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-shares"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("location_shares")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-shares"] });
    },
  });

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Shares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeShares = shares?.filter((s) => !s.archived_at) || [];
  const unviewedCount = activeShares.filter((s) => !s.viewed_at).length;

  if (activeShares.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Shares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No location shares yet. When someone finds your pet and shares their location,
            it will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Shares
          {unviewedCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {unviewedCount} New
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeShares.map((share) => (
          <div
            key={share.id}
            className={`border rounded-lg p-4 space-y-3 ${
              !share.viewed_at ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{share.pet_name}</p>
                  {!share.viewed_at && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(share.shared_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
                {share.accuracy && (
                  <p className="text-xs text-muted-foreground">
                    Accuracy: ±{Math.round(share.accuracy)}m
                  </p>
                )}
              </div>
            </div>

            {share.finder_note && (
              <div className="bg-muted/50 rounded p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  Message from finder
                </div>
                <p className="text-sm whitespace-pre-wrap">{share.finder_note}</p>
              </div>
            )}

            {share.finder_contact && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={
                    share.finder_contact.includes("@")
                      ? `mailto:${share.finder_contact}`
                      : `tel:${share.finder_contact}`
                  }
                  className="text-primary hover:underline"
                >
                  {share.finder_contact}
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => openInMaps(Number(share.latitude), Number(share.longitude))}
                className="flex-1 gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Maps
              </Button>
              {!share.viewed_at && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markViewedMutation.mutate(share.id)}
                  disabled={markViewedMutation.isPending}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => archiveMutation.mutate(share.id)}
                disabled={archiveMutation.isPending}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

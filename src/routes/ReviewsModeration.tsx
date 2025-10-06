// src/routes/ReviewsModeration.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAllFeedbackForModeration, approveFeedback, deleteFeedback, type FeedbackRow } from "@/lib/feedback";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Fetch current user's role from profiles.role */
async function fetchMyRole(): Promise<"free" | "user" | "admin" | "owner" | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return (data?.role ?? "free") as any;
}

export default function ReviewsModeration() {
  const qc = useQueryClient();

  // Load my role
  const { data: role, isLoading: roleLoading, isError: roleError } = useQuery({
    queryKey: ["my-role"],
    queryFn: fetchMyRole,
    staleTime: 60_000,
  });

  // Feedback awaiting moderation (RLS should allow only admins/owners to see all)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feedback_moderation"],
    queryFn: listAllFeedbackForModeration,
    staleTime: 10_000,
    enabled: role === "admin" || role === "owner", // only fetch if allowed
  });

    const approveMut = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => approveFeedback(id, approve),
    onMutate: async (vars) => {
        await qc.cancelQueries({ queryKey: ["feedback_moderation"] });
        const prev = qc.getQueryData<FeedbackRow[]>(["feedback_moderation"]);
        qc.setQueryData<FeedbackRow[]>(["feedback_moderation"], (old) =>
        (old ?? []).map((r) =>
            r.id === vars.id ? { ...r, approved: vars.approve } as FeedbackRow : r
        )
        );
        return { prev };
    },
    onError: (_err, _vars, ctx) => {
        if (ctx?.prev) qc.setQueryData(["feedback_moderation"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["feedback_moderation"] }),
    });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback_moderation"] }),
  });

  const canModerate = role === "admin" || role === "owner";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Moderate Reviews</h1>
        <Badge variant={canModerate ? "default" : "outline"}>
          {roleLoading ? "…" : roleError ? "unknown" : (role ?? "guest")}
        </Badge>
      </div>

      {!canModerate ? (
        <div className="text-sm text-muted-foreground">
          You don’t have permission to view this page. (Admins/Owners only)
        </div>
      ) : isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : isError ? (
        <div className="text-sm text-destructive">Failed to load feedback.</div>
      ) : !data?.length ? (
        <div className="text-sm text-muted-foreground">No reviews yet.</div>
      ) : (
        <div className="grid gap-4">
          {data.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {r.display_name || "Anonymous"} •{" "}
                    <span className="text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/40"}`}
                        />
                      ))}
                    </span>
                    {r.approved ? (
                      <Badge variant="secondary">Approved</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {r.approved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveMut.mutate({ id: r.id, approve: false })}
                      disabled={!canModerate}
                    >
                      <X className="h-4 w-4 mr-1" /> Unpublish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate({ id: r.id, approve: true })}
                      disabled={!canModerate}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete this review?")) deleteMut.mutate(r.id);
                    }}
                    disabled={!canModerate}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm">{r.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

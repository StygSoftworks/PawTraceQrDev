// src/routes/Feedback.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/auth/AuthProvider";
import {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  listMyFeedback,
  type FeedbackRow,
} from "@/lib/feedback";
import { supabase } from "@/lib/supabase";

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Star, Pencil, Trash2 } from "lucide-react";

// ------------------------------------------------------------------
// Small rating input (stars)
// ------------------------------------------------------------------
function StarRating({
  value,
  onChange,
  disabled,
  size = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const activeValue = hover ?? value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = activeValue >= n;
        return (
          <button
            key={n}
            type="button"
            className={`p-1 rounded-md transition-colors ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-secondary/60"}`}
            onMouseEnter={() => !disabled && setHover(n)}
            onMouseLeave={() => !disabled && setHover(null)}
            onClick={() => !disabled && onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`${active ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/50"}`}
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// Zod schema
// ------------------------------------------------------------------
const FeedbackSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(6, "Please write a few words (6+ chars)").max(2000),
  display_name: z.string().max(60).optional(),
});
type FeedbackForm = z.infer<typeof FeedbackSchema>;

// ------------------------------------------------------------------
// Public reviews (from approved view) — local fetcher
// ------------------------------------------------------------------
async function listPublicReviews(limit = 20) {
  const { data, error } = await supabase
    .from("feedback_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    user_id: string | null;
    display_name: string | null;
    rating: number;
    comment: string;
    approved: boolean;
    created_at: string;
  }>;
}

// ------------------------------------------------------------------
// Edit dialog (inline component) for a single review
// ------------------------------------------------------------------
function EditReviewDialog({
  open,
  onOpenChange,
  review,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review: FeedbackRow;
  onSave: (patch: { rating?: number; comment?: string; display_name?: string | null }) => Promise<void>;
  saving: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      rating: review.rating,
      comment: review.comment,
      display_name: review.display_name ?? "",
    },
  });

  const rating = watch("rating");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Trigger is handled outside; this only renders the dialog content when open */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit your review</AlertDialogTitle>
          <AlertDialogDescription>
            Update your rating or comment. Changes may require re-approval.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form
          onSubmit={handleSubmit(async (vals) => {
            await onSave({
              rating: vals.rating,
              comment: vals.comment,
              display_name: vals.display_name ?? null,
            });
            onOpenChange(false);
          })}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={(v) => setValue("rating", v, { shouldValidate: true })} disabled={saving || isSubmitting} />
            {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_name">Display name (optional)</Label>
            <Input id="display_name" {...register("display_name")} disabled={saving || isSubmitting} />
            {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea id="comment" rows={5} {...register("comment")} disabled={saving || isSubmitting} />
            {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
          </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving || isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction type="submit" disabled={saving || isSubmitting}>
            {saving || isSubmitting ? "Saving…" : "Save changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function Feedback() {
  const qc = useQueryClient();
  const { user } = useAuth();

  // Public reviews
  const { data: publicReviews, isLoading: loadingPublic } = useQuery({
    queryKey: ["feedback_public"],
    queryFn: () => listPublicReviews(24),
    staleTime: 60_000,
  });

  // My reviews
  const { data: myReviews, isLoading: loadingMine } = useQuery({
    queryKey: ["my-feedback"],
    queryFn: listMyFeedback,
    staleTime: 30_000,
  });

  // Create
  const createMut = useMutation({
    mutationFn: createFeedback,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feedback_public"] }),
        qc.invalidateQueries({ queryKey: ["my-feedback"] }),
      ]);
    },
  });

  // Update
  const updateMut = useMutation({
    mutationFn: (args: { id: string; patch: { rating?: number; comment?: string; display_name?: string | null } }) =>
      updateFeedback(args.id, args.patch),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feedback_public"] }),
        qc.invalidateQueries({ queryKey: ["my-feedback"] }),
      ]);
    },
  });

  // Delete
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feedback_public"] }),
        qc.invalidateQueries({ queryKey: ["my-feedback"] }),
      ]);
    },
  });

  // New review form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      display_name: user?.user_metadata?.name ?? "",
    },
  });
  const newRating = watch("rating");

  const onSubmitNew = async (vals: FeedbackForm) => {
    await createMut.mutateAsync(vals);
    reset({
      rating: 5,
      comment: "",
      display_name: user?.user_metadata?.name ?? "",
    });
  };

  // Edit state
  const [editing, setEditing] = useState<FeedbackRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackRow | null>(null);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-6xl">
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Share your experience with PawTrace. Reviews appear publicly after moderation.
        </p>
      </div>

      <Tabs defaultValue="write">
        <TabsList className="grid grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="write">Write a review</TabsTrigger>
          <TabsTrigger value="mine">My reviews</TabsTrigger>
          <TabsTrigger value="public">Public reviews</TabsTrigger>
        </TabsList>

        {/* WRITE */}
        <TabsContent value="write" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave a review</CardTitle>
              <CardDescription>Rate PawTrace and add a short comment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {createMut.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(createMut.error as any)?.message ?? "Failed to submit feedback"}
                  </AlertDescription>
                </Alert>
              )}
              {createMut.isSuccess && (
                <Alert>
                  <AlertDescription>
                    Thanks! Your review was submitted and will be visible after approval.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label>Rating</Label>
                <StarRating
                  value={newRating}
                  onChange={(v) => setValue("rating", v, { shouldValidate: true })}
                  disabled={isSubmitting || createMut.isPending}
                />
                {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_name">Display name (optional)</Label>
                <Input id="display_name" placeholder="e.g., Collin" {...register("display_name")} />
                {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="What do you like? What should we improve?"
                  rows={5}
                  {...register("comment")}
                />
                {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubmit(onSubmitNew)}
                disabled={isSubmitting || createMut.isPending}
                className="w-full"
              >
                {isSubmitting || createMut.isPending ? "Submitting…" : "Submit review"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* MINE */}
        <TabsContent value="mine" className="mt-6">
          <div className="space-y-4">
            {loadingMine ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-1/3 mb-3" />
                    <div className="flex gap-2 mb-3">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <Skeleton key={j} className="h-5 w-5 rounded" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </Card>
                ))}
              </div>
            ) : myReviews && myReviews.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {myReviews.map((r) => (
                  <Card key={r.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/40"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-sm">{r.comment}</div>
                    {r.display_name && (
                      <div className="text-xs text-muted-foreground">— {r.display_name}</div>
                    )}

                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>

                      <AlertDialog open={!!deleteTarget && deleteTarget.id === r.id} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove your review. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={deleteMut.isPending}
                              onClick={async () => {
                                await deleteMut.mutateAsync(r.id);
                                setDeleteTarget(null);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteMut.isPending ? "Deleting…" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <CardDescription>You haven’t written any reviews yet.</CardDescription>
              </Card>
            )}
          </div>

          {/* Edit modal */}
          {editing && (
            <EditReviewDialog
              open={!!editing}
              onOpenChange={(v) => !v && setEditing(null)}
              review={editing}
              saving={updateMut.isPending}
              onSave={async (patch) => {
                await updateMut.mutateAsync({ id: editing.id, patch });
                setEditing(null);
              }}
            />
          )}
        </TabsContent>

        {/* PUBLIC */}
        <TabsContent value="public" className="mt-6">
          {loadingPublic ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  <div className="flex gap-2 mb-3">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <Skeleton key={j} className="h-5 w-5 rounded" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : publicReviews && publicReviews.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicReviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/40"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">{r.comment}</div>
                  {r.display_name && (
                    <div className="mt-2 text-xs text-muted-foreground">— {r.display_name}</div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <CardDescription>No public reviews yet. Be the first to share your experience!</CardDescription>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

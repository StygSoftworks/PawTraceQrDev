// src/routes/Reviews.tsx
import { useQuery } from "@tanstack/react-query";
import { listPublicFeedback } from "@/lib/feedback";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export default function Reviews() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feedback_public", 100],
    queryFn: () => listPublicFeedback(100),
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">What people say</h1>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((__, j) => (
                  <Skeleton key={j} className="h-5 w-5 rounded" />
                ))}
              </div>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="text-sm text-destructive">Failed to load reviews.</div>
      ) : data && data.length ? (
        <div className="space-y-4">
          {data.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/40"}`}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <CardTitle className="text-base">{r.display_name || "Anonymous"}</CardTitle>
              <CardDescription className="mt-1">{r.comment}</CardDescription>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <CardDescription>No reviews yet.</CardDescription>
        </Card>
      )}
    </div>
  );
}

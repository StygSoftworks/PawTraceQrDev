import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { getUserTagsSummary, type UserTag } from "@/lib/claim-tag";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, PawPrint, ShoppingBag, Link as LinkIcon, Unlink, ExternalLink } from "lucide-react";

export default function Billing() {
  const { user } = useAuth();

  const { data: tags, isLoading } = useQuery({
    queryKey: ["user-tags", user?.id],
    queryFn: () => getUserTagsSummary(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const assignedTags = tags?.filter((t) => t.is_assigned) ?? [];
  const unassignedTags = tags?.filter((t) => !t.is_assigned) ?? [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">My Tags</h1>
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to view your tags.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            My Tags
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your PawTrace tags
          </p>
        </div>
        <Button asChild className="gap-2 transition-all hover:scale-105">
          <Link to="/pricing">
            <ShoppingBag className="h-4 w-4" />
            Buy More Tags
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !tags || tags.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Tag className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">No tags yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Purchase a digital tag or scan a physical tag to get started.
              </p>
            </div>
            <Button asChild className="gap-2 mt-4">
              <Link to="/pricing">
                <ShoppingBag className="h-4 w-4" />
                Get Your First Tag
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <SummaryBar total={tags.length} assigned={assignedTags.length} unassigned={unassignedTags.length} />

          {unassignedTags.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Unlink className="h-4 w-4 text-muted-foreground" />
                Unassigned Tags
                <Badge variant="secondary" className="ml-1">{unassignedTags.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {unassignedTags.map((tag) => (
                  <UnassignedTagCard key={tag.qr_id} tag={tag} />
                ))}
              </div>
            </div>
          )}

          {assignedTags.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                Assigned Tags
                <Badge variant="secondary" className="ml-1">{assignedTags.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {assignedTags.map((tag) => (
                  <AssignedTagCard key={tag.qr_id} tag={tag} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ total, assigned, unassigned }: { total: number; assigned: number; unassigned: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Tags</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{assigned}</p>
          <p className="text-xs text-muted-foreground">Assigned</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{unassigned}</p>
          <p className="text-xs text-muted-foreground">Unassigned</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignedTagCard({ tag }: { tag: UserTag }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
            <PawPrint className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{tag.assigned_pet_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{tag.short_id}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="default" className="text-xs gap-1">
              <LinkIcon className="h-3 w-3" />
              Linked
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {tag.tag_type}
            </Badge>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
            <Link to={`/p/${tag.short_id}`}>
              <ExternalLink className="h-3 w-3" />
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UnassignedTagCard({ tag }: { tag: UserTag }) {
  return (
    <Card className="transition-all hover:shadow-md border-amber-200/50 dark:border-amber-800/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
            <Tag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Available Tag</p>
            <p className="text-xs text-muted-foreground font-mono">{tag.short_id}</p>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <Unlink className="h-3 w-3" />
            Unassigned
          </Badge>
        </div>
        <div className="mt-3 flex justify-end">
          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link to="/dashboard">
              Assign to Pet
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

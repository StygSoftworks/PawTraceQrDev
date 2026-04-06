import { useQuery } from "@tanstack/react-query";
import { listRecentScans } from "@/lib/analytics";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { User } from "lucide-react";

export function RecentActivityTable({ limit = 100 }: { limit?: number }) {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["scan_events", ownerId, limit],
    queryFn: () => (ownerId ? listRecentScans(ownerId, limit) : Promise.resolve([])),
    enabled: !!ownerId,
    staleTime: 30_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Scan Events</CardTitle>
        <CardDescription>Last {data?.length ?? 0} of {limit} scans</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : isError ? (
          <div className="text-sm text-destructive">Failed to load scans.</div>
        ) : !data?.length ? (
          <div className="text-sm text-muted-foreground">No scans yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Scanned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(r.scanned_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{r.pet_name}</TableCell>
                    <TableCell>
                      {r.scanner_name ? (
                        <Badge variant="secondary" className="gap-1.5 font-normal">
                          <User className="h-3 w-3" />
                          {r.scanner_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Anonymous</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

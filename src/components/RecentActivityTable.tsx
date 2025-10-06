import { useQuery } from "@tanstack/react-query";
import { listRecentScansByOwner } from "@/lib/analytics";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function RecentActivityTable({ days = 14 }: { days?: number }) {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["scan_events", ownerId, days],
    queryFn: () => (ownerId ? listRecentScansByOwner(ownerId, days) : Promise.resolve([])),
    enabled: !!ownerId,
    staleTime: 30_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Scan Events</CardTitle>
        <CardDescription>Last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : isError ? (
          <div className="text-sm text-destructive">Failed to load scans.</div>
        ) : !data?.length ? (
          <div className="text-sm text-muted-foreground">No scans yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Referrer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(r.scanned_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{r.pet_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.city || r.region || r.country
                      ? [r.city, r.region, r.country].filter(Boolean).join(", ")
                      : <Badge variant="outline">unknown</Badge>}
                  </TableCell>
                  <TableCell className="truncate max-w-[240px] text-muted-foreground">
                    {r.referrer || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

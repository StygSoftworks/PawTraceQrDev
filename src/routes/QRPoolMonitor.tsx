import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { QrCode, AlertTriangle, CheckCircle, RefreshCw, Database } from "lucide-react";
import { getQRPoolStatus } from "@/lib/qr-pool";

export default function QRPoolMonitor() {
  const { data: status, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["qr-pool-status"],
    queryFn: getQRPoolStatus,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Pool Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Pool Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Failed to load QR pool status</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Code Pool Monitor</h1>
          <p className="text-muted-foreground">Manage and monitor the preloaded QR code pool</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {status.needsRefill && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            QR code pool is running low! Only {status.unassignedCount} codes remaining.
            Generate more codes to maintain availability.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status.unassignedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {status.percentageAvailable.toFixed(1)}% of total pool
            </p>
            <Progress value={status.percentageAvailable} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {status.totalCount - status.unassignedCount} assigned to pets
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generation Status</CardTitle>
          <CardDescription>Current short ID generation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Length</p>
              <p className="text-xs text-muted-foreground">
                Generating {status.currentLength}-character codes
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {status.currentLength}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Codes at Current Length</p>
              <p className="text-xs text-muted-foreground">
                Generated since reaching length {status.currentLength}
              </p>
            </div>
            <Badge variant="secondary" className="px-4 py-2">
              {status.codesAtCurrentLength}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Pool Health</p>
              <p className="text-xs text-muted-foreground">
                {status.needsRefill ? "Action required" : "Healthy"}
              </p>
            </div>
            <Badge
              variant={status.needsRefill ? "destructive" : "default"}
              className="gap-2"
            >
              {status.needsRefill ? (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Low
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Good
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate More QR Codes</CardTitle>
          <CardDescription>
            Use the command line to generate additional QR codes when the pool runs low
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground mb-2"># Generate 100 more codes:</p>
            <p>npm run preload-qr 100</p>
          </div>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground mb-2"># Generate 500 codes (default):</p>
            <p>npm run preload-qr</p>
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> QR code generation should be run from your development
              environment with access to the database and storage bucket.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

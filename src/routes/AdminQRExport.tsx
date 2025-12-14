import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  fetchAvailableQrCodes,
  fetchQrCodeByShortId,
  fetchQrPoolStats,
  exportAndDownloadQrCodes,
  type ExportOptions,
  type ExportFormat,
} from "@/lib/admin-qr-export";
import { type PageSize } from "@/lib/pdf-export";
import { makeQrSvgWithText, makeRoundQrSvgWithText } from "@/lib/qr";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Square, Circle, AlertCircle, CheckCircle, FileText } from "lucide-react";

export default function AdminQRExport() {
  const { role, isAdmin, isLoading: roleLoading } = useAdminCheck();
  const [shape, setShape] = useState<"square" | "round">("square");
  const [tagType, setTagType] = useState<"dog" | "cat" | "all">("all");
  const [shortcode, setShortcode] = useState("");
  const [batchSize, setBatchSize] = useState(10);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("svg");
  const [pdfPageSize, setPdfPageSize] = useState<PageSize>("letter");

  const { data: stats } = useQuery({
    queryKey: ["qr-pool-stats"],
    queryFn: fetchQrPoolStats,
    staleTime: 30_000,
    enabled: isAdmin,
  });

  const { data: availableCodes } = useQuery({
    queryKey: ["available-qr-codes", tagType, batchSize],
    queryFn: () => fetchAvailableQrCodes(tagType === "all" ? null : tagType, batchSize, 0),
    staleTime: 30_000,
    enabled: isAdmin && !shortcode,
  });

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      await exportAndDownloadQrCodes(options);
    },
  });

  useEffect(() => {
    async function generatePreview() {
      if (!availableCodes || availableCodes.length === 0) {
        setPreviewSvg(null);
        return;
      }

      const sampleCode = availableCodes[0];
      const qrUrl = `https://www.pawtraceqr.com/p/${sampleCode.short_id}`;
      const displayText = `pawtraceqr.com/p/${sampleCode.short_id}`;

      try {
        let svg: string;
        if (shape === "round") {
          svg = await makeRoundQrSvgWithText(qrUrl, displayText, 256);
        } else {
          svg = await makeQrSvgWithText(qrUrl, displayText, 256);
        }
        setPreviewSvg(svg);
      } catch (error) {
        console.error("Preview generation error:", error);
        setPreviewSvg(null);
      }
    }

    generatePreview();
  }, [shape, availableCodes]);

  const handleExportSingle = async () => {
    if (!shortcode) return;

    try {
      const qrCode = await fetchQrCodeByShortId(shortcode);
      if (!qrCode) {
        alert("QR code not found or already assigned");
        return;
      }

      if (qrCode.is_assigned) {
        alert("This QR code is already assigned to a pet");
        return;
      }

      await exportMutation.mutateAsync({
        shape,
        tag_type: qrCode.tag_type as "dog" | "cat",
        shortcodes: [shortcode],
        format: exportFormat,
        pdfPageSize,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Export failed: ${message}`);
    }
  };

  const handleExportBatch = async () => {
    try {
      await exportMutation.mutateAsync({
        shape,
        tag_type: tagType === "all" ? null : tagType,
        limit: batchSize,
        format: exportFormat,
        pdfPageSize,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Export failed: ${message}`);
    }
  };

  if (roleLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-7xl">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only accessible to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">QR Code Export</h1>
          <p className="text-muted-foreground">Export available QR codes for manufacturing</p>
        </div>
        <Badge variant="default">{role}</Badge>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Dog Tags Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unassigned_dog_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_dog_count} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cat Tags Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unassigned_cat_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_cat_count} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.unassigned_dog_count + stats.unassigned_cat_count}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for export
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.assigned_dog_count + stats.assigned_cat_count}
              </div>
              <p className="text-xs text-muted-foreground">
                In use by pets
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>Configure QR code export parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-2">
                  <Button
                    variant={exportFormat === "svg" ? "default" : "outline"}
                    onClick={() => setExportFormat("svg")}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    SVG (ZIP)
                  </Button>
                  <Button
                    variant={exportFormat === "pdf" ? "default" : "outline"}
                    onClick={() => setExportFormat("pdf")}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shape</Label>
                <div className="flex gap-2">
                  <Button
                    variant={shape === "square" ? "default" : "outline"}
                    onClick={() => setShape("square")}
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Square
                  </Button>
                  <Button
                    variant={shape === "round" ? "default" : "outline"}
                    onClick={() => setShape("round")}
                    className="flex-1"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Circle
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag-type">Tag Type</Label>
                <Select value={tagType} onValueChange={(val) => setTagType(val as any)}>
                  <SelectTrigger id="tag-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dog">Dog Tags Only</SelectItem>
                    <SelectItem value="cat">Cat Tags Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-size">Batch Size</Label>
                <Select
                  value={String(batchSize)}
                  onValueChange={(val) => setBatchSize(Number(val))}
                >
                  <SelectTrigger id="batch-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 codes</SelectItem>
                    <SelectItem value="25">25 codes</SelectItem>
                    <SelectItem value="50">50 codes</SelectItem>
                    <SelectItem value="200">200 codes</SelectItem>
                    <SelectItem value="100">100 codes</SelectItem>
                    <SelectItem value="500">500 codes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportFormat === "pdf" && (
                <div className="space-y-2">
                  <Label htmlFor="pdf-page-size">PDF Page Size</Label>
                  <Select
                    value={pdfPageSize}
                    onValueChange={(val) => setPdfPageSize(val as PageSize)}
                  >
                    <SelectTrigger id="pdf-page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                      <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleExportBatch}
                  disabled={!availableCodes || availableCodes.length === 0 || exportMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportMutation.isPending ? "Exporting..." : `Export ${availableCodes?.length || 0} Codes`}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Single Code</CardTitle>
              <CardDescription>Export a specific QR code by shortcode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shortcode">Shortcode</Label>
                <Input
                  id="shortcode"
                  placeholder="Enter shortcode (e.g., abc123)"
                  value={shortcode}
                  onChange={(e) => setShortcode(e.target.value)}
                />
              </div>

              <Button
                onClick={handleExportSingle}
                disabled={!shortcode || exportMutation.isPending}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Single Code
              </Button>
            </CardContent>
          </Card>

          {exportMutation.isSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                QR codes exported successfully! Check your downloads folder.
              </AlertDescription>
            </Alert>
          )}

          {exportMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Export failed: {exportMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Sample QR code with text label</CardDescription>
            </CardHeader>
            <CardContent>
              {previewSvg ? (
                <div
                  className="w-full flex items-center justify-center p-4 bg-gray-50 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg text-muted-foreground">
                  No preview available
                </div>
              )}
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Shape:</strong> {shape === "square" ? "Square" : "Circle"}
                </p>
                <p>
                  <strong>Text Position:</strong> {shape === "square" ? "Flat below QR code" : "Curved along bottom"}
                </p>
                <p>
                  <strong>Format:</strong> {exportFormat === "pdf" ? `PDF ZIP (${pdfPageSize.toUpperCase()})` : "SVG ZIP (Illustrator compatible)"}
                </p>
                <p>
                  <strong>Files:</strong> {exportFormat === "pdf" ? "Individual PDF per QR code" : "Individual SVG per QR code"}
                </p>
                <p>
                  <strong>Naming:</strong> {tagType === "all" ? "dog/cat" : tagType}-shortcode.{exportFormat === "pdf" ? "pdf" : "svg"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Copy, Download, RefreshCw, Square, Circle, FileText } from "lucide-react";
import { makeQrSvgWithText, makeRoundQrSvgWithText, type QRShape } from "@/lib/qr";
import type { PageSize } from "@/lib/pdf-export";
import type { PetRow } from "@/lib/pets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QRCodeDialogProps {
  pet: PetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
}

const PNG_SIZES = [
  { label: "Small (256px)", value: "256" },
  { label: "Medium (512px)", value: "512" },
  { label: "Large (1024px)", value: "1024" },
  { label: "Extra Large (2048px)", value: "2048" },
];

const PDF_SIZES = [
  { label: "Letter (8.5 × 11 in)", value: "letter" },
  { label: "A4 (210 × 297 mm)", value: "a4" },
];

export function QRCodeDialog({ pet, open, onOpenChange }: QRCodeDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [svgPreview, setSvgPreview] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("512");
  const [qrShape, setQrShape] = useState<QRShape>("square");
  const [pdfPageSize, setPdfPageSize] = useState<PageSize>("letter");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (open && pet?.short_id) {
      setIsGenerating(true);
      const qrTarget = `https://www.pawtraceqr.com/p/${pet.short_id}`;
      const displayText = `pawtraceqr.com/p/${pet.short_id}`;

      const generateFn = qrShape === "round" ? makeRoundQrSvgWithText : makeQrSvgWithText;

      generateFn(qrTarget, displayText, 512, false)
        .then((svgStr) => {
          const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgStr)}`;
          setSvgPreview(svgDataUrl);
        })
        .catch(() => {
          setSvgPreview(null);
        })
        .finally(() => setIsGenerating(false));
    } else {
      setSvgPreview(null);
    }
  }, [open, pet?.short_id, qrShape]);

  const publicPageUrl = pet?.short_id ? `https://www.pawtraceqr.com/p/${pet.short_id}` : null;

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      alert("Failed to copy");
    }
  };

  const downloadQRPng = async (size: string) => {
    if (!pet?.short_id) return;
    try {
      const qrTarget = `https://www.pawtraceqr.com/p/${pet.short_id}`;
      const displayText = `pawtraceqr.com/p/${pet.short_id}`;
      const sizeNum = parseInt(size);

      const generateFn = qrShape === "round" ? makeRoundQrSvgWithText : makeQrSvgWithText;
      const svgString = await generateFn(qrTarget, displayText, sizeNum, false);

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load SVG"));
        img.src = svgUrl;
      });

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const svgElement = svgDoc.documentElement;
      const svgWidth = parseFloat(svgElement.getAttribute("width") || String(sizeNum));
      const svgHeight = parseFloat(svgElement.getAttribute("height") || String(sizeNum));
      const scale = sizeNum / Math.max(svgWidth, svgHeight);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(svgWidth * scale);
      canvas.height = Math.round(svgHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(svgUrl);

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${pet.name}-qr-${qrShape}-${size}px.png`;
      a.click();
    } catch (e) {
      alert("Failed to generate PNG");
    }
  };

  const downloadQRSvg = async () => {
    if (!pet?.short_id) return;
    try {
      const qrTarget = `https://www.pawtraceqr.com/p/${pet.short_id}`;
      const displayText = `pawtraceqr.com/p/${pet.short_id}`;
      const generateFn = qrShape === "round" ? makeRoundQrSvgWithText : makeQrSvgWithText;
      const svgString = await generateFn(qrTarget, displayText);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pet.name}-qr-${qrShape}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to generate SVG");
    }
  };

  const downloadQRPdf = async () => {
    if (!pet?.short_id) return;
    setIsExportingPdf(true);
    try {
      const qrTarget = `https://www.pawtraceqr.com/p/${pet.short_id}`;
      const displayText = `pawtraceqr.com/p/${pet.short_id}`;
      const generateFn = qrShape === "round" ? makeRoundQrSvgWithText : makeQrSvgWithText;
      const svgString = await generateFn(qrTarget, displayText);

      const { svgStringToPdf, downloadPdfBlob } = await import("@/lib/pdf-export");
      const pdfBlob = await svgStringToPdf(svgString, {
        pageSize: pdfPageSize,
        orientation: "portrait",
        title: `${pet.name} QR Code`,
        author: "PawTrace QR",
      });

      const timestamp = new Date().toISOString().split('T')[0];
      downloadPdfBlob(pdfBlob, `${pet.name}-qr-${qrShape}-${timestamp}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
      alert("Failed to generate PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">
                QR Code {pet ? `– ${pet.name}` : ""}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Scan to open the public pet page
                {pet && (
                  <span className="block mt-1 font-medium">
                    Physical Tag: {pet.tag_type === 'dog' ? 'Dog Size (Larger)' : 'Cat Size (Smaller)'}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-full space-y-2">
            <Label className="text-sm font-semibold text-foreground">QR Code Shape</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={qrShape === "square" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setQrShape("square")}
              >
                <Square className="h-4 w-4" />
                Square
              </Button>
              <Button
                type="button"
                variant={qrShape === "round" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setQrShape("round")}
              >
                <Circle className="h-4 w-4" />
                Round
              </Button>
            </div>
            {qrShape === "round" && (
              <p className="text-xs text-muted-foreground">
                Perfect for round metallic tags. Uses high error correction for reliable scanning.
              </p>
            )}
          </div>

          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating QR code…
            </div>
          ) : svgPreview ? (
            <>
              <div className={`p-8 bg-white dark:bg-white border-4 border-primary shadow-lg ${
                qrShape === "round" ? "rounded-full" : "rounded-md"
              }`}>
                <img
                  src={svgPreview}
                  alt="QR code"
                  className="h-64 w-64 object-contain"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>
              <div className="w-full space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Public Page URL</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={publicPageUrl ?? ""}
                      className="text-xs bg-background text-foreground border-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(publicPageUrl)}
                      className="flex-shrink-0"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Download Options</Label>

                  <Button
                    type="button"
                    onClick={downloadQRSvg}
                    variant="outline"
                    className="w-full gap-2 border-2"
                  >
                    <Download className="h-4 w-4" />
                    Download SVG (Illustrator Compatible)
                  </Button>

                  <div className="flex gap-2">
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PNG_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => downloadQRPng(selectedSize)}
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Select value={pdfPageSize} onValueChange={(val) => setPdfPageSize(val as PageSize)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PDF_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={downloadQRPdf}
                      disabled={isExportingPdf}
                      variant="outline"
                      className="gap-2 border-2"
                    >
                      <FileText className="h-4 w-4" />
                      {isExportingPdf ? "Generating..." : "Download PDF"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8">
              No QR code available
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-2"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

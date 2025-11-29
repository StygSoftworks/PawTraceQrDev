// src/components/QRCodeDialog.tsx
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
import { QrCode, Copy, Download, RefreshCw } from "lucide-react";
import { makeQrSvgString } from "@/lib/qr";
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

export function QRCodeDialog({ pet, open, onOpenChange }: QRCodeDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [svgPreview, setSvgPreview] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("512");

  useEffect(() => {
    if (open && pet?.short_id) {
      setIsGenerating(true);
      const qrTarget = `https://www.pawtraceqr.com/p/${pet.short_id}`;

      makeQrSvgString(qrTarget)
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
  }, [open, pet?.short_id]);

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
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(qrTarget, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: parseInt(size),
        color: { dark: "#000000", light: "#ffffff" },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${pet.name}-qr-${size}px.png`;
      a.click();
    } catch (e) {
      alert("Failed to generate PNG");
    }
  };

  const downloadQRSvg = async () => {
    if (!pet?.short_id) return;
    try {
      const qrTarget = `https://www.pawtraceqr.com/p/${pet.short_id}`;
      const svgString = await makeQrSvgString(qrTarget);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pet.name}-qr.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to generate SVG");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#1E1F24] border-2">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#3B3A7A] rounded-xl flex items-center justify-center shadow-md">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">
                QR Code {pet ? `– ${pet.name}` : ""}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Scan to open the public pet page
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating QR code…
            </div>
          ) : svgPreview ? (
            <>
              <div className="p-8 bg-white rounded-md border-4 border-[#3B3A7A] shadow-lg">
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
                    Download SVG (Vector)
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
                      className="gap-2 bg-[#3B3A7A] hover:bg-[#3B3A7A]/90 text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
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

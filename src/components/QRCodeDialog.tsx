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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QrCode, Copy, Download, RefreshCw } from "lucide-react";
import { makeQrDataUrl, makeQrSvgString, getPublicPetUrl } from "@/lib/qr";
import type { PetRow } from "@/lib/pets";

interface QRCodeDialogProps {
  pet: PetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
}

export function QRCodeDialog({ pet, open, onOpenChange }: QRCodeDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrPngData, setQrPngData] = useState<string | null>(null);
  const [qrSvgData, setQrSvgData] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "svg">("png");
  const [error, setError] = useState<string | null>(null);

  const shortId = pet?.qr_code?.short_id;
  const publicUrl = shortId ? getPublicPetUrl(shortId) : null;

  useEffect(() => {
    if (open && shortId) {
      generateQRCodes();
    } else {
      setQrPngData(null);
      setQrSvgData(null);
      setError(null);
    }
  }, [open, shortId]);

  const generateQRCodes = async () => {
    if (!shortId) return;

    setIsGenerating(true);
    setError(null);
    try {
      const url = getPublicPetUrl(shortId);
      const [pngData, svgData] = await Promise.all([
        makeQrDataUrl(url),
        makeQrSvgString(url),
      ]);
      setQrPngData(pngData);
      setQrSvgData(svgData);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      alert("Failed to copy");
    }
  };

  const downloadPNG = () => {
    if (!qrPngData || !pet) return;
    const a = document.createElement("a");
    a.href = qrPngData;
    a.download = `${pet.name}-qr.png`;
    a.click();
  };

  const downloadSVG = () => {
    if (!qrSvgData || !pet) return;
    const blob = new Blob([qrSvgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pet.name}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
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
              Generating QR codes…
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 py-8">
              {error}
            </div>
          ) : !shortId ? (
            <div className="text-sm text-muted-foreground py-8">
              No QR code available
            </div>
          ) : (
            <>
              <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as "png" | "svg")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="png">PNG</TabsTrigger>
                  <TabsTrigger value="svg">SVG</TabsTrigger>
                </TabsList>
                <TabsContent value="png" className="mt-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-8 bg-white rounded-md border-4 border-[#3B3A7A] shadow-lg">
                      {qrPngData && (
                        <img
                          src={qrPngData}
                          alt="QR code PNG"
                          className="h-64 w-64 object-contain"
                          style={{ backgroundColor: '#ffffff' }}
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={downloadPNG}
                      disabled={!qrPngData}
                      className="w-full gap-2 bg-[#3B3A7A] hover:bg-[#3B3A7A]/90 text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="svg" className="mt-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-8 bg-white rounded-md border-4 border-[#3B3A7A] shadow-lg">
                      {qrSvgData && (
                        <div
                          className="h-64 w-64 flex items-center justify-center"
                          style={{ backgroundColor: '#ffffff' }}
                          dangerouslySetInnerHTML={{ __html: qrSvgData }}
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={downloadSVG}
                      disabled={!qrSvgData}
                      className="w-full gap-2 bg-[#3B3A7A] hover:bg-[#3B3A7A]/90 text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download SVG
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              {publicUrl && (
                <div className="w-full space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Public Pet Page</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={publicUrl}
                      className="text-xs bg-background text-foreground border-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(publicUrl)}
                      className="flex-shrink-0"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
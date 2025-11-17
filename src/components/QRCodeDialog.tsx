// src/components/QRCodeDialog.tsx
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { generateAndStorePetQr } from "@/lib/qr";
import { supabase } from "@/lib/supabase";
import type { PetRow } from "@/lib/pets";

interface QRCodeDialogProps {
  pet: PetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
}

export function QRCodeDialog({ pet, open, onOpenChange, ownerId }: QRCodeDialogProps) {
  const qc = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(pet?.qr_code?.qr_url ?? null);

  // Generate QR if missing
  const handleGenerate = async () => {
    if (!pet || qrUrl || !pet.qr_code?.short_id) return;

    setIsGenerating(true);
    try {
      const newQrUrl = await generateAndStorePetQr(ownerId, pet.qr_code.short_id);
      await supabase
        .from("qr_codes")
        .update({ qr_url: newQrUrl })
        .eq("id", pet.qr_code.id);
      setQrUrl(newQrUrl);
      await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
    } catch (e: any) {
      alert(e?.message ?? "Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on open if missing
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && pet && !pet.qr_code?.qr_url && !qrUrl) {
      handleGenerate();
    }
    onOpenChange(newOpen);
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

  const downloadQR = (url?: string | null) => {
    if (!url || !pet) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pet.name}-qr.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const currentQrUrl = qrUrl || pet?.qr_code?.qr_url;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          ) : currentQrUrl ? (
            <>
              <div className="p-8 bg-white rounded-md border-4 border-[#3B3A7A] shadow-lg">
                <img
                  src={currentQrUrl}
                  alt="QR code"
                  className="h-64 w-64 object-contain"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>
              <div className="w-full space-y-2">
                <Label className="text-sm font-semibold text-foreground">QR Code URL</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={currentQrUrl} 
                    className="text-xs bg-background text-foreground border-2" 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(currentQrUrl)}
                    className="flex-shrink-0"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={() => downloadQR(currentQrUrl)}
                  className="w-full gap-2 bg-[#3B3A7A] hover:bg-[#3B3A7A]/90 text-white"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
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
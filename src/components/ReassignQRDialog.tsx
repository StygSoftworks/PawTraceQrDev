import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Dog,
  Cat,
  Loader2,
  PawPrint,
  QrCode,
  Search,
} from "lucide-react";
import { lookupQRCode, reassignPetQRCode, type QRCodeLookupResult, type AdminPetRow } from "@/lib/admin";

interface ReassignQRDialogProps {
  pet: AdminPetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReassigned: () => void;
}

export function ReassignQRDialog({ pet, open, onOpenChange, onReassigned }: ReassignQRDialogProps) {
  const [newShortId, setNewShortId] = useState("");
  const [newTagType, setNewTagType] = useState<"dog" | "cat">("dog");
  const [lookupResult, setLookupResult] = useState<QRCodeLookupResult | null | "not_found" | "loading">(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (open && pet) {
      setNewShortId("");
      setNewTagType(pet.tag_type);
      setLookupResult(null);
      setLookupError(null);
      setConfirmChecked(false);
    }
  }, [open, pet]);

  const debouncedLookup = useCallback(
    debounce(async (shortId: string) => {
      if (!shortId.trim()) {
        setLookupResult(null);
        setLookupError(null);
        return;
      }
      setLookupResult("loading");
      setLookupError(null);
      try {
        const result = await lookupQRCode(shortId.trim());
        if (result) {
          setLookupResult(result);
          setNewTagType(result.tag_type);
        } else {
          setLookupResult("not_found");
        }
      } catch (e: unknown) {
        setLookupError(e instanceof Error ? e.message : "Failed to lookup QR code");
        setLookupResult(null);
      }
    }, 400),
    []
  );

  useEffect(() => {
    debouncedLookup(newShortId);
  }, [newShortId, debouncedLookup]);

  const handleSubmit = async () => {
    if (!pet || !newShortId.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await reassignPetQRCode(pet.pet_id, newShortId.trim(), newTagType);
      if (result.success) {
        onReassigned();
        onOpenChange(false);
      } else {
        setLookupError(result.message);
      }
    } catch (e: unknown) {
      setLookupError(e instanceof Error ? e.message : "Failed to reassign QR code");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pet) return null;

  const isAssignedToOther = lookupResult && typeof lookupResult === "object" && lookupResult.pet_id && lookupResult.pet_id !== pet.pet_id;
  const isAssignedToSamePet = lookupResult && typeof lookupResult === "object" && lookupResult.pet_id === pet.pet_id;
  const isAvailable = lookupResult && typeof lookupResult === "object" && !lookupResult.pet_id;
  const isLoading = lookupResult === "loading";
  const isNotFound = lookupResult === "not_found";
  const canSubmit = newShortId.trim() &&
    typeof lookupResult === "object" &&
    lookupResult !== null &&
    !isAssignedToSamePet &&
    (!isAssignedToOther || confirmChecked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Reassign QR Code
          </DialogTitle>
          <DialogDescription>
            Change the QR code assigned to this pet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              {pet.photo_url ? (
                <AvatarImage src={pet.photo_url} alt={pet.pet_name} />
              ) : (
                <AvatarFallback>
                  <PawPrint className="h-6 w-6" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{pet.pet_name}</div>
              <div className="text-sm text-muted-foreground">
                Current ID: <span className="font-mono">{pet.short_id}</span>
              </div>
              <Badge variant={pet.tag_type === "dog" ? "default" : "secondary"} className="mt-1">
                {pet.tag_type === "dog" ? <Dog className="h-3 w-3 mr-1" /> : <Cat className="h-3 w-3 mr-1" />}
                {pet.tag_type === "dog" ? "Dog Tag" : "Cat Tag"}
              </Badge>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-short-id">New Short ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-short-id"
                  value={newShortId}
                  onChange={(e) => setNewShortId(e.target.value)}
                  placeholder="Enter short ID to assign..."
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Looking up QR code...
              </div>
            )}

            {isNotFound && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No QR code with ID "{newShortId}" exists in the system.
                </AlertDescription>
              </Alert>
            )}

            {isAvailable && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  This QR code is available and not assigned to any pet.
                </AlertDescription>
              </Alert>
            )}

            {isAssignedToSamePet && (
              <Alert>
                <AlertDescription>
                  This is the pet's current QR code.
                </AlertDescription>
              </Alert>
            )}

            {isAssignedToOther && lookupResult && typeof lookupResult === "object" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">This QR code is currently assigned to another pet!</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {lookupResult.photo_url ? (
                          <AvatarImage src={lookupResult.photo_url} alt={lookupResult.pet_name ?? ""} />
                        ) : (
                          <AvatarFallback>
                            <PawPrint className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{lookupResult.pet_name}</div>
                        <div className="text-xs">{lookupResult.owner_email}</div>
                      </div>
                    </div>
                    <p className="text-sm mt-2">
                      <strong>Warning:</strong> The above pet will be left without a QR code.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {lookupResult && typeof lookupResult === "object" && !isAssignedToSamePet && (
              <div className="space-y-2">
                <Label htmlFor="tag-type">Tag Type</Label>
                <Select value={newTagType} onValueChange={(v: "dog" | "cat") => setNewTagType(v)} disabled={isSubmitting}>
                  <SelectTrigger id="tag-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">
                      <div className="flex items-center gap-2">
                        <Dog className="h-4 w-4" />
                        Dog Tag (larger)
                      </div>
                    </SelectItem>
                    <SelectItem value="cat">
                      <div className="flex items-center gap-2">
                        <Cat className="h-4 w-4" />
                        Cat Tag (smaller)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {lookupResult.tag_type !== newTagType && (
                  <p className="text-xs text-amber-600">
                    Tag type will change from {lookupResult.tag_type} to {newTagType}.
                  </p>
                )}
              </div>
            )}

            {isAssignedToOther && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Switch
                  id="confirm-reassign"
                  checked={confirmChecked}
                  onCheckedChange={setConfirmChecked}
                  disabled={isSubmitting}
                />
                <Label htmlFor="confirm-reassign" className="text-sm cursor-pointer">
                  I understand the other pet will lose its QR code
                </Label>
              </div>
            )}

            {lookupError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{lookupError}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reassigning...
              </>
            ) : (
              "Reassign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

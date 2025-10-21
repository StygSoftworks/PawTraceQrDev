import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface LocationShareDialogProps {
  petId: string;
  ownerId: string;
  petName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationShareDialog({
  petId,
  ownerId,
  petName,
  open,
  onOpenChange,
}: LocationShareDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [finderNote, setFinderNote] = useState("");
  const [finderContact, setFinderContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShareLocation = async () => {
    setIsSharing(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const { error: insertError } = await supabase
        .from("location_shares")
        .insert({
          pet_id: petId,
          owner_id: ownerId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          finder_note: finderNote.trim() || null,
          finder_contact: finderContact.trim() || null,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFinderNote("");
        setFinderContact("");
      }, 2000);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access was denied. Please enable location permissions.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to share location");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Share Your Location
          </DialogTitle>
          <DialogDescription>
            Help reunite {petName} with their owner by sharing where you found them.
            Your location will be sent securely to the pet owner.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Location shared successfully! The owner has been notified.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finder-note">
                Message (Optional)
              </Label>
              <Textarea
                id="finder-note"
                placeholder="e.g., 'Found near the park on Main Street' or 'Your pet is safe with me'"
                value={finderNote}
                onChange={(e) => setFinderNote(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finder-contact">
                Your Contact Info (Optional)
              </Label>
              <Input
                id="finder-contact"
                type="text"
                placeholder="Phone number or email"
                value={finderContact}
                onChange={(e) => setFinderContact(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Share your contact info so the owner can reach you directly
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Privacy Notice:</strong> Your precise GPS location will be shared
                with the pet owner. Make sure you're comfortable sharing your current location.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleShareLocation}
            disabled={isSharing || success}
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Share Location
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

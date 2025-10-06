import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, TriangleAlert as AlertTriangle } from "lucide-react";

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-[#FFD65A] border-[#FFD65A] text-[#1E1F24]">
      <AlertTriangle className="h-4 w-4 text-[#1E1F24]" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-semibold text-sm">Demo Site:</span>
          <span className="text-sm">
            This is a demonstration environment. All data may be reset periodically.
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 shrink-0 hover:bg-[#1E1F24]/10 text-[#1E1F24]"
          aria-label="Dismiss demo banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}

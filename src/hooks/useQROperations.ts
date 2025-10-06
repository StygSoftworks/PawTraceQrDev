// src/hooks/useQROperations.ts
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ensureQrForAll } from "@/lib/pets";

export function useQROperations(ownerId: string | null) {
  const qc = useQueryClient();
  const [isBackfilling, setIsBackfilling] = useState(false);

  const backfillAllQR = async () => {
    if (!ownerId) return;
    
    setIsBackfilling(true);
    try {
      await ensureQrForAll(ownerId);
      await qc.invalidateQueries({ queryKey: ["pets", ownerId] });
      alert("QR backfill completed successfully");
    } catch (e: any) {
      alert(e?.message ?? "Backfill failed");
    } finally {
      setIsBackfilling(false);
    }
  };

  return {
    backfillAllQR,
    isBackfilling,
  };
}
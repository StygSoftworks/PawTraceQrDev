import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { countScansForPet } from "@/lib/analytics";

export function PetScanBadge({
  petId,
  label = "Scans",
}: {
  petId: string;
  label?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pet_scan_count", petId],
    queryFn: () => countScansForPet(petId),
    staleTime: 30_000,
    enabled: !!petId,
  });

  if (!petId) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
        <Eye className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : isError ? "\u2014" : `${data} view${data === 1 ? '' : 's'}`}
        </p>
      </div>
    </div>
  );
}

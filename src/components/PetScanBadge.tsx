import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { countScansForPets } from "@/lib/analytics";

export function PetScanBadge({
  petId,
  days = 30,
  label = "Scans",
}: {
  petId: string;
  days?: number;
  label?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pet_scan_count", petId, days],
    queryFn: () => countScansForPets(petId, days),
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
        <p className="text-sm font-medium">{label} (Last {days} days)</p>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : isError ? "—" : `${data} view${data === 1 ? '' : 's'}`}
        </p>
      </div>
    </div>
  );
}

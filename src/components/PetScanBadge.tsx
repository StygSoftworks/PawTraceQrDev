import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
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
  if (isLoading || isError) return <Badge variant="outline">{label}: —</Badge>;

  return (
    <Badge variant="secondary">
      {label} ({days}d): {data}
    </Badge>
  );
}

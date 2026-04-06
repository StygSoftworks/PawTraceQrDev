import { supabase } from "@/lib/supabase";

export type ScanRow = {
  id: string;
  pet_id: string;
  short_id: string;
  scanned_at: string;
  referrer: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  pet_name: string;
  scanned_by: string | null;
  scanner_name: string | null;
};

export async function listRecentScans(ownerId: string, limit = 100): Promise<ScanRow[]> {
  const { data, error } = await supabase
    .from("scan_events")
    .select(`
      id, pet_id, short_id, scanned_at, referrer, city, region, country, lat, lng, scanned_by,
      pets!inner ( id, name, owner_id )
    `)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []).filter((r: any) => r.pets?.owner_id === ownerId);

  const scannerIds = [
    ...new Set(
      rows
        .map((r: any) => r.scanned_by)
        .filter((id: string | null): id is string => id !== null)
    ),
  ];

  let scannerNames: Record<string, string> = {};
  if (scannerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", scannerIds);
    if (profiles) {
      scannerNames = Object.fromEntries(
        profiles.map((p) => [p.id, p.display_name || "User"])
      );
    }
  }

  return rows.map((r: any) => ({
    id: r.id,
    pet_id: r.pet_id,
    short_id: r.short_id,
    scanned_at: r.scanned_at,
    referrer: r.referrer,
    city: r.city,
    region: r.region,
    country: r.country,
    lat: r.lat,
    lng: r.lng,
    pet_name: r.pets.name,
    scanned_by: r.scanned_by,
    scanner_name: r.scanned_by ? (scannerNames[r.scanned_by] || "Logged-in user") : null,
  }));
}

export async function countScansForPet(petId: string): Promise<number> {
  const { data, error } = await supabase.rpc("count_scans_for_pet", {
    p_pet_id: petId,
  });

  if (error) throw error;
  return (data as number) ?? 0;
}

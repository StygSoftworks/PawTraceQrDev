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
};

export async function listRecentScansByOwner(ownerId: string, days = 7): Promise<ScanRow[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const { data, error } = await supabase
    .from("scan_events")
    .select(`
      id, pet_id, short_id, scanned_at, referrer, city, region, country, lat, lng,
      pets!inner ( id, name, owner_id )
    `)
    .gte("scanned_at", since)
    .order("scanned_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []).filter((r: any) => r.pets?.owner_id === ownerId);
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
  }));
} 

/** Count scans for ONE pet in the last `days` days (uses count header). */
export async function countScansForPets(petId: string, days = 30): Promise<number> {
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const { error, count } = await supabase
    .from("scan_events")
    .select("id", { count: "exact", head: true }) // head:true = only headers, fast
    .eq("pet_id", petId)
    .gte("scanned_at", since);

  if (error) throw error;
  return count ?? 0;
}

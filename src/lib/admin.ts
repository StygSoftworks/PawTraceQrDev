import { supabase } from "@/lib/supabase";

export type AdminPetRow = {
  pet_id: string;
  pet_name: string;
  species: "dog" | "cat" | "other";
  breed: string | null;
  color: string | null;
  weight: number | null;
  birthdate: string | null;
  microchip_id: string | null;
  description: string | null;
  notes: string | null;
  vaccinations: { rabies?: boolean; rabiesExpires?: string | null } | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  missing: boolean;
  missing_since: string | null;
  qr_url: string | null;
  short_id: string;
  tag_type: "dog" | "cat";
  environment: "indoor" | "outdoor" | "indoor_outdoor";
  paypal_subscription_id: string | null;
  subscription_status: "active" | "inactive" | "expired" | "cancelled" | "pending";
  subscription_activated_at: string | null;
  subscription_expires_at: string | null;
  subscription_plan_id: string | null;
  owner_id: string;
  owner_email: string | null;
  owner_name: string | null;
  owner_role: string | null;
};

export async function getAllPetsAdmin(): Promise<AdminPetRow[]> {
  const { data, error } = await supabase.rpc("get_all_pets_admin");

  if (error) throw error;
  return (data ?? []) as AdminPetRow[];
}

export type QRCodeLookupResult = {
  qr_id: string;
  short_id: string;
  tag_type: "dog" | "cat";
  qr_url: string | null;
  assigned_at: string | null;
  created_at: string;
  pet_id: string | null;
  pet_name: string | null;
  species: string | null;
  photo_url: string | null;
  owner_id: string | null;
  owner_email: string | null;
  owner_name: string | null;
};

export type ReassignResult = {
  success: boolean;
  message: string;
  pet_id: string | null;
  pet_name: string | null;
  new_short_id: string | null;
  new_tag_type: string | null;
  old_short_id: string | null;
  displaced_pet_id: string | null;
  displaced_pet_name: string | null;
};

export async function lookupQRCode(shortId: string): Promise<QRCodeLookupResult | null> {
  const { data, error } = await supabase.rpc("admin_lookup_qr_code", {
    p_short_id: shortId,
  });

  if (error) throw error;

  const results = data as QRCodeLookupResult[] | null;
  if (!results || results.length === 0) return null;
  return results[0];
}

export async function reassignPetQRCode(
  petId: string,
  newShortId: string,
  newTagType?: "dog" | "cat"
): Promise<ReassignResult> {
  const { data, error } = await supabase.rpc("admin_reassign_pet_qr", {
    p_pet_id: petId,
    p_new_short_id: newShortId,
    p_new_tag_type: newTagType ?? null,
  });

  if (error) throw error;

  const results = data as ReassignResult[] | null;
  if (!results || results.length === 0) {
    return {
      success: false,
      message: "No result returned from reassignment",
      pet_id: null,
      pet_name: null,
      new_short_id: null,
      new_tag_type: null,
      old_short_id: null,
      displaced_pet_id: null,
      displaced_pet_name: null,
    };
  }
  return results[0];
}

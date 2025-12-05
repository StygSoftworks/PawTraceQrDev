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

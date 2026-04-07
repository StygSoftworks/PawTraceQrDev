import { supabase } from "@/lib/supabase";

export type AssignTagResult = {
  success: boolean;
  new_short_id: string;
  old_short_id: string | null;
  pet_name: string;
};

export async function assignTagToExistingPet(
  shortId: string,
  petId: string
): Promise<AssignTagResult> {
  const { data, error } = await supabase.rpc("assign_tag_to_existing_pet", {
    p_short_id: shortId,
    p_pet_id: petId,
  });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Assignment failed");

  return data[0] as AssignTagResult;
}

export type UserTag = {
  qr_id: string;
  short_id: string;
  tag_type: string;
  is_assigned: boolean;
  assigned_pet_name: string | null;
  assigned_pet_id: string | null;
  purchased_at: string | null;
  purchase_price: number | null;
};

export async function getUserTagsSummary(
  userId: string
): Promise<UserTag[]> {
  const { data, error } = await supabase.rpc("get_user_tags_summary", {
    p_user_id: userId,
  });

  if (error) throw error;
  return (data ?? []) as UserTag[];
}

export type UnassignedTag = {
  qr_id: string;
  short_id: string;
  qr_url: string | null;
  tag_type: string;
  purchased_at: string | null;
  purchase_price: number | null;
};

export async function getUserUnassignedTags(
  userId: string
): Promise<UnassignedTag[]> {
  const { data, error } = await supabase.rpc("get_user_unassigned_tags", {
    p_user_id: userId,
  });

  if (error) throw error;
  return (data ?? []) as UnassignedTag[];
}

import { supabase } from "@/lib/supabase";

export type PetShare = {
  id: string;
  pet_id: string;
  owner_id: string;
  shared_with_id: string | null;
  shared_with_email: string | null;
  can_edit: boolean;
  status: "pending" | "accepted" | "declined" | "revoked";
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

export type PetShareWithDetails = PetShare & {
  pet_name: string;
  owner_name: string | null;
  owner_email: string | null;
  shared_user_name: string | null;
  shared_user_email: string | null;
};

export type ShareInvitation = {
  id: string;
  pet_id: string;
  pet_name: string;
  owner_name: string | null;
  owner_email: string | null;
  can_edit: boolean;
  created_at: string;
};

export async function sharePetWithUser(
  petId: string,
  email: string,
  canEdit: boolean = false
): Promise<PetShare> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  const { data: existingShare } = await supabase
    .from("pet_shares")
    .select("id, status")
    .eq("pet_id", petId)
    .eq(existingUser ? "shared_with_id" : "shared_with_email", existingUser ? existingUser.id : email.toLowerCase().trim())
    .in("status", ["pending", "accepted"])
    .maybeSingle();

  if (existingShare) {
    throw new Error("This pet is already shared with this user");
  }

  const shareData: Record<string, unknown> = {
    pet_id: petId,
    owner_id: user.id,
    can_edit: canEdit,
    status: existingUser ? "pending" : "pending",
    shared_with_email: email.toLowerCase().trim(),
  };

  if (existingUser) {
    shareData.shared_with_id = existingUser.id;
  }

  const { data, error } = await supabase
    .from("pet_shares")
    .insert(shareData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPetCollaborators(petId: string): Promise<PetShareWithDetails[]> {
  const { data, error } = await supabase
    .from("pet_shares")
    .select(`
      id,
      pet_id,
      owner_id,
      shared_with_id,
      shared_with_email,
      can_edit,
      status,
      created_at,
      accepted_at,
      revoked_at,
      pets!inner(name),
      shared_user:profiles!pet_shares_shared_with_id_fkey(display_name, email)
    `)
    .eq("pet_id", petId)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((share: any) => ({
    ...share,
    pet_name: share.pets?.name || "",
    owner_name: null,
    owner_email: null,
    shared_user_name: share.shared_user?.display_name || null,
    shared_user_email: share.shared_user?.email || share.shared_with_email,
  }));
}

export async function getPendingInvitations(): Promise<ShareInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("pet_shares")
    .select(`
      id,
      pet_id,
      can_edit,
      created_at,
      pets!inner(name),
      owner:profiles!pet_shares_owner_id_fkey(display_name, email)
    `)
    .eq("shared_with_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((share: any) => ({
    id: share.id,
    pet_id: share.pet_id,
    pet_name: share.pets?.name || "",
    owner_name: share.owner?.display_name || null,
    owner_email: share.owner?.email || null,
    can_edit: share.can_edit,
    created_at: share.created_at,
  }));
}

export async function getSharedPets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("pet_shares")
    .select(`
      id,
      can_edit,
      pets!inner(
        id,
        owner_id,
        name,
        species,
        breed,
        color,
        weight,
        birthdate,
        microchip_id,
        description,
        notes,
        vaccinations,
        photo_url,
        created_at,
        updated_at,
        missing,
        missing_since,
        qr_url,
        short_id,
        tag_type,
        environment,
        paypal_subscription_id,
        subscription_status,
        subscription_activated_at,
        subscription_expires_at,
        subscription_plan_id
      ),
      owner:profiles!pet_shares_owner_id_fkey(display_name, email)
    `)
    .eq("shared_with_id", user.id)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((share: any) => ({
    ...share.pets,
    share_id: share.id,
    can_edit: share.can_edit,
    owner_name: share.owner?.display_name || null,
    owner_email: share.owner?.email || null,
    is_shared: true,
  }));
}

export async function acceptPetShare(shareId: string): Promise<boolean> {
  const { error } = await supabase.rpc("accept_pet_share", { p_share_id: shareId });
  if (error) throw error;
  return true;
}

export async function declinePetShare(shareId: string): Promise<boolean> {
  const { error } = await supabase.rpc("decline_pet_share", { p_share_id: shareId });
  if (error) throw error;
  return true;
}

export async function revokePetShare(shareId: string): Promise<boolean> {
  const { error } = await supabase.rpc("revoke_pet_share", { p_share_id: shareId });
  if (error) throw error;
  return true;
}

export async function updateSharePermissions(
  shareId: string,
  canEdit: boolean
): Promise<void> {
  const { error } = await supabase
    .from("pet_shares")
    .update({ can_edit: canEdit })
    .eq("id", shareId);

  if (error) throw error;
}

export async function getShareCount(petId: string): Promise<number> {
  const { count, error } = await supabase
    .from("pet_shares")
    .select("id", { count: "exact", head: true })
    .eq("pet_id", petId)
    .in("status", ["pending", "accepted"]);

  if (error) return 0;
  return count || 0;
}

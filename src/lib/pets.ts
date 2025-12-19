import { supabase } from "@/lib/supabase";
import { generateAndStorePetQr } from "@/lib/qr";


/** Shape you’ll send from the form */
export type PetInsert = {
  owner_id: string;                 // required
  name: string;
  species: "dog" | "cat" | "other";
  breed?: string | null;
  color?: string | null;
  weight?: number | null;
  birthdate?: string | null;        // "YYYY-MM-DD"
  microchip_id?: string | null;
  description?: string | null;
  notes?: string | null;
  vaccinations?: { rabies?: boolean; rabiesExpires?: string } | null;
  photo_url?: string | null;
  environment?: "indoor" | "outdoor" | "indoor_outdoor";
};

export type PetRow = {
  id: string;
  owner_id: string;
  name: string;
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
};

export type PetUpdate = Partial<PetInsert> & { id: string };
/*
export async function createPet(data: PetInsert) {
  const { data: rows, error } = await supabase
    .from("pets")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return rows; // returns inserted pet row
}
*/


export async function createPet(payload: PetInsert) {
  // Determine tag type: dogs get 'dog' tags, everything else gets 'cat' tags
  const tagType = payload.species === 'dog' ? 'dog' : 'cat';

  // 1) Reserve a QR code from the pool with the appropriate tag type
  const { data: qrData, error: qrError } = await supabase
    .rpc("reserve_qr_code", { p_tag_type: tagType });

  if (qrError || !qrData || qrData.length === 0) {
    throw new Error(`No available ${tagType} QR codes in pool. Please contact support.`);
  }

  const reservedQr = qrData[0];

  try {
    // 2) Create the pet with the reserved QR code and short_id
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .insert({
        ...payload,
        qr_code_id: reservedQr.qr_id,
        short_id: reservedQr.qr_short_id,
        qr_url: reservedQr.qr_qr_url
      })
      .select("*")
      .single();

    if (petError) throw petError;

    // 3) Finalize the QR code assignment with the pet_id
    const { error: finalizeError } = await supabase
      .rpc("finalize_qr_assignment", {
        p_qr_id: reservedQr.qr_id,
        p_pet_id: pet.id
      });

    if (finalizeError) {
      console.error("Failed to finalize QR assignment:", finalizeError);
    }

    return pet;
  } catch (error) {
    // Release the QR code back to pool if pet creation fails
    await supabase.rpc("release_qr_code", { p_qr_id: reservedQr.qr_id });
    throw error;
  }
}

export async function updatePet(id: string, patch: Record<string, any>) {

  // 1) Perform the update
  const { error: updErr } = await supabase
    .from("pets")
    .update(patch)
    .eq("id", id);

  if (updErr) throw updErr;

  // 2) Try to read the row back (nice to have)
  const { data, error: selErr } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // If SELECT is blocked by RLS, just return the patched shape
  if (selErr) {
    console.warn("updatePet: select after update blocked by RLS:", selErr?.message);
    return { id, ...patch };
  }

  return data ?? { id, ...patch };
}

//list all the pets for an owner
export async function listPetsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PetRow[];
}

/*
// Convert a data URL to a Blob object
function extFromMime(mime?: string) {
  const m = mime || "image/webp";
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/avif") return "avif";
  if (m === "image/webp") return "webp";
  return m.split("/")[1] || "webp";
}
  */

export async function uploadPetPhoto(ownerId: string, petId: string, blob: Blob) {
  if (!blob || blob.size === 0) throw new Error("Empty image blob");
  const mime = blob.type || "image/webp";
  const ext = mime === "image/jpeg" || mime === "image/jpg" ? "jpg"
           : mime === "image/png" ? "png"
           : mime === "image/avif" ? "avif"
           : "webp";
  
  // Add timestamp for unique filename
  const timestamp = Date.now();
  const path = `${ownerId}/${petId}-${timestamp}.${ext}`;
  
  const { error } = await supabase
    .storage
    .from("pet-photos")
    .upload(path, blob, { contentType: mime, upsert: false }); // Change to false

  if (error) {
    console.error("storage.upload error:", error);
    throw error;
  }

  const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
  return data.publicUrl;
}


/** Delete a pet row by id */
export async function deletePet(id: string) {
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) throw error;
}

/** Best-effort removal of a pet photo from the 'pet-photos' bucket */
export async function deletePetPhotoByUrl(photoUrl?: string | null) {
  if (!photoUrl) return;
  // get path after '/pet-photos/' (works for both public and non-public URLs)
  const idx = photoUrl.indexOf("/pet-photos/");
  if (idx === -1) return;
  const path = photoUrl.substring(idx + "/pet-photos/".length);
  if (!path) return;

  const { error } = await supabase.storage.from("pet-photos").remove([path]);
  if (error) {
    // don't throw: we don't want to block the UI if image removal fails
    console.warn("storage.remove warning:", error.message);
  }
}

export async function ensureQrForAll(ownerId: string) {
  const { data, error } = await supabase
    .from("pets")
    .select("id, qr_url")
    .eq("owner_id", ownerId);
  if (error) throw error;

  for (const p of data ?? []) {
    if (!p.qr_url) {
      const qrUrl = await generateAndStorePetQr(ownerId, p.id);
      const { error: updErr } = await supabase
        .from("pets")
        .update({ qr_url: qrUrl })
        .eq("id", p.id);
      if (updErr) throw updErr;
    }
  }
}

export async function togglePetMissing(petId: string, isMissing: boolean) {
  const { data, error } = await supabase.rpc("toggle_pet_missing", {
    p_pet_id: petId,
    p_is_missing: isMissing,
  });
  if (error) throw error;
  return data;
}

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
};

export type QRCode = {
  id: string;
  short_id: string;
  qr_url: string | null;
  pet_id: string | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
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
  qr_code_id: string | null;
  qr_code?: QRCode;
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
  const { data: pet, error: insertError } = await supabase
    .from("pets")
    .insert(payload)
    .select("*")
    .single();

  if (insertError) throw insertError;

  const { data: qrData, error: qrError } = await supabase
    .rpc("claim_qr_code_for_pet", { p_pet_id: pet.id });

  if (qrError) {
    await supabase.from("pets").delete().eq("id", pet.id);
    throw new Error("No available QR codes in pool. Please contact support.");
  }

  const claimedQr = qrData?.[0];
  if (claimedQr) {
    await supabase
      .from("pets")
      .update({ qr_code_id: claimedQr.qr_id })
      .eq("id", pet.id);
  }

  const { data: fullPet, error: selectError } = await supabase
    .from("pets")
    .select(`
      *,
      qr_code:qr_codes!qr_code_id(*)
    `)
    .eq("id", pet.id)
    .single();

  if (selectError) throw selectError;
  return fullPet;
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
    .select(`
      *,
      qr_code:qr_codes!qr_code_id(*)
    `)
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
    .select(`
      id,
      qr_code_id,
      qr_code:qr_codes!qr_code_id(id, short_id, qr_url)
    `)
    .eq("owner_id", ownerId);
  if (error) throw error;

  for (const p of data ?? []) {
    if (!p.qr_code_id) {
      const { data: qrData, error: qrError } = await supabase
        .rpc("claim_qr_code_for_pet", { p_pet_id: p.id });

      if (qrError) {
        console.error(`Failed to claim QR code for pet ${p.id}:`, qrError);
        continue;
      }

      const claimedQr = qrData?.[0];
      if (claimedQr) {
        await supabase
          .from("pets")
          .update({ qr_code_id: claimedQr.qr_id })
          .eq("id", p.id);
      }
    } else if (p.qr_code && typeof p.qr_code === 'object' && !Array.isArray(p.qr_code)) {
      const qrCode = p.qr_code as QRCode;
      if (!qrCode.qr_url && qrCode.short_id) {
        const qrUrl = await generateAndStorePetQr(ownerId, qrCode.short_id);
        const { error: updErr } = await supabase
          .from("qr_codes")
          .update({ qr_url: qrUrl })
          .eq("id", qrCode.id);
        if (updErr) throw updErr;
      }
    }
  }
}

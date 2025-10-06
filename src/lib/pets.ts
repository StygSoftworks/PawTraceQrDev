import { supabase } from "@/lib/supabase";
import { generateAndStorePetQr } from "@/lib/qr";
import { makeAdaptiveShortId } from "./ids";


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
  let length = 3;
  for (let attempt = 0; attempt < 7; attempt++) {
    const short_id = makeAdaptiveShortId(length);
    const { data, error } = await supabase
      .from("pets")
      .insert({ ...payload, short_id })
      .select("*")
      .single();

    if (!error) return data;

    // unique violation → increase length + retry
    if (error.code === "23505" && error.message.includes("pets_short_id_key")) {
      length++;
      continue;
    }
    throw error;
  }
  throw new Error("Could not generate a unique short id for pet.");
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

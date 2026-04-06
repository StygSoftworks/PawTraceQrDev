import { supabase } from "@/lib/supabase";
import type { PetInsert } from "@/lib/pets";
import { uploadPetPhoto } from "@/lib/pets";

export async function createPetWithSpecificTag(
  payload: PetInsert,
  shortId: string
) {
  const { data: qrData, error: qrError } = await supabase.rpc(
    "claim_specific_qr_code",
    { p_short_id: shortId }
  );

  if (qrError || !qrData || qrData.length === 0) {
    throw new Error(
      "This tag is no longer available. It may have already been claimed."
    );
  }

  const claimedQr = qrData[0];

  try {
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .insert({
        ...payload,
        qr_code_id: claimedQr.qr_id,
        short_id: claimedQr.qr_short_id,
        qr_url: claimedQr.qr_qr_url,
      })
      .select("*")
      .single();

    if (petError) throw petError;

    const { error: finalizeError } = await supabase.rpc(
      "finalize_qr_assignment",
      {
        p_qr_id: claimedQr.qr_id,
        p_pet_id: pet.id,
      }
    );

    if (finalizeError) {
      console.error("Failed to finalize QR assignment:", finalizeError);
    }

    return pet;
  } catch (error) {
    await supabase.rpc("release_qr_code", { p_qr_id: claimedQr.qr_id });
    throw error;
  }
}

export async function createPetWithPhotoAndTag(
  payload: PetInsert,
  shortId: string,
  photoBlob: Blob | null
) {
  const pet = await createPetWithSpecificTag(payload, shortId);

  if (photoBlob && photoBlob.size > 0) {
    const publicUrl = await uploadPetPhoto(
      payload.owner_id,
      pet.id,
      photoBlob
    );
    const { error } = await supabase
      .from("pets")
      .update({ photo_url: publicUrl })
      .eq("id", pet.id);
    if (error) console.error("Failed to update photo:", error);
    return { ...pet, photo_url: publicUrl };
  }

  return pet;
}

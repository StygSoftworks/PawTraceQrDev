// src/lib/qr.ts
//import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

// src/lib/qr.ts
export async function makeQrDataUrl(text: string) {
  const QRCode = (await import("qrcode")).default; // lazy-load
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function makeQrSvgString(text: string): Promise<string> {
  const QRCode = (await import("qrcode")).default; // lazy-load
  return await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}



// Convert a data URL to a Blob object
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/** Upload the QR PNG blob to the pet-qr bucket and return a public URL */
export async function uploadPetQr(ownerId: string, shortId: string, blob: Blob) {
  const path = `${ownerId}/${shortId}.png`; // store by short_id too
  const { error } = await supabase.storage
    .from("pet-qr")
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("pet-qr").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generate a QR that points to your public pet page and upload it.
 * Returns the QR public URL.
 */
export async function generateAndStorePetQr(ownerId: string, shortId: string) {
  // Decide what the QR should open. Common choices:
  // - Your app’s public pet page: https://yourapp.com/p/<petId>
  // - Or a deep-link like pawtrace://pet/<petId>
  const qrTarget = `https://www.pawtraceqr.com/p/${shortId}`;

  const dataUrl = await makeQrDataUrl(qrTarget);
  const blob = await dataUrlToBlob(dataUrl);
  return await uploadPetQr(ownerId, shortId, blob);
}

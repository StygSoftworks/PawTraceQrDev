// src/lib/qr.ts
import { supabase } from "@/lib/supabase";

export type QRShape = 'square' | 'round';

export async function makeQrDataUrl(text: string) {
  const QRCode = (await import("qrcode")).default;
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function makeQrSvgString(text: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function makeRoundQrSvgString(text: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  const svgString = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgElement = svgDoc.documentElement;

  const viewBox = svgElement.getAttribute("viewBox");
  if (!viewBox) return svgString;

  const [, , width, height] = viewBox.split(" ").map(Number);
  const size = Math.max(width, height);
  const radius = size / 2;

  const defsElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
  const clipPathElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
  clipPathElement.setAttribute("id", "roundClip");

  const circleElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleElement.setAttribute("cx", (size / 2).toString());
  circleElement.setAttribute("cy", (size / 2).toString());
  circleElement.setAttribute("r", radius.toString());

  clipPathElement.appendChild(circleElement);
  defsElement.appendChild(clipPathElement);

  svgElement.insertBefore(defsElement, svgElement.firstChild);

  const gElement = svgDoc.createElementNS("http://www.w3.org/2000/svg", "g");
  gElement.setAttribute("clip-path", "url(#roundClip)");

  while (svgElement.childNodes.length > 1) {
    const child = svgElement.childNodes[1];
    gElement.appendChild(child);
  }

  svgElement.appendChild(gElement);

  return new XMLSerializer().serializeToString(svgDoc);
}

export async function makeRoundQrDataUrl(text: string, size = 512): Promise<string> {
  const svgString = await makeRoundQrSvgString(text);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
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

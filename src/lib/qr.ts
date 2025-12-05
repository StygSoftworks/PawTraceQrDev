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
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qrCode = new QRCodeStyling({
    width: 512,
    height: 512,
    data: text,
    shape: "circle",
    type: "svg",
    dotsOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersSquareOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersDotOptions: {
      color: "#000000",
      type: "dot"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0
    },
    qrOptions: {
      errorCorrectionLevel: "H"
    }
  });

  const blob = await qrCode.getRawData("svg");
  if (!blob) throw new Error("Failed to generate SVG");

  if (blob instanceof Blob) {
    const text_data = await blob.text();
    return text_data;
  } else {
    return blob.toString();
  }
}

export async function makeRoundQrDataUrl(text: string, size = 512): Promise<string> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data: text,
    shape: "circle",
    type: "canvas",
    dotsOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersSquareOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersDotOptions: {
      color: "#000000",
      type: "dot"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0
    },
    qrOptions: {
      errorCorrectionLevel: "H"
    }
  });

  const blob = await qrCode.getRawData("png");
  if (!blob) throw new Error("Failed to generate PNG");

  return new Promise((resolve, reject) => {
    if (!(blob instanceof Blob)) {
      reject(new Error('Expected Blob but got Buffer'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function makeQrSvgWithText(qrText: string, displayText: string, size = 512): Promise<string> {
  const QRCode = (await import("qrcode")).default;

  const qrSvg = await QRCode.toString(qrText, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const parser = new DOMParser();
  const qrDoc = parser.parseFromString(qrSvg, "image/svg+xml");
  const qrSvgElement = qrDoc.documentElement;

  const qrWidth = parseInt(qrSvgElement.getAttribute("width") || String(size));
  const qrHeight = parseInt(qrSvgElement.getAttribute("height") || String(size));

  const textHeight = 60;
  const padding = 20;
  const totalWidth = qrWidth + (padding * 2);
  const totalHeight = qrHeight + textHeight + (padding * 3);

  const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding})">
    ${qrSvgElement.innerHTML}
  </g>
  <text x="${totalWidth / 2}" y="${qrHeight + padding * 2 + 35}" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#000000" text-anchor="middle">${displayText}</text>
</svg>`;

  return wrappedSvg;
}

export async function makeRoundQrSvgWithText(qrText: string, displayText: string, size = 512): Promise<string> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data: qrText,
    shape: "circle",
    type: "svg",
    dotsOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersSquareOptions: {
      color: "#000000",
      type: "extra-rounded"
    },
    cornersDotOptions: {
      color: "#000000",
      type: "dot"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0
    },
    qrOptions: {
      errorCorrectionLevel: "H"
    }
  });

  const blob = await qrCode.getRawData("svg");
  if (!blob) throw new Error("Failed to generate SVG");

  let qrSvgContent: string;
  if (blob instanceof Blob) {
    qrSvgContent = await blob.text();
  } else {
    qrSvgContent = blob.toString();
  }

  const parser = new DOMParser();
  const qrDoc = parser.parseFromString(qrSvgContent, "image/svg+xml");
  const qrSvgElement = qrDoc.documentElement;

  const padding = 30;
  const totalSize = size + (padding * 2);
  const radius = (size / 2) + 40;
  const centerX = totalSize / 2;
  const centerY = totalSize / 2;

  const pathId = `textPath_${Math.random().toString(36).substr(2, 9)}`;

  const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding})">
    ${qrSvgElement.innerHTML}
  </g>
  <defs>
    <path id="${pathId}" d="M ${centerX - radius * 0.7},${centerY + radius * 0.7} A ${radius},${radius} 0 0,1 ${centerX + radius * 0.7},${centerY + radius * 0.7}" fill="none"/>
  </defs>
  <text font-family="Arial, sans-serif" font-size="20" font-weight="500" fill="#000000" text-anchor="middle">
    <textPath href="#${pathId}" startOffset="50%">${displayText}</textPath>
  </text>
</svg>`;

  return wrappedSvg;
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

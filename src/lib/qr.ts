// src/lib/qr.ts
import { supabase } from "@/lib/supabase";
import { optimize } from 'svgo';
export type QRShape = 'square' | 'round';



// Constants for consistency
const DEFAULT_QR_SIZE = 512;
const DEFAULT_PADDING = 30;
const DEFAULT_TEXT_HEIGHT = 40;
const DEFAULT_FONT_SIZE = 24;
const TEXT_RADIUS_OFFSET = 25;

// Common QR options
const QR_BASE_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 0,
  color: { dark: "#000000", light: "#ffffff" },
};

const STYLED_QR_BASE_OPTIONS = {
  shape: "circle" as const,
  dotsOptions: {
    color: "#000000",
    type: "extra-rounded" as const,
  },
  cornersSquareOptions: {
    color: "#000000",
    type: "extra-rounded" as const,
  },
  cornersDotOptions: {
    color: "#000000",
    type: "dot" as const,
  },
  backgroundOptions: {
    color: "#ffffff",
  },
  imageOptions: {
    crossOrigin: "anonymous" as const,
    margin: 0,
  },
  qrOptions: {
    errorCorrectionLevel: "H" as const,
  },
};

export async function flattenSvg(svgString: string, illustratorCompatible = true): Promise<string> {
  const plugins: any[] = illustratorCompatible ? [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeUnknownsAndDefaults: {
            keepRoleAttr: true,
          },
        },
      },
    },
    { name: 'convertTransform' },
    { name: 'convertShapeToPath' },
    { name: 'convertPathData' },
    { name: 'mergePaths' },
    { name: 'collapseGroups' },
    { name: 'removeUselessStrokeAndFill' },
    {
      name: 'removeAttrs',
      params: {
        attrs: ['class', 'data-.*'],
      },
    },
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [
          { xmlns: 'http://www.w3.org/2000/svg' },
          { version: '1.1' },
        ],
      },
    },
  ] : [
    { name: 'preset-default' },
    { name: 'convertTransform' },
    { name: 'mergePaths' },
    { name: 'convertShapeToPath' },
    { name: 'convertPathData' },
    { name: 'collapseGroups' },
    { name: 'removeUselessStrokeAndFill' },
    {
      name: 'removeAttrs',
      params: {
        attrs: ['class', 'data-.*'],
      },
    },
  ];

  const result = optimize(svgString, {
    multipass: true,
    plugins,
  });

  return result.data;
}
export async function makeQrDataUrl(text: string) {
  const QRCode = (await import("qrcode")).default;
  return await QRCode.toDataURL(text, {
    ...QR_BASE_OPTIONS,
    margin: 1,
    scale: 8,
  });
}

export async function makeQrSvgString(text: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return await QRCode.toString(text, {
    ...QR_BASE_OPTIONS,
    type: "svg",
    margin: 1,
  });
}

export async function makeRoundQrSvgString(text: string): Promise<string> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qrCode = new QRCodeStyling({
    width: DEFAULT_QR_SIZE,
    height: DEFAULT_QR_SIZE,
    data: text,
    type: "svg",
    ...STYLED_QR_BASE_OPTIONS,
  });

  const blob = await qrCode.getRawData("svg");
  if (!blob) throw new Error("Failed to generate SVG");

  return blob instanceof Blob ? await blob.text() : blob.toString();
}

export async function makeRoundQrDataUrl(text: string, size = DEFAULT_QR_SIZE): Promise<string> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data: text,
    type: "canvas",
    ...STYLED_QR_BASE_OPTIONS,
  });

  const blob = await qrCode.getRawData("png");
  if (!blob) throw new Error("Failed to generate PNG");
  if (!(blob instanceof Blob)) {
    throw new Error('Expected Blob but got Buffer');
  }

  return new Promise((resolve, reject) => {
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

export async function makeQrSvgWithText(
  qrText: string,
  displayText: string,
  size = DEFAULT_QR_SIZE,
  flatten = true
): Promise<string> {
  const QRCode = (await import("qrcode")).default;

  // Generate QR with proper scale to achieve desired size
  // The scale parameter determines module size, not total size
  // We'll generate at a fixed scale and then scale the SVG
  const qrSvg = await QRCode.toString(qrText, {
    ...QR_BASE_OPTIONS,
    type: "svg",
  });

  // Parse and extract the QR path data
  const parser = new DOMParser();
  const qrDoc = parser.parseFromString(qrSvg, "image/svg+xml");
  const qrSvgElement = qrDoc.documentElement;

  // Get the original viewBox to maintain aspect ratio
  const viewBox = qrSvgElement.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 100, 100];
  const [, , origWidth, origHeight] = viewBox;

  const qrInner = qrSvgElement.innerHTML;

  const padding = DEFAULT_PADDING;
  const textHeight = DEFAULT_TEXT_HEIGHT;
  const totalWidth = size + padding * 2;
  const totalHeight = size + padding * 2 + textHeight;

  // Calculate scale to fit QR into desired size
  const scaleX = size / origWidth;
  const scaleY = size / origHeight;

  const wrappedSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding}) scale(${scaleX}, ${scaleY})">
    ${qrInner}
  </g>
  <text
    x="${totalWidth / 2}"
    y="${size + padding + textHeight * 0.7}"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${DEFAULT_FONT_SIZE}"
    font-weight="600"
    fill="#000000"
    text-anchor="middle"
  >
    ${escapeXml(displayText)}
  </text>
</svg>`.trim();

  return flatten ? await flattenSvg(wrappedSvg) : wrappedSvg;
}

export async function makeRoundQrSvgWithText(
  qrText: string,
  displayText: string,
  size = DEFAULT_QR_SIZE,
  flatten = true
): Promise<string> {
  const QRCodeStyling = (await import("qr-code-styling")).default;

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data: qrText,
    type: "svg",
    ...STYLED_QR_BASE_OPTIONS,
  });

  const blob = await qrCode.getRawData("svg");
  if (!blob) throw new Error("Failed to generate SVG");

  const qrSvgContent = blob instanceof Blob ? await blob.text() : blob.toString();
  const parser = new DOMParser();
  const qrDoc = parser.parseFromString(qrSvgContent, "image/svg+xml");
  const qrInner = qrDoc.documentElement.innerHTML;

  const padding = DEFAULT_PADDING;
  const totalSize = size + padding * 2;
  const centerX = totalSize / 2;
  const centerY = totalSize / 2;
  const textRadius = size / 2 + TEXT_RADIUS_OFFSET;
  const pathId = `textPath_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Top arc for curved text
  const pathD = `M ${centerX - textRadius},${centerY} A ${textRadius},${textRadius} 0 0 0 ${centerX + textRadius},${centerY}`;

  const wrappedSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <g transform="translate(${padding}, ${padding})">
    ${qrInner}
  </g>
  <defs>
    <path id="${pathId}" d="${pathD}" fill="none" />
  </defs>
  <text
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${DEFAULT_FONT_SIZE}"
    font-weight="600"
    fill="#000000"
  >
    <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">
      ${escapeXml(displayText)}
    </textPath>
  </text>
</svg>`.trim();

  return flatten ? await flattenSvg(wrappedSvg) : wrappedSvg;
}

// Helper to escape XML special characters in text
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Convert a data URL to a Blob object
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/** Upload the QR PNG blob to the pet-qr bucket and return a public URL */
export async function uploadPetQr(ownerId: string, shortId: string, blob: Blob): Promise<string> {
  const path = `${ownerId}/${shortId}.png`;
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
export async function generateAndStorePetQr(
  ownerId: string, 
  shortId: string,
  baseUrl = "https://www.pawtraceqr.com"
): Promise<string> {
  const qrTarget = `${baseUrl}/p/${shortId}`;
  const dataUrl = await makeQrDataUrl(qrTarget);
  const blob = await dataUrlToBlob(dataUrl);
  return await uploadPetQr(ownerId, shortId, blob);
}
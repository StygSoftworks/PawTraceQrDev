import { supabase } from "@/lib/supabase";
import { makeQrSvgWithText, makeRoundQrSvgWithText } from "@/lib/qr";
import { svgStringToPdf, type PageSize } from "@/lib/pdf-export";
import JSZip from "jszip";

export interface QRCodeRecord {
  id: string;
  short_id: string;
  tag_type: "dog" | "cat";
  created_at: string;
}

export interface QRPoolStats {
  unassigned_dog_count: number;
  unassigned_cat_count: number;
  assigned_dog_count: number;
  assigned_cat_count: number;
  total_dog_count: number;
  total_cat_count: number;
  total_count: number;
  dog_percentage: number;
  cat_percentage: number;
}

export type ExportFormat = "svg" | "pdf";

export interface ExportOptions {
  shape: "square" | "round";
  tag_type?: "dog" | "cat" | null;
  shortcodes?: string[];
  limit?: number;
  format?: ExportFormat;
  pdfPageSize?: PageSize;
  qrsPerPage?: number;
}

export async function fetchAvailableQrCodes(
  tagType: "dog" | "cat" | null = null,
  limit = 100,
  offset = 0
): Promise<QRCodeRecord[]> {
  const { data, error } = await supabase.rpc("get_available_qr_codes", {
    p_limit: limit,
    p_offset: offset,
    p_tag_type: tagType,
  });

  if (error) throw error;
  return data || [];
}

export async function fetchQrCodeByShortId(shortId: string) {
  const { data, error } = await supabase.rpc("get_qr_code_by_shortid", {
    p_short_id: shortId,
  });

  if (error) throw error;
  return data?.[0] || null;
}

export async function fetchQrPoolStats(): Promise<QRPoolStats> {
  const { data, error } = await supabase.rpc("get_qr_pool_stats");

  if (error) throw error;
  return data?.[0] || null;
}

async function fetchQrCodesForExport(options: ExportOptions): Promise<QRCodeRecord[]> {
  const { tag_type, shortcodes, limit = 100 } = options;

  if (shortcodes && shortcodes.length > 0) {
    const qrCodes: QRCodeRecord[] = [];
    for (const shortcode of shortcodes) {
      const qr = await fetchQrCodeByShortId(shortcode);
      if (qr) {
        qrCodes.push(qr);
      }
    }
    return qrCodes;
  } else {
    return await fetchAvailableQrCodes(tag_type || null, limit, 0);
  }
}

export async function exportQrCodes(options: ExportOptions): Promise<Blob> {
  const qrCodes = await fetchQrCodesForExport(options);

  if (qrCodes.length === 0) {
    throw new Error("No QR codes found matching criteria");
  }

  const format = options.format || "svg";

  if (format === "pdf") {
    return await exportQrCodesToPdf(qrCodes, options);
  } else {
    return await exportQrCodesToSvgZip(qrCodes, options);
  }
}

async function exportQrCodesToPdf(
  qrCodes: QRCodeRecord[],
  options: ExportOptions
): Promise<Blob> {
  const baseUrl = "https://www.pawtraceqr.com/p/";
  const zip = new JSZip();

  for (const qr of qrCodes) {
    const qrUrl = `${baseUrl}${qr.short_id}`;
    const displayText = `pawtraceqr.com/p/${qr.short_id}`;

    let svgContent: string;
    if (options.shape === "round") {
      svgContent = await makeRoundQrSvgWithText(qrUrl, displayText);
    } else {
      svgContent = await makeQrSvgWithText(qrUrl, displayText);
    }

    const pdfBlob = await svgStringToPdf(svgContent, {
      pageSize: options.pdfPageSize || "letter",
      orientation: "portrait",
      title: `${qr.tag_type.toUpperCase()} QR Code - ${qr.short_id}`,
      author: "PawTrace QR Admin",
      targetWidth: 144,
    });

    const filename = `${qr.tag_type}-${qr.short_id}.pdf`;
    zip.file(filename, pdfBlob);
  }

  const manifest = {
    exported_at: new Date().toISOString(),
    shape: options.shape,
    tag_type: options.tag_type || "all",
    format: "pdf",
    page_size: options.pdfPageSize || "letter",
    count: qrCodes.length,
    codes: qrCodes.map((qr) => ({
      short_id: qr.short_id,
      tag_type: qr.tag_type,
      filename: `${qr.tag_type}-${qr.short_id}.pdf`,
    })),
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({ type: "blob" });
}

async function exportQrCodesToSvgZip(
  qrCodes: QRCodeRecord[],
  options: ExportOptions
): Promise<Blob> {
  const zip = new JSZip();
  const baseUrl = "https://www.pawtraceqr.com/p/";

  for (const qr of qrCodes) {
    const qrUrl = `${baseUrl}${qr.short_id}`;
    const displayText = `pawtraceqr.com/p/${qr.short_id}`;

    let svgContent: string;
    if (options.shape === "round") {
      svgContent = await makeRoundQrSvgWithText(qrUrl, displayText);
    } else {
      svgContent = await makeQrSvgWithText(qrUrl, displayText);
    }

    const filename = `${qr.tag_type}-${qr.short_id}.svg`;
    zip.file(filename, svgContent);
  }

  const manifest = {
    exported_at: new Date().toISOString(),
    shape: options.shape,
    tag_type: options.tag_type || "all",
    format: "svg",
    count: qrCodes.length,
    codes: qrCodes.map((qr) => ({
      short_id: qr.short_id,
      tag_type: qr.tag_type,
      filename: `${qr.tag_type}-${qr.short_id}.svg`,
    })),
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportAndDownloadQrCodes(options: ExportOptions): Promise<void> {
  const blob = await exportQrCodes(options);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const tagTypeStr = options.tag_type || "all";
  const filename = `qr-codes-${options.shape}-${tagTypeStr}-${timestamp}.zip`;
  downloadBlob(blob, filename);
}

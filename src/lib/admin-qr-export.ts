import { supabase } from "@/lib/supabase";

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

export interface ExportOptions {
  shape: "square" | "round";
  tag_type?: "dog" | "cat" | null;
  shortcodes?: string[];
  limit?: number;
}

export async function fetchAvailableQrCodes(
  tagType: "dog" | "cat" | null = null,
  limit = 100,
  offset = 0
): Promise<QRCodeRecord[]> {
  const { data, error } = await supabase.rpc("get_available_qr_codes", {
    p_tag_type: tagType,
    p_limit: limit,
    p_offset: offset,
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

export async function exportQrCodes(options: ExportOptions): Promise<Blob> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    throw new Error("Not authenticated");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiUrl = `${supabaseUrl}/functions/v1/export-qr-codes`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Export failed" }));
    throw new Error(errorData.error || "Export failed");
  }

  return await response.blob();
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

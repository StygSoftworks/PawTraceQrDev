import { supabase } from "./supabase";

export type QRPoolStatus = {
  unassignedCount: number;
  totalCount: number;
  currentLength: number;
  codesAtCurrentLength: number;
  needsRefill: boolean;
  percentageAvailable: number;
};

const REFILL_THRESHOLD = 100;

export async function getQRPoolStatus(): Promise<QRPoolStatus> {
  const { data: unassignedData } = await supabase.rpc("count_unassigned_qr_codes");
  const unassignedCount = unassignedData || 0;

  const { data: totalData, error: totalError } = await supabase
    .from("qr_codes")
    .select("id", { count: "exact", head: true });

  if (totalError) {
    console.error("Error getting total QR count:", totalError);
  }

  const totalCount = totalData?.length ?? 0;

  const { data: stateData } = await supabase
    .from("qr_generation_state")
    .select("current_length, codes_generated_at_length")
    .eq("id", 1)
    .maybeSingle();

  const currentLength = stateData?.current_length ?? 1;
  const codesAtCurrentLength = stateData?.codes_generated_at_length ?? 0;

  const needsRefill = unassignedCount < REFILL_THRESHOLD;
  const percentageAvailable = totalCount > 0 ? (unassignedCount / totalCount) * 100 : 0;

  return {
    unassignedCount,
    totalCount,
    currentLength,
    codesAtCurrentLength,
    needsRefill,
    percentageAvailable,
  };
}

export async function shouldTriggerQRGeneration(): Promise<boolean> {
  const status = await getQRPoolStatus();
  return status.needsRefill;
}

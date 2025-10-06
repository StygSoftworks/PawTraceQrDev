// src/lib/limits.ts
import { supabase } from "@/lib/supabase";

export async function fetchEffectiveLimit(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase.rpc("get_effective_pet_limit", { uid: user.id });
  if (error) throw error;
  return data ?? 3;
}

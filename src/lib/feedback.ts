// src/lib/feedback.ts
import { supabase } from "@/lib/supabase";

export type FeedbackRow = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

export type NewFeedback = {
  rating: number;
  comment: string;
  display_name?: string;
};

export async function listPublicFeedback(limit = 12) {
  const { data, error } = await supabase
    .from("feedback_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as FeedbackRow[];
}

export async function createFeedback(payload: {
  rating: number;
  comment: string;
  display_name?: string | null;
}) {
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      rating: payload.rating,
      comment: payload.comment,
      display_name: payload.display_name ?? null,
    })
    .select()
    .single<FeedbackRow>();
  if (error) throw error;
  return data;
}

export async function listMyFeedback() {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false }) as {
      data: FeedbackRow[] | null;
      error: any;
    };
  if (error) throw error;
  return data ?? [];
}

export async function updateFeedback(id: string, patch: {
  rating?: number;
  comment?: string;
  display_name?: string | null;
}) {
  const { data, error } = await supabase
    .from("feedback")
    .update(patch)
    .eq("id", id)
    .select()
    .single<FeedbackRow>();
  if (error) throw error;
  return data;
}

export async function deleteFeedback(id: string) {
  const { error } = await supabase
    .from("feedback")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function listAllFeedbackForModeration(): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from("feedback")
    .select("id,user_id,rating,comment,display_name,approved,approved_by,approved_at,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function approveFeedback(id: string, approve: boolean) {
  const { error } = await supabase.rpc("moderate_feedback", { _id: id, _approve: approve });
  if (error) throw error;
}


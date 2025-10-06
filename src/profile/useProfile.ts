// src/profile/useProfile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";

export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,  // cache for 5 min
    gcTime: 30 * 60 * 1000,    // garbage collect after 30 min
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user!.id, ...patch })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.setQueryData(["profile", user?.id], data),
  });

  return { ...query, update };
}

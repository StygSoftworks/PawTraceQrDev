import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type UserRole = "free" | "user" | "admin" | "owner";

async function fetchUserRole(): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data?.role ?? "free") as UserRole;
}

export function useAdminCheck() {
  const { data: role, isLoading, isError } = useQuery({
    queryKey: ["user-role"],
    queryFn: fetchUserRole,
    staleTime: 60_000,
  });

  const isAdmin = role === "admin" || role === "owner";

  return { role, isAdmin, isLoading, isError };
}

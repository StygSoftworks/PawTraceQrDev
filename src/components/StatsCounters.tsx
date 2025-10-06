// StatsCounters.tsx
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PawPrint, Heart, Users as UsersIcon } from "lucide-react";

/* Animated number */
function CountUp({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

// ---- FIXED: robust unwrapping + logging
type Counts = { users: number; reviews: number; pets: number };

async function fetchPublicCounts(): Promise<Counts> {
  const { data, error } = await supabase.rpc("get_public_counts");
  if (error) {
    console.error("get_public_counts RPC error:", error);
    throw error;
  }
  // Log the raw shape once to verify
  if (import.meta.env.DEV) {
    console.debug("get_public_counts RPC data:", data);
  }

  let row: any = data;
  // Some function defs return an array with one row
  if (Array.isArray(row)) row = row[0];

  // Some folks return JSON; some return RECORD. Handle both.
  // If it's JSON text, parse it.
  if (typeof row === "string") {
    try { row = JSON.parse(row); } catch { /* ignore */ }
  }
  // If it has a single key wrapping the object (e.g. { get_public_counts: {...} })
  if (row && typeof row === "object" && "get_public_counts" in row) {
    row = (row as any).get_public_counts;
  }

  const users = Number(row?.users ?? 0);
  const reviews = Number(row?.reviews ?? 0);
  const pets = Number(row?.pets ?? 0);

  return { users, reviews, pets };
}

type Props = { className?: string; showIcons?: boolean };

export function StatsCounters({ className = "", showIcons = true }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public_counts"],
    queryFn: fetchPublicCounts,
    staleTime: 60_000,
  });

  const items = [
    { label: "Registered Users", value: data?.users ?? 0, icon: <UsersIcon className="h-8 w-8 text-primary/70" /> },
    { label: "Public Reviews",   value: data?.reviews ?? 0, icon: <Heart className="h-8 w-8 text-primary/70" /> },
    { label: "Pets Protected",   value: data?.pets ?? 0,    icon: <PawPrint className="h-8 w-8 text-primary/70" /> },
  ];

  return (
    <div className={`grid gap-4 sm:grid-cols-3 ${className}`}>
      {items.map((it) => (
        <Card key={it.label} className="border-primary/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <CardTitle className="text-sm text-muted-foreground">{it.label}</CardTitle>
              <div className="mt-2 text-3xl font-bold">
                {isLoading ? "—" : isError ? "—" : <CountUp value={it.value} />}
              </div>
            </div>
            {showIcons && it.icon}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

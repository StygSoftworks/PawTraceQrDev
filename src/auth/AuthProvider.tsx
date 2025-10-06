// src/auth/AuthProvider.tsx
import * as React from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const Ctx = React.createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // store display name in auth metadata (handy for avatar/menu)
        data: name ? { name } : undefined,
        // optional: set a redirect URL for email confirmation
        // emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) throw error;

    // If email confirmation is ON, there's no session yet.
    // If OFF, we have a session and can create the profile row immediately.
    const hasSession = !!data.session && !!data.user;

    if (hasSession && name) {
      await supabase.from("profiles").upsert({ id: data.user!.id, display_name: name });
    }

    return { needsEmailConfirm: !hasSession };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

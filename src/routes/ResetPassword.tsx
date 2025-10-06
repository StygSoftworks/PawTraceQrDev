// src/routes/ResetPassword.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, LogIn } from "lucide-react";

export default function ResetPassword() {
  //const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Optional: ensure there is a session (Supabase sets it via the email link)
  useEffect(() => {
    // If you want to strictly guard that a session exists before showing the form,
    // you can check: supabase.auth.getSession()
    // Not required; updateUser will fail if no active session exists.
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setOk(true);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          {ok ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Password updated successfully.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          {ok ? (
            <Button asChild>
              <Link to="/signin" className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Back to sign in
              </Link>
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

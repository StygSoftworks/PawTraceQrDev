// src/routes/ForgotPassword.tsx
import { useState } from "react";
import {  Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  //const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const origin = import.meta.env.VITE_SITE_URL || window.location.origin;
  const redirectTo = `${origin}/reset-password`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We’ll email you a secure link to reset it.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <Alert>
              <AlertDescription>
                If an account exists for <span className="font-medium">{email}</span>, a reset link has been sent.
                Check your inbox (and spam).
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Sending…" : <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Send reset link</span>}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button asChild variant="ghost">
            <Link to="/signin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

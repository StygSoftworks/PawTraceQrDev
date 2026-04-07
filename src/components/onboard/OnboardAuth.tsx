import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert as AlertCircle, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";

const RegisterSchema = z.object({
  name: z.string().min(1, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string().min(8, "Please confirm your password"),
}).refine((vals) => vals.password === vals.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type RegisterValues = z.infer<typeof RegisterSchema>;
type SignInValues = z.infer<typeof SignInSchema>;

type Props = {
  onComplete: () => void;
  shortId?: string;
};

export function OnboardAuth({ onComplete, shortId }: Props) {
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleRegister = async (vals: RegisterValues) => {
    setServerError(null);
    try {
      const { needsEmailConfirm } = await signUpWithEmail(vals.email, vals.password, vals.name);
      if (needsEmailConfirm) {
        if (shortId) {
          localStorage.setItem("pending_tag_claim", shortId);
        }
        setServerError("Please check your email to confirm your account, then come back to this page.");
        return;
      }
      onComplete();
    } catch (e: any) {
      setServerError(e?.message ?? "Sign up failed");
    }
  };

  const handleSignIn = async (vals: SignInValues) => {
    setServerError(null);
    try {
      await signInWithEmail(vals.email, vals.password);
      onComplete();
    } catch (e: any) {
      setServerError(e?.message ?? "Sign in failed");
    }
  };

  return (
    <Card className="shadow-xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <CardHeader className="text-center space-y-2">
        <div className="flex items-center justify-center mb-2">
          <div className="h-14 w-14 flex items-center justify-center">
            <img
              src="/PawTraceQRLogo.svg"
              alt="PawTrace"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <CardTitle className="text-2xl">
          {mode === "register" ? "Create Your Account" : "Welcome Back"}
        </CardTitle>
        <CardDescription className="text-base">
          {mode === "register"
            ? "Sign up to link this tag to your pet"
            : "Sign in to continue setting up your tag"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {mode === "register" ? (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-sm font-medium">Full name</Label>
              <Input
                id="reg-name"
                placeholder="Jane Doe"
                {...registerForm.register("name")}
                className="h-11"
              />
              {registerForm.formState.errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...registerForm.register("email")}
                className="h-11"
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  {...registerForm.register("password")}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-confirm" className="text-sm font-medium">Confirm password</Label>
              <Input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                {...registerForm.register("confirm")}
                className="h-11"
              />
              {registerForm.formState.errors.confirm && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {registerForm.formState.errors.confirm.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={registerForm.formState.isSubmitting}
              className="w-full h-11 gap-2 text-base transition-all hover:scale-[1.02]"
            >
              {registerForm.formState.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="si-email" className="text-sm font-medium">Email</Label>
              <Input
                id="si-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...signInForm.register("email")}
                className="h-11"
              />
              {signInForm.formState.errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {signInForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="si-password" className="text-sm font-medium">Password</Label>
              <Input
                id="si-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                {...signInForm.register("password")}
                className="h-11"
              />
              {signInForm.formState.errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {signInForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={signInForm.formState.isSubmitting}
              className="w-full h-11 gap-2 text-base transition-all hover:scale-[1.02]"
            >
              {signInForm.formState.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "register" ? "signin" : "register");
              setServerError(null);
            }}
            className="text-sm text-primary hover:underline"
          >
            {mode === "register"
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

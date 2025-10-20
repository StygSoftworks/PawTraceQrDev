import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Mail, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { SocialMediaInput } from "@/components/SocialMediaInput";

const RegisterSchema = z.object({
  name: z.string().min(1, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string().min(8, "Please confirm your password"),
  phone: z.string().max(15).optional(),
  instagram: z.string().max(100).optional(),
  facebook: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  telegram: z.string().max(100).optional(),
  whatsapp: z.string().max(20).optional(),
  website: z.string().max(200).url("Must be a valid URL").or(z.literal("")).optional(),
}).refine((vals) => vals.password === vals.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

type FormValues = z.infer<typeof RegisterSchema>;

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return strength;
};

const getStrengthColor = (strength: number) => {
  if (strength <= 1) return "bg-red-500";
  if (strength <= 2) return "bg-orange-500";
  if (strength <= 3) return "bg-yellow-500";
  return "bg-green-500";
};

const getStrengthText = (strength: number) => {
  if (strength <= 1) return "Weak";
  if (strength <= 2) return "Fair";
  if (strength <= 3) return "Good";
  return "Strong";
};

export default function Register() {
  const { signUpWithEmail } = useAuth();
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { 
      name: "", 
      email: "", 
      password: "", 
      confirm: "",
      phone: "",
      instagram: "",
      facebook: "",
      twitter: "",
      telegram: "",
      whatsapp: "",
      website: "",
    },
  });

  const password = watch("password");
  const passwordStrength = password ? getPasswordStrength(password) : 0;

  const onSubmit = async (vals: FormValues) => {
    setServerError(null);
    try {
      const { needsEmailConfirm } = await signUpWithEmail(vals.email, vals.password, vals.name);
      
      // Store additional profile data to be saved after email confirmation
      if (vals.phone || vals.instagram || vals.facebook || vals.twitter || vals.telegram || vals.whatsapp || vals.website) {
        const additionalData = {
          phone: vals.phone,
          instagram: vals.instagram,
          facebook: vals.facebook,
          twitter: vals.twitter,
          telegram: vals.telegram,
          whatsapp: vals.whatsapp,
          website: vals.website,
        };
        // You may want to save this to localStorage or pass it differently
        // depending on your auth flow
        localStorage.setItem('pending_profile_data', JSON.stringify(additionalData));
      }
      
      if (needsEmailConfirm) {
        setEmailSent(vals.email);
      } else {
        nav("/account", { replace: true });
      }
    } catch (e: any) {
      setServerError(e?.message ?? "Sign up failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl relative shadow-xl border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="h-16 w-16 flex items-center justify-center">
              <img 
                src="/PawTraceQRLogo.svg" 
                alt="PawTrace Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center tracking-tight">
            Create your account
          </CardTitle>
          <CardDescription className="text-center text-base">
            Join PawTrace and start protecting your pets today
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {emailSent && (
            <Alert className="animate-in fade-in-50 slide-in-from-top-2 duration-300 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                We sent a confirmation link to <span className="font-semibold">{emailSent}</span>. 
                Please verify your email to finish creating your account.
              </AlertDescription>
            </Alert>
          )}

          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Essential Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full name
                </Label>
                <Input 
                  id="name" 
                  placeholder="Jane Doe" 
                  {...register("name")}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  autoComplete="email"
                  placeholder="you@example.com" 
                  {...register("email")}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••" 
                    {...register("password")}
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {password && password.length > 0 && (
                  <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength ? getStrengthColor(passwordStrength) : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: <span className="font-medium">{getStrengthText(passwordStrength)}</span>
                    </p>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm font-medium">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input 
                    id="confirm" 
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••" 
                    {...register("confirm")}
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {errors.confirm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Contact Information - Collapsible */}
            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowOptional(!showOptional)}
                className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-sm font-medium">
                  Add contact info & social links (optional)
                </span>
                {showOptional ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showOptional && (
                <div className="space-y-4 mt-4 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone number
                    </Label>
                    <Input 
                      id="phone" 
                      placeholder="+1 (555) 123-4567" 
                      {...register("phone")}
                      className="h-10"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <Separator />

                  <SocialMediaInput register={register} errors={errors} showLabels={false} />
                  
                  <Alert>
                    <AlertDescription className="text-xs">
                      You can control which information is shared on your pet's profile later in account settings
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-11 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground px-4">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Already have an account?</span>
            <Link 
              to="/signin" 
              className="text-primary font-medium hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
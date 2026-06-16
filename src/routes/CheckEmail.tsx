import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Clock } from "lucide-react";

export default function CheckEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "your email";
  const nextStep = searchParams.get("next");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ring-4 ring-blue-50 dark:ring-blue-900/20">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span> (it may take a minute)
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                <p className="font-medium">Click the link in your email</p>
                <p className="opacity-90">Look for an email from PawTrace and click the verification link inside.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Once you verify your email, you'll be automatically signed in.
              {nextStep && ` We'll then take you to ${nextStep === "onboard" ? "complete your pet setup" : "your account"}.`}
            </p>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Didn't get an email?
              </p>
              <p className="text-xs text-muted-foreground text-center mb-3">
                Check your spam folder or try signing up again with a different email address.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate("/register")}
                disabled={resendCountdown > 0}
              >
                {resendCountdown > 0 ? `Try again in ${resendCountdown}s` : "Back to Sign Up"}
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Having trouble?</span> Make sure you're using the correct email address. Your confirmation link will expire in 24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

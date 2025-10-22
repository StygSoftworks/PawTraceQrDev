import { ShieldCheck, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrustBadgesProps {
  variant?: "inline" | "stacked" | "hero";
  className?: string;
}

export function TrustBadges({ variant = "inline", className = "" }: TrustBadgesProps) {
  if (variant === "hero") {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${className}`}>
        <Badge
          variant="outline"
          className="gap-2 px-4 py-2 text-base bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-100"
        >
          <ShieldCheck className="h-4 w-4" />
          We will never sell your data
        </Badge>
        <Badge
          variant="outline"
          className="gap-2 px-4 py-2 text-base bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-100"
        >
          <Ban className="h-4 w-4" />
          We don't run ads
        </Badge>
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-900">
          <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-green-700 dark:text-green-300" />
          </div>
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              We will never sell your data
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your privacy is our priority
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900">
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <Ban className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              We don't run ads
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Clean experience, no tracking
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-900">
        <ShieldCheck className="h-4 w-4 text-green-700 dark:text-green-300" />
        <span className="text-sm font-medium text-green-900 dark:text-green-100">
          We will never sell your data
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900">
        <Ban className="h-4 w-4 text-blue-700 dark:text-blue-300" />
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          We don't run ads
        </span>
      </div>
    </div>
  );
}

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface InactiveProfileBannerProps {
  petName: string;
  subscriptionStatus: "inactive" | "expired" | "cancelled" | "pending";
}

export function InactiveProfileBanner({ petName, subscriptionStatus }: InactiveProfileBannerProps) {
  const getMessage = () => {
    switch (subscriptionStatus) {
      case "expired":
        return `${petName}'s profile subscription has expired. The owner needs to renew to keep this profile active.`;
      case "cancelled":
        return `${petName}'s profile subscription was cancelled. Contact the owner for more information.`;
      case "pending":
        return `${petName}'s profile is pending activation. The subscription is being processed.`;
      case "inactive":
      default:
        return `${petName}'s profile is not currently activated with a subscription. Contact the owner for assistance.`;
    }
  };

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-6">
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-900 dark:text-amber-200 font-medium">
        {getMessage()}
      </AlertDescription>
    </Alert>
  );
}

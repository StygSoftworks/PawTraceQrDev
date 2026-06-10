export const PRICE_ANNUAL = 8;
export const PRICE_LIFETIME = 60;
export const PRICE_REPLACEMENT = 5;
export const TAG_CURRENCY = "USD";

export type EntitlementType = "annual" | "lifetime" | "physical_year";
export type EntitlementStatus = "active" | "past_due" | "canceled" | "expired" | "trialing";

export function getStatusBadgeVariant(
  status: EntitlementStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "past_due":
      return "secondary";
    case "canceled":
    case "expired":
      return "destructive";
    case "trialing":
      return "outline";
    default:
      return "outline";
  }
}

export function getStatusLabel(status: EntitlementStatus, type: EntitlementType): string {
  if (type === "lifetime") return "Lifetime";
  switch (status) {
    case "active":
      return "Active";
    case "past_due":
      return "Past Due";
    case "canceled":
      return "Canceled";
    case "expired":
      return "Expired";
    case "trialing":
      return "Trial";
    default:
      return "Unknown";
  }
}

export type TagStatus = "active" | "inactive" | "pending_payment";

export function getTagBadgeVariant(
  status: TagStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "pending_payment":
      return "secondary";
    case "inactive":
      return "destructive";
    default:
      return "outline";
  }
}

export function getTagStatusLabel(status: TagStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending_payment":
      return "Pending Payment";
    case "inactive":
      return "Inactive";
    default:
      return "Unknown";
  }
}

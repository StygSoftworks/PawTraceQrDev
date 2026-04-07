export const TAG_PRICE = 15.0;
export const TAG_CURRENCY = "USD";

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

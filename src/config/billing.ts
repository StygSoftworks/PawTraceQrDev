// src/config/billing.ts

export const PAYPAL_PLANS = {
  PER_PET_MONTHLY: "P-01B964946R701620HNDPMUVA",
  PER_PET_YEARLY:  "P-4V1531673F796000SNDPMUVA",
} as const;

export const PLAN_DETAILS = {
  [PAYPAL_PLANS.PER_PET_MONTHLY]: {
    name: "Monthly Pet Subscription",
    interval: "month",
    price: "$4.99/month",
  },
  [PAYPAL_PLANS.PER_PET_YEARLY]: {
    name: "Yearly Pet Subscription",
    interval: "year",
    price: "$49.99/year",
  },
} as const;

export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'cancelled' | 'pending';

export function getSubscriptionBadgeVariant(status: SubscriptionStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
    case 'expired':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Central Membership Plans Configuration — Single Source of Truth
 *
 * All pricing, periods, month durations, and features are defined here.
 * Client UI and Backend API both import from this file to prevent discrepancies.
 */

export const GST_RATE = 0.18; // 18% GST

export interface PlanDefinition {
  name: string;
  price: number; // Base price in INR
  months: number; // Duration in months for expiry calculation
  period: string; // Human-readable duration label
  description: string;
  features: string[];
}

export const MEMBERSHIP_PLANS: Record<string, PlanDefinition> = {
  Gold: {
    name: "Gold",
    price: 3999,
    months: 3, // Fixed: 3 months (was incorrectly set to 1 in old verify-payment)
    period: "3 months",
    description: "Valid for 3 months",
    features: [
      "Valid for 3 months",
      "View 40 Phone Nos",
      "Send unlimited messages",
      "Unlimited horoscope views",
    ],
  },
  PrimeGold: {
    name: "Prime Gold",
    price: 4999,
    months: 3,
    period: "3 months",
    description: "Valid for 3 months",
    features: [
      "Valid for 3 months",
      "View unlimited Phone Nos*",
      "Send unlimited messages",
      "Unlimited horoscope views",
      "View verified profiles with photos",
    ],
  },
  PrimeTillUMarry: {
    name: "Prime Till U Marry",
    price: 8999,
    months: 12, // Fixed: 12 months (was incorrectly set to 120 in old verify-payment)
    period: "12 months",
    description: "Longest validity plan",
    features: [
      "12 months validity",
      "View unlimited Phone Nos*",
      "Send unlimited messages",
      "Unlimited horoscope views",
      "View verified profiles with photos",
    ],
  },
  Diamond: {
    name: "Diamond",
    price: 14999,
    months: 6,
    period: "6 months",
    description: "Priority matchmaking & video calls",
    features: [
      "Everything in Gold",
      "Unlimited contact reveals",
      "Unlimited interests",
      "First-page priority placement",
      "Verified badge prominence",
      "Video call request feature",
      "Dedicated account manager",
    ],
  },
  Platinum: {
    name: "Platinum",
    price: 24999,
    months: 12,
    period: "12 months",
    description: "Human matchmaker & bespoke introductions",
    features: [
      "Everything in Diamond",
      "Dedicated human matchmaker",
      "Hand-curated match recommendations",
      "Background verification assistance",
      "Profile video introduction",
      "Priority 24/7 support",
      "Astrology compatibility check",
    ],
  },
};

export const CHECKOUT_PLAN_KEYS = ["Gold", "PrimeGold", "PrimeTillUMarry"] as const;
export type CheckoutPlanKey = (typeof CHECKOUT_PLAN_KEYS)[number];

export type MembershipPlanKey = keyof typeof MEMBERSHIP_PLANS;

/**
 * Calculates GST (18%) and total amount for a plan in INR
 */
export function getPlanPricing(planKey: string) {
  const plan = MEMBERSHIP_PLANS[planKey];
  if (!plan) return null;

  const basePrice = plan.price;
  const gst = Math.round(basePrice * GST_RATE);
  const total = basePrice + gst;
  const totalInPaise = total * 100;

  return {
    basePrice,
    gst,
    total,
    totalInPaise,
    months: plan.months,
    period: plan.period,
    name: plan.name,
  };
}

/**
 * Computes plan expiration date safely.
 * If user already has an active subscription that hasn't expired, extends from current expiry.
 * Otherwise, calculates from current time.
 */
export function calculatePlanExpiry(months: number, currentExpiryIso?: string | null): string {
  const now = new Date();
  let baseDate = now;

  if (currentExpiryIso) {
    const existing = new Date(currentExpiryIso);
    if (!isNaN(existing.getTime()) && existing > now) {
      baseDate = existing;
    }
  }

  const expiry = new Date(baseDate);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry.toISOString();
}

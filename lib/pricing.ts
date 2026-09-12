export type PlanId = 'free' | 'premium';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanPricing {
  monthly: number;
  yearly: number;
}

export interface PlanLimits {
  maxHabits: number;
  analyticsHistoryDays: number;
  maxReminders: number;
  exportFormats: readonly string[];
  aiCoach: boolean;
  videoAttachments: boolean;
  patternAnalysis: boolean;
  habitLock: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: PlanPricing;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    limits: {
      maxHabits: 5,
      analyticsHistoryDays: 30,
      maxReminders: 1,
      exportFormats: ['json'] as const,
      aiCoach: false,
      videoAttachments: false,
      patternAnalysis: false,
      habitLock: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    // Recommended prices from DECISIONS.md D2 & doc 03 §2: $4.99/mo, $39.99/yr
    price: { monthly: 4.99, yearly: 39.99 },
    limits: {
      maxHabits: Infinity,
      analyticsHistoryDays: Infinity,
      maxReminders: Infinity,
      exportFormats: ['json', 'csv', 'xlsx', 'pdf'] as const,
      aiCoach: true,
      videoAttachments: true,
      patternAnalysis: true,
      habitLock: true,
    },
  },
} as const;

export const TRIAL_DAYS = 7;
export const CURRENCY = 'USD';

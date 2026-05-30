/**
 * Subscription Entitlement Core Engine
 * 
 * Centralized subscription state management and feature gating system.
 * Provides type-safe utilities to evaluate user entitlements and access rights.
 * 
 * @module lib/subscription
 */

import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

// ===================================================
// TYPE DEFINITIONS
// ===================================================

export type PlanTier = "FREE" | "BUILDER" | "FOUNDER";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "expired";

export interface UserEntitlement {
  tier: PlanTier;
  status: SubscriptionStatus;
  hasAccess: boolean;
  isTrial: boolean;
  isActive: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  daysUntilExpiry: number | null;
}

export interface PlanFeatures {
  // Session limits
  maxMentorSessions: number | null; // null = unlimited
  maxExpertConnections: number | null;
  
  // Venture features
  canPublishVenture: boolean;
  canAccessAdvancedAnalytics: boolean;
  canUseAIAssistant: boolean;
  
  // Communication features
  canSendDirectMessages: boolean;
  maxMessagesPerDay: number | null;
  
  // Platform features
  canAccessPremiumContent: boolean;
  canAttendExclusiveEvents: boolean;
  prioritySupport: boolean;
  
  // Credits
  monthlyCredits: number;
  creditMultiplier: number; // 1.0 = normal, 1.5 = 50% bonus
}

// ===================================================
// PLAN TIER CONFIGURATIONS
// ===================================================

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  FREE: {
    maxMentorSessions: 2,
    maxExpertConnections: 3,
    canPublishVenture: false,
    canAccessAdvancedAnalytics: false,
    canUseAIAssistant: false,
    canSendDirectMessages: true,
    maxMessagesPerDay: 10,
    canAccessPremiumContent: false,
    canAttendExclusiveEvents: false,
    prioritySupport: false,
    monthlyCredits: 100,
    creditMultiplier: 1.0,
  },
  BUILDER: {
    maxMentorSessions: 10,
    maxExpertConnections: 15,
    canPublishVenture: true,
    canAccessAdvancedAnalytics: true,
    canUseAIAssistant: true,
    canSendDirectMessages: true,
    maxMessagesPerDay: 50,
    canAccessPremiumContent: true,
    canAttendExclusiveEvents: false,
    prioritySupport: false,
    monthlyCredits: 500,
    creditMultiplier: 1.2,
  },
  FOUNDER: {
    maxMentorSessions: null, // unlimited
    maxExpertConnections: null, // unlimited
    canPublishVenture: true,
    canAccessAdvancedAnalytics: true,
    canUseAIAssistant: true,
    canSendDirectMessages: true,
    maxMessagesPerDay: null, // unlimited
    canAccessPremiumContent: true,
    canAttendExclusiveEvents: true,
    prioritySupport: true,
    monthlyCredits: 2000,
    creditMultiplier: 1.5,
  },
};

export const PLAN_PRICES = {
  FREE: 0,
  BUILDER: 29, // $29/month
  FOUNDER: 99, // $99/month
};

export const TRIAL_DURATION_DAYS = 14;

// ===================================================
// CORE UTILITY FUNCTIONS
// ===================================================

/**
 * Get user's subscription entitlement and access rights
 * 
 * @param userId - Clerk User ID
 * @returns UserEntitlement object with tier, status, and access information
 * 
 * @example
 * ```typescript
 * const entitlement = await getUserEntitlement(userId);
 * if (!entitlement.hasAccess) {
 *   throw new Error("Subscription expired");
 * }
 * ```
 */
export async function getUserEntitlement(userId: string): Promise<UserEntitlement> {
  // Fetch user's subscription from database
  const [subscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  // If no subscription exists, create a default FREE tier subscription
  if (!subscription) {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    const [newSubscription] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        planTier: "FREE",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: null, // FREE tier has no end date
        trialEndsAt: trialEnd,
      })
      .returning();

    return {
      tier: "FREE",
      status: "active",
      hasAccess: true,
      isTrial: true,
      isActive: true,
      currentPeriodStart: newSubscription.currentPeriodStart,
      currentPeriodEnd: newSubscription.currentPeriodEnd,
      trialEndsAt: newSubscription.trialEndsAt,
      daysUntilExpiry: TRIAL_DURATION_DAYS,
    };
  }

  // Parse subscription data
  const tier = subscription.planTier as PlanTier;
  const status = subscription.status as SubscriptionStatus;
  const now = new Date();

  // Check if subscription is active
  const isActive = status === "active";
  
  // Check if user is in trial period
  const isTrial = subscription.trialEndsAt ? now < subscription.trialEndsAt : false;
  
  // Check if subscription has expired
  const isExpired = subscription.currentPeriodEnd 
    ? now > subscription.currentPeriodEnd 
    : false;

  // Determine if user has access
  const hasAccess = isActive && !isExpired;

  // Calculate days until expiry
  let daysUntilExpiry: number | null = null;
  if (subscription.currentPeriodEnd) {
    const diffTime = subscription.currentPeriodEnd.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (isTrial && subscription.trialEndsAt) {
    const diffTime = subscription.trialEndsAt.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    tier,
    status,
    hasAccess,
    isTrial,
    isActive,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    daysUntilExpiry,
  };
}

/**
 * Get plan features for a specific tier
 * 
 * @param tier - Plan tier (FREE, BUILDER, FOUNDER)
 * @returns PlanFeatures object with feature flags and limits
 * 
 * @example
 * ```typescript
 * const features = getPlanFeatures("BUILDER");
 * if (features.canPublishVenture) {
 *   // Allow venture publishing
 * }
 * ```
 */
export function getPlanFeatures(tier: PlanTier): PlanFeatures {
  return PLAN_FEATURES[tier];
}

/**
 * Check if user has access to a specific feature
 * 
 * @param userId - Clerk User ID
 * @param feature - Feature key to check
 * @returns Boolean indicating if user has access
 * 
 * @example
 * ```typescript
 * const canPublish = await hasFeatureAccess(userId, "canPublishVenture");
 * if (!canPublish) {
 *   throw new Error("Upgrade to BUILDER plan to publish ventures");
 * }
 * ```
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const entitlement = await getUserEntitlement(userId);
  
  if (!entitlement.hasAccess) {
    return false;
  }

  const features = getPlanFeatures(entitlement.tier);
  const featureValue = features[feature];

  // Handle boolean features
  if (typeof featureValue === "boolean") {
    return featureValue;
  }

  // Handle numeric features (null means unlimited)
  if (typeof featureValue === "number" || featureValue === null) {
    return true; // User has access, but may have limits
  }

  return false;
}

/**
 * Check if user can perform an action based on usage limits
 * 
 * @param userId - Clerk User ID
 * @param feature - Feature key to check
 * @param currentUsage - Current usage count
 * @returns Boolean indicating if user can perform action
 * 
 * @example
 * ```typescript
 * const sessionsCount = await getSessionCount(userId);
 * const canBook = await canPerformAction(userId, "maxMentorSessions", sessionsCount);
 * if (!canBook) {
 *   throw new Error("Session limit reached. Upgrade to book more sessions.");
 * }
 * ```
 */
export async function canPerformAction(
  userId: string,
  feature: keyof PlanFeatures,
  currentUsage: number
): Promise<boolean> {
  const entitlement = await getUserEntitlement(userId);
  
  if (!entitlement.hasAccess) {
    return false;
  }

  const features = getPlanFeatures(entitlement.tier);
  const limit = features[feature];

  // If limit is null, it's unlimited
  if (limit === null) {
    return true;
  }

  // If limit is a number, check if usage is below limit
  if (typeof limit === "number") {
    return currentUsage < limit;
  }

  // For boolean features, return the feature value
  if (typeof limit === "boolean") {
    return limit;
  }

  return false;
}

/**
 * Require specific plan tier or throw error
 * 
 * @param userId - Clerk User ID
 * @param requiredTier - Minimum required tier
 * @throws Error if user doesn't have required tier
 * 
 * @example
 * ```typescript
 * await requirePlanTier(userId, "BUILDER");
 * // Continues if user has BUILDER or FOUNDER tier
 * // Throws error if user has FREE tier
 * ```
 */
export async function requirePlanTier(
  userId: string,
  requiredTier: PlanTier
): Promise<void> {
  const entitlement = await getUserEntitlement(userId);

  if (!entitlement.hasAccess) {
    throw new Error("Your subscription has expired. Please renew to continue.");
  }

  const tierHierarchy: Record<PlanTier, number> = {
    FREE: 0,
    BUILDER: 1,
    FOUNDER: 2,
  };

  const userTierLevel = tierHierarchy[entitlement.tier];
  const requiredTierLevel = tierHierarchy[requiredTier];

  if (userTierLevel < requiredTierLevel) {
    throw new Error(
      `This feature requires ${requiredTier} plan. Please upgrade your subscription.`
    );
  }
}

/**
 * Update user's subscription tier
 * 
 * @param userId - Clerk User ID
 * @param newTier - New plan tier
 * @param periodEnd - Optional period end date
 * @returns Updated subscription
 * 
 * @example
 * ```typescript
 * const endDate = new Date();
 * endDate.setMonth(endDate.getMonth() + 1);
 * await updateSubscriptionTier(userId, "BUILDER", endDate);
 * ```
 */
export async function updateSubscriptionTier(
  userId: string,
  newTier: PlanTier,
  periodEnd?: Date
) {
  const now = new Date();

  const [updated] = await db
    .update(userSubscriptions)
    .set({
      planTier: newTier,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd || null,
      updatedAt: now,
    })
    .where(eq(userSubscriptions.userId, userId))
    .returning();

  return updated;
}

/**
 * Cancel user's subscription
 * 
 * @param userId - Clerk User ID
 * @param immediate - If true, cancel immediately. If false, cancel at period end.
 * @returns Updated subscription
 * 
 * @example
 * ```typescript
 * await cancelSubscription(userId, false); // Cancel at period end
 * ```
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false
) {
  const now = new Date();

  const updateData: any = {
    status: immediate ? "canceled" : "active",
    canceledAt: now,
    updatedAt: now,
  };

  if (immediate) {
    updateData.currentPeriodEnd = now;
  }

  const [updated] = await db
    .update(userSubscriptions)
    .set(updateData)
    .where(eq(userSubscriptions.userId, userId))
    .returning();

  return updated;
}

/**
 * Get subscription summary for display
 * 
 * @param userId - Clerk User ID
 * @returns Formatted subscription summary
 * 
 * @example
 * ```typescript
 * const summary = await getSubscriptionSummary(userId);
 * console.log(`Plan: ${summary.planName}`);
 * console.log(`Status: ${summary.statusLabel}`);
 * ```
 */
export async function getSubscriptionSummary(userId: string) {
  const entitlement = await getUserEntitlement(userId);
  const features = getPlanFeatures(entitlement.tier);

  return {
    tier: entitlement.tier,
    planName: entitlement.tier.charAt(0) + entitlement.tier.slice(1).toLowerCase(),
    status: entitlement.status,
    statusLabel: entitlement.status.replace("_", " ").toUpperCase(),
    hasAccess: entitlement.hasAccess,
    isTrial: entitlement.isTrial,
    isActive: entitlement.isActive,
    currentPeriodStart: entitlement.currentPeriodStart,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    trialEndsAt: entitlement.trialEndsAt,
    daysUntilExpiry: entitlement.daysUntilExpiry,
    features,
    price: PLAN_PRICES[entitlement.tier],
  };
}

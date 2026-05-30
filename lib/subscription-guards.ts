/**
 * Subscription Guards
 * 
 * Middleware helpers for protecting API routes and server actions
 * based on subscription tier and feature access.
 * 
 * @module lib/subscription-guards
 */

import {
  getUserEntitlement,
  hasFeatureAccess,
  canPerformAction,
  requirePlanTier,
  type PlanTier,
  type PlanFeatures,
} from "@/lib/subscription";
import { ApiRouteError } from "@/lib/api/route-helpers";

/**
 * Guard: Require active subscription
 * Throws error if user's subscription is not active
 * 
 * @param userId - Clerk User ID
 * @throws ApiRouteError if subscription is not active
 * 
 * @example
 * ```typescript
 * export const POST = async (req: Request) => {
 *   const userId = await requireAuth();
 *   await requireActiveSubscription(userId);
 *   // Continue with protected logic
 * };
 * ```
 */
export async function requireActiveSubscription(userId: string): Promise<void> {
  const entitlement = await getUserEntitlement(userId);

  if (!entitlement.hasAccess) {
    throw new ApiRouteError(
      403,
      "Your subscription has expired. Please renew to continue.",
      { code: "SUBSCRIPTION_EXPIRED" }
    );
  }

  if (!entitlement.isActive) {
    throw new ApiRouteError(
      403,
      "Your subscription is not active. Please contact support.",
      { code: "SUBSCRIPTION_INACTIVE" }
    );
  }
}

/**
 * Guard: Require specific plan tier
 * Throws error if user doesn't have required tier or higher
 * 
 * @param userId - Clerk User ID
 * @param requiredTier - Minimum required tier
 * @throws ApiRouteError if user doesn't have required tier
 * 
 * @example
 * ```typescript
 * export const POST = async (req: Request) => {
 *   const userId = await requireAuth();
 *   await requireTier(userId, "BUILDER");
 *   // Only BUILDER and FOUNDER users can proceed
 * };
 * ```
 */
export async function requireTier(
  userId: string,
  requiredTier: PlanTier
): Promise<void> {
  try {
    await requirePlanTier(userId, requiredTier);
  } catch (error) {
    throw new ApiRouteError(
      403,
      error instanceof Error ? error.message : "Insufficient plan tier",
      { code: "INSUFFICIENT_TIER", requiredTier }
    );
  }
}

/**
 * Guard: Require specific feature access
 * Throws error if user doesn't have access to the feature
 * 
 * @param userId - Clerk User ID
 * @param feature - Feature key to check
 * @throws ApiRouteError if user doesn't have feature access
 * 
 * @example
 * ```typescript
 * export const POST = async (req: Request) => {
 *   const userId = await requireAuth();
 *   await requireFeature(userId, "canPublishVenture");
 *   // Only users with venture publishing access can proceed
 * };
 * ```
 */
export async function requireFeature(
  userId: string,
  feature: keyof PlanFeatures
): Promise<void> {
  const hasAccess = await hasFeatureAccess(userId, feature);

  if (!hasAccess) {
    const entitlement = await getUserEntitlement(userId);
    throw new ApiRouteError(
      403,
      `This feature requires a higher plan tier. Your current plan: ${entitlement.tier}`,
      { code: "FEATURE_NOT_AVAILABLE", feature, currentTier: entitlement.tier }
    );
  }
}

/**
 * Guard: Check usage limit
 * Throws error if user has reached their usage limit
 * 
 * @param userId - Clerk User ID
 * @param feature - Feature key to check
 * @param currentUsage - Current usage count
 * @throws ApiRouteError if usage limit is reached
 * 
 * @example
 * ```typescript
 * export const POST = async (req: Request) => {
 *   const userId = await requireAuth();
 *   const sessionCount = await getSessionCount(userId);
 *   await checkUsageLimit(userId, "maxMentorSessions", sessionCount);
 *   // User can book another session
 * };
 * ```
 */
export async function checkUsageLimit(
  userId: string,
  feature: keyof PlanFeatures,
  currentUsage: number
): Promise<void> {
  const canPerform = await canPerformAction(userId, feature, currentUsage);

  if (!canPerform) {
    const entitlement = await getUserEntitlement(userId);
    throw new ApiRouteError(
      403,
      `You have reached your ${feature} limit. Please upgrade your plan.`,
      { 
        code: "USAGE_LIMIT_REACHED", 
        feature, 
        currentUsage,
        currentTier: entitlement.tier 
      }
    );
  }
}

/**
 * Guard: Require non-trial subscription
 * Throws error if user is still in trial period
 * 
 * @param userId - Clerk User ID
 * @throws ApiRouteError if user is in trial
 * 
 * @example
 * ```typescript
 * export const POST = async (req: Request) => {
 *   const userId = await requireAuth();
 *   await requirePaidSubscription(userId);
 *   // Only paid subscribers can proceed
 * };
 * ```
 */
export async function requirePaidSubscription(userId: string): Promise<void> {
  const entitlement = await getUserEntitlement(userId);

  if (entitlement.isTrial) {
    throw new ApiRouteError(
      403,
      "This feature is not available during trial period. Please upgrade to a paid plan.",
      { code: "TRIAL_RESTRICTION" }
    );
  }
}

/**
 * Get user's remaining quota for a feature
 * 
 * @param userId - Clerk User ID
 * @param feature - Feature key to check
 * @param currentUsage - Current usage count
 * @returns Remaining quota (null if unlimited)
 * 
 * @example
 * ```typescript
 * const sessionCount = await getSessionCount(userId);
 * const remaining = await getRemainingQuota(userId, "maxMentorSessions", sessionCount);
 * console.log(`You can book ${remaining} more sessions`);
 * ```
 */
export async function getRemainingQuota(
  userId: string,
  feature: keyof PlanFeatures,
  currentUsage: number
): Promise<number | null> {
  const entitlement = await getUserEntitlement(userId);
  
  if (!entitlement.hasAccess) {
    return 0;
  }

  const { getPlanFeatures } = await import("@/lib/subscription");
  const features = getPlanFeatures(entitlement.tier);
  const limit = features[feature];

  // If limit is null, it's unlimited
  if (limit === null) {
    return null;
  }

  // If limit is a number, calculate remaining
  if (typeof limit === "number") {
    return Math.max(0, limit - currentUsage);
  }

  // For boolean features, return 1 if true, 0 if false
  if (typeof limit === "boolean") {
    return limit ? 1 : 0;
  }

  return 0;
}

/**
 * Check if user can access a route based on subscription
 * Returns boolean instead of throwing error
 * 
 * @param userId - Clerk User ID
 * @param requiredTier - Minimum required tier (optional)
 * @returns Boolean indicating if user can access
 * 
 * @example
 * ```typescript
 * const canAccess = await canAccessRoute(userId, "BUILDER");
 * if (!canAccess) {
 *   return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
 * }
 * ```
 */
export async function canAccessRoute(
  userId: string,
  requiredTier?: PlanTier
): Promise<boolean> {
  try {
    await requireActiveSubscription(userId);
    
    if (requiredTier) {
      await requireTier(userId, requiredTier);
    }
    
    return true;
  } catch {
    return false;
  }
}

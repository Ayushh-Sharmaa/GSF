/**
 * Subscription Expiry Scheduler  (fix for issue #133)
 *
 * Replaces polling-based expiry checks with precise per-subscription
 * setTimeout jobs.  When a job fires it immediately invalidates the
 * entitlement cache so the user loses access at the exact expiry
 * timestamp rather than at the next poll cycle.
 *
 * GRACE_PERIOD_MS  — operator-configurable, defaults to 0.
 * Replace setTimeout with BullMQ for multi-instance / persistent jobs.
 */

import { subscriptionBus } from "./subscriptions";
import { PlanId } from "./plans";

export const GRACE_PERIOD_MS = Number(process.env.EXPIRY_GRACE_PERIOD_MS ?? 0);

export interface ScheduledExpiry {
  userId: string;
  planId: PlanId;
  expiresAt: Date;
  timeoutHandle?: ReturnType<typeof setTimeout>;
}

// In-memory registry — replace with DB-backed store for persistence
const expiryRegistry = new Map<string, ScheduledExpiry>();

/**
 * Schedule an expiry job for a user's subscription.
 * Calling this again for the same user cancels the previous job.
 */
export function scheduleExpiry(
  userId: string,
  planId: PlanId,
  expiresAt: Date
): void {
  // Cancel any existing job for this user
  cancelExpiry(userId);

  const msUntilExpiry = expiresAt.getTime() - Date.now() + GRACE_PERIOD_MS;

  if (msUntilExpiry <= 0) {
    // Already expired — revoke immediately
    revokeAccess(userId, planId);
    return;
  }

  const handle = setTimeout(() => {
    revokeAccess(userId, planId);
  }, msUntilExpiry);

  expiryRegistry.set(userId, { userId, planId, expiresAt, timeoutHandle: handle });

  console.log(
    "[ExpiryScheduler] Scheduled expiry for user=" + userId +
    " in " + msUntilExpiry + "ms (grace=" + GRACE_PERIOD_MS + "ms)"
  );
}

/**
 * Cancel a scheduled expiry job (e.g. user renewed their plan).
 */
export function cancelExpiry(userId: string): void {
  const existing = expiryRegistry.get(userId);
  if (existing?.timeoutHandle !== undefined) {
    clearTimeout(existing.timeoutHandle);
    expiryRegistry.delete(userId);
    console.log("[ExpiryScheduler] Cancelled expiry for user=" + userId);
  }
}

/**
 * Immediately revoke access and emit subscription.expired event.
 * The entitlementSync listener picks this up and recalculates.
 */
function revokeAccess(userId: string, planId: PlanId): void {
  expiryRegistry.delete(userId);
  subscriptionBus.emit("subscription.expired", { userId, planId, expiredAt: new Date().toISOString() });
  console.log("[ExpiryScheduler] Subscription expired for user=" + userId);
}

/** Returns the scheduled expiry entry for a user (for testing). */
export function getScheduledExpiry(userId: string): ScheduledExpiry | undefined {
  return expiryRegistry.get(userId);
}

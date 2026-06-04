import { EventEmitter } from "events";
import { isDowngrade } from "./entitlements";
import { PlanId } from "./plans";

export const subscriptionBus = new EventEmitter();

export interface DowngradeEvent {
  userId: string;
  oldPlanId: PlanId;
  newPlanId: PlanId;
  downgradedAt: string;
}

const userPlans: Record<string, PlanId> = {};

export function getUserPlan(userId: string): PlanId {
  return userPlans[userId] ?? "free";
}

export function changePlan(userId: string, newPlanId: PlanId): void {
  const oldPlanId = getUserPlan(userId);
  userPlans[userId] = newPlanId;

  if (isDowngrade(oldPlanId, newPlanId)) {
    const event: DowngradeEvent = {
      userId,
      oldPlanId,
      newPlanId,
      downgradedAt: new Date().toISOString(),
    };
    subscriptionBus.emit("subscription.downgraded", event);
    console.log("[Subscription] Downgrade: user=" + userId + " " + oldPlanId + " to " + newPlanId);
  }
}

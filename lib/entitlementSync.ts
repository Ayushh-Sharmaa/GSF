import { subscriptionBus, DowngradeEvent } from "./subscriptions";
import { getEntitlementsForPlan } from "./entitlements";

subscriptionBus.on("subscription.downgraded", (event: DowngradeEvent) => {
  const { userId, newPlanId } = event;
  const updatedFeatures = getEntitlementsForPlan(newPlanId);
  console.log("[Entitlement] Recalculated for user=" + userId + " features: " + updatedFeatures.join(", "));
});

console.log("[EntitlementSync] Listening for subscription.downgraded events");

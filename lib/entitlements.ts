import { PLANS, PlanId } from "./plans";

export function getEntitlementsForPlan(planId: PlanId): string[] {
  return [...PLANS[planId].features];
}

export function hasFeature(planId: PlanId, feature: string): boolean {
  return PLANS[planId].features.includes(feature as never);
}

export function isDowngrade(oldPlanId: PlanId, newPlanId: PlanId): boolean {
  return PLANS[newPlanId].tierLevel < PLANS[oldPlanId].tierLevel;
}

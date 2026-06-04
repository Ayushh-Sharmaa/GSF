import { writeFileSync, mkdirSync } from "fs";

mkdirSync("lib", { recursive: true });
mkdirSync("__tests__", { recursive: true });
mkdirSync("app/api/subscription/change", { recursive: true });

// ── lib/plans.ts ──────────────────────────────────────────
writeFileSync("lib/plans.ts", `\
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    tierLevel: 0,
    features: ["community_access", "basic_profile"],
  },
  builder: {
    id: "builder",
    name: "Builder",
    tierLevel: 1,
    features: ["community_access", "basic_profile", "connect_calls", "list_ventures"],
  },
  founder: {
    id: "founder",
    name: "Founder",
    tierLevel: 2,
    features: [
      "community_access",
      "basic_profile",
      "connect_calls",
      "list_ventures",
      "investor_intros",
      "dedicated_advisor",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
`, { encoding: "utf8" });
console.log("✓ lib/plans.ts");

// ── lib/entitlements.ts ───────────────────────────────────
writeFileSync("lib/entitlements.ts", `\
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
`, { encoding: "utf8" });
console.log("✓ lib/entitlements.ts");

// ── lib/subscriptions.ts ──────────────────────────────────
writeFileSync("lib/subscriptions.ts", `\
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
`, { encoding: "utf8" });
console.log("✓ lib/subscriptions.ts");

// ── lib/entitlementSync.ts ────────────────────────────────
writeFileSync("lib/entitlementSync.ts", `\
import { subscriptionBus, DowngradeEvent } from "./subscriptions";
import { getEntitlementsForPlan } from "./entitlements";

subscriptionBus.on("subscription.downgraded", (event: DowngradeEvent) => {
  const { userId, newPlanId } = event;
  const updatedFeatures = getEntitlementsForPlan(newPlanId);
  console.log("[Entitlement] Recalculated for user=" + userId + " features: " + updatedFeatures.join(", "));
});

console.log("[EntitlementSync] Listening for subscription.downgraded events");
`, { encoding: "utf8" });
console.log("✓ lib/entitlementSync.ts");

// ── __tests__/entitlementDowngrade.test.ts ────────────────
writeFileSync("__tests__/entitlementDowngrade.test.ts", `\
import { describe, it, expect, vi } from "vitest";
import { changePlan, getUserPlan, subscriptionBus } from "../lib/subscriptions";
import { getEntitlementsForPlan, hasFeature } from "../lib/entitlements";
import "../lib/entitlementSync";

describe("Entitlement revocation on plan downgrade (#135)", () => {

  it("should revoke founder-tier features immediately after downgrade to free", () =>
    new Promise<void>((resolve) => {
      const userId = "test-user-downgrade-001";
      const start = Date.now();

      changePlan(userId, "founder");
      expect(hasFeature("founder", "investor_intros")).toBe(true);

      subscriptionBus.once("subscription.downgraded", (event) => {
        const elapsed = Date.now() - start;
        expect(event.userId).toBe(userId);
        expect(event.oldPlanId).toBe("founder");
        expect(event.newPlanId).toBe("free");

        const currentFeatures = getEntitlementsForPlan(getUserPlan(userId));
        expect(currentFeatures).not.toContain("investor_intros");
        expect(currentFeatures).not.toContain("dedicated_advisor");
        expect(currentFeatures).toContain("community_access");

        expect(elapsed).toBeLessThan(1000);
        resolve();
      });

      changePlan(userId, "free");
    })
  );

  it("should NOT emit downgrade event on upgrade", () => {
    const userId = "test-user-upgrade-002";
    const handler = vi.fn();
    changePlan(userId, "free");
    subscriptionBus.once("subscription.downgraded", handler);
    changePlan(userId, "founder");
    expect(handler).not.toHaveBeenCalled();
  });

  it("should NOT emit downgrade event on same-plan change", () => {
    const userId = "test-user-same-003";
    const handler = vi.fn();
    changePlan(userId, "builder");
    subscriptionBus.once("subscription.downgraded", handler);
    changePlan(userId, "builder");
    expect(handler).not.toHaveBeenCalled();
  });

});
`, { encoding: "utf8" });
console.log("✓ __tests__/entitlementDowngrade.test.ts");

console.log("\nAll files created successfully!");
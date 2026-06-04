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

"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export type PlanTier = "FREE" | "BUILDER" | "FOUNDER";

export interface SubscriptionSummary {
  tier: PlanTier;
  planName: string;
  status: string;
  statusLabel: string;
  hasAccess: boolean;
  isTrial: boolean;
  isActive: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  daysUntilExpiry: number | null;
  features: PlanFeatures;
  price: number;
}

export interface PlanFeatures {
  maxMentorSessions: number | null;
  maxExpertConnections: number | null;
  canPublishVenture: boolean;
  canAccessAdvancedAnalytics: boolean;
  canUseAIAssistant: boolean;
  canSendDirectMessages: boolean;
  maxMessagesPerDay: number | null;
  canAccessPremiumContent: boolean;
  canAttendExclusiveEvents: boolean;
  prioritySupport: boolean;
  monthlyCredits: number;
  creditMultiplier: number;
}

export function useSubscription() {
  const { isSignedIn } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/subscription");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }

      const data = await response.json();
      
      // Parse dates
      if (data.currentPeriodStart) {
        data.currentPeriodStart = new Date(data.currentPeriodStart);
      }
      if (data.currentPeriodEnd) {
        data.currentPeriodEnd = new Date(data.currentPeriodEnd);
      }
      if (data.trialEndsAt) {
        data.trialEndsAt = new Date(data.trialEndsAt);
      }

      setSubscription(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription");
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  const updateSubscription = useCallback(async (
    planTier: PlanTier,
    periodEnd?: Date
  ) => {
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier,
          periodEnd: periodEnd?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }

      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("Error updating subscription:", err);
      return false;
    }
  }, [fetchSubscription]);

  const cancelSubscription = useCallback(async (immediate: boolean = false) => {
    try {
      const response = await fetch("/api/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediate }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("Error canceling subscription:", err);
      return false;
    }
  }, [fetchSubscription]);

  const hasFeature = useCallback((feature: keyof PlanFeatures): boolean => {
    if (!subscription) return false;
    const featureValue = subscription.features[feature];
    
    if (typeof featureValue === "boolean") {
      return featureValue;
    }
    
    return featureValue !== null && featureValue > 0;
  }, [subscription]);

  const canPerformAction = useCallback((
    feature: keyof PlanFeatures,
    currentUsage: number
  ): boolean => {
    if (!subscription) return false;
    const limit = subscription.features[feature];

    if (limit === null) return true; // Unlimited
    if (typeof limit === "number") return currentUsage < limit;
    if (typeof limit === "boolean") return limit;
    
    return false;
  }, [subscription]);

  const getRemainingQuota = useCallback((
    feature: keyof PlanFeatures,
    currentUsage: number
  ): number | null => {
    if (!subscription) return 0;
    const limit = subscription.features[feature];

    if (limit === null) return null; // Unlimited
    if (typeof limit === "number") return Math.max(0, limit - currentUsage);
    if (typeof limit === "boolean") return limit ? 1 : 0;
    
    return 0;
  }, [subscription]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    updateSubscription,
    cancelSubscription,
    refetch: fetchSubscription,
    hasFeature,
    canPerformAction,
    getRemainingQuota,
    // Convenience getters
    tier: subscription?.tier || "FREE",
    isFreeTier: subscription?.tier === "FREE",
    isBuilderTier: subscription?.tier === "BUILDER",
    isFounderTier: subscription?.tier === "FOUNDER",
    isTrial: subscription?.isTrial || false,
    hasAccess: subscription?.hasAccess || false,
    daysUntilExpiry: subscription?.daysUntilExpiry || null,
  };
}

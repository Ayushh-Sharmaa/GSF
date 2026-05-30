import { NextResponse } from "next/server";
import {
  requireAuth,
  withRouteErrorHandling,
  parseQuery,
} from "@/lib/api/route-helpers";
import {
  getUserEntitlement,
  getPlanFeatures,
  hasFeatureAccess,
  canPerformAction,
} from "@/lib/subscription";
import { z } from "zod";

const featuresQuerySchema = z.object({
  feature: z.string().optional(),
  currentUsage: z.string().optional(), // Will be parsed to number
});

// GET /api/subscription/features - Get user's plan features and check access
export const GET = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const query = parseQuery(req, featuresQuerySchema);

  const entitlement = await getUserEntitlement(userId);
  const features = getPlanFeatures(entitlement.tier);

  // If specific feature is requested, check access
  if (query.feature) {
    const hasAccess = await hasFeatureAccess(userId, query.feature as any);

    // If currentUsage is provided, check if action can be performed
    if (query.currentUsage !== undefined) {
      const currentUsage = parseInt(query.currentUsage, 10);
      const canPerform = await canPerformAction(
        userId,
        query.feature as any,
        currentUsage
      );

      return NextResponse.json({
        feature: query.feature,
        hasAccess,
        canPerform,
        currentUsage,
        limit: features[query.feature as keyof typeof features],
      });
    }

    return NextResponse.json({
      feature: query.feature,
      hasAccess,
      value: features[query.feature as keyof typeof features],
    });
  }

  // Return all features
  return NextResponse.json({
    tier: entitlement.tier,
    features,
    entitlement: {
      hasAccess: entitlement.hasAccess,
      isTrial: entitlement.isTrial,
      isActive: entitlement.isActive,
      daysUntilExpiry: entitlement.daysUntilExpiry,
    },
  });
});

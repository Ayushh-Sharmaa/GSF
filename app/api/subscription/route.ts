import { NextResponse } from "next/server";
import {
  requireAuth,
  withRouteErrorHandling,
  ApiRouteError,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import {
  getUserEntitlement,
  getSubscriptionSummary,
  updateSubscriptionTier,
  cancelSubscription,
  type PlanTier,
} from "@/lib/subscription";
import { z } from "zod";

const updateSubscriptionSchema = z.object({
  planTier: z.enum(["FREE", "BUILDER", "FOUNDER"]),
  periodEnd: z.string().optional(), // ISO date string
});

const cancelSubscriptionSchema = z.object({
  immediate: z.boolean().optional().default(false),
});

// GET /api/subscription - Get user's subscription details
export const GET = withRouteErrorHandling(async () => {
  const userId = await requireAuth();

  const summary = await getSubscriptionSummary(userId);

  return NextResponse.json(summary);
});

// POST /api/subscription - Update user's subscription tier
export const POST = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const body = await parseJsonBody(req, updateSubscriptionSchema);

  const periodEnd = body.periodEnd ? new Date(body.periodEnd) : undefined;

  const updated = await updateSubscriptionTier(
    userId,
    body.planTier as PlanTier,
    periodEnd
  );

  return NextResponse.json(updated, { status: 200 });
});

// DELETE /api/subscription - Cancel user's subscription
export const DELETE = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const body = await parseJsonBody(req, cancelSubscriptionSchema);

  const updated = await cancelSubscription(userId, body.immediate);

  return NextResponse.json(updated, { status: 200 });
});

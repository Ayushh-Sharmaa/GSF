import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionFeedback, sessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  parseJsonBody,
  parseQuery,
  requireAuth,
  withRouteErrorHandling,
  ApiRouteError,
} from "@/lib/api/route-helpers";
import {
  feedbackPostSchema,
  feedbackQuerySchema,
} from "@/lib/validators/api-routes";

export const POST = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const body = await parseJsonBody(req, feedbackPostSchema);
  const { sessionId, rating, feedback } = body;

  // Verify session exists and user is the founder
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new ApiRouteError(404, "Session not found");
  }

  if (session.founderClerkId !== userId) {
    throw new ApiRouteError(403, "Only the founder can leave feedback");
  }

  // Check if feedback already exists for this session
  const [existing] = await db
    .select()
    .from(sessionFeedback)
    .where(eq(sessionFeedback.sessionId, sessionId))
    .limit(1);

  if (existing) {
    throw new ApiRouteError(409, "Feedback already submitted for this session");
  }

  const [created] = await db
    .insert(sessionFeedback)
    .values({
      sessionId,
      founderClerkId: userId,
      expertClerkId: session.expertClerkId,
      rating,
      feedback: feedback || "",
    })
    .returning();

  await db
    .update(sessions)
    .set({
      status: "completed",
      recordingReadyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId));

  return NextResponse.json(created, { status: 201 });
});

// GET feedback for a session or expert
export const GET = withRouteErrorHandling(async (req: Request) => {
  const query = parseQuery(req, feedbackQuerySchema);
  const { sessionId, expertClerkId } = query;

  if (sessionId) {
    const rows = await db
      .select()
      .from(sessionFeedback)
      .where(eq(sessionFeedback.sessionId, sessionId));
    return NextResponse.json(rows);
  }

  if (expertClerkId) {
    const rows = await db
      .select()
      .from(sessionFeedback)
      .where(eq(sessionFeedback.expertClerkId, expertClerkId));

    // Calculate average rating
    const avgRating =
      rows.length > 0
        ? (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(1)
        : 0;

    return NextResponse.json({
      feedback: rows,
      averageRating: avgRating,
      totalReviews: rows.length,
    });
  }

  throw new ApiRouteError(400, "sessionId or expertClerkId required");
});


import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, sessionFeedback } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { awardSessionCompletionCredits } from "@/lib/credits-server";
import { requireAuth, withRouteErrorHandling, ApiRouteError, parseJsonBody } from "@/lib/api/route-helpers";

const DEMO_SESSIONS: Record<string, Record<string, unknown>> = {
  "demo-1": {
    id: "demo-1",
    founderName: "Arjun Sharma",
    expertName: "Dr. Anika Patel",
    ventureName: "EduLoop",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    meetingUrl: "/session-room/demo-1",
    recordingUrl: "/session-room/demo-1/recording",
  },
  "demo-2": {
    id: "demo-2",
    founderName: "Priya Mehta",
    expertName: "James Whitfield",
    ventureName: "Supplify",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    meetingUrl: "/session-room/demo-2",
    recordingUrl: "/session-room/demo-2/recording",
  },
  "demo-3": {
    id: "demo-3",
    founderName: "Rahul Kumar",
    expertName: "Sara Mensah",
    ventureName: "HealthBridge",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    meetingUrl: "/session-room/demo-3",
    recordingUrl: "/session-room/demo-3/recording",
  },
};

export const GET = withRouteErrorHandling(async (_: Request, context: { params: Promise<{ sessionId: string }> }) => {
  const { sessionId } = await context.params;

  if (sessionId.startsWith("demo-") && DEMO_SESSIONS[sessionId]) {
    return NextResponse.json(DEMO_SESSIONS[sessionId]);
  }

  const userId = await requireAuth();

  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (rows.length === 0) {
    throw new ApiRouteError(404, "Session not found");
  }

  const session = rows[0];
  if (session.founderClerkId !== userId && session.expertClerkId !== userId) {
    throw new ApiRouteError(403, "Forbidden");
  }

  const [feedback] = await db
    .select()
    .from(sessionFeedback)
    .where(eq(sessionFeedback.sessionId, sessionId))
    .limit(1);

  return NextResponse.json({
    ...session,
    meetingUrl: session.meetingUrl || `/session-room/${session.id}`,
    recordingUrl: session.recordingUrl || `/session-room/${session.id}/recording`,
    feedbackRating: feedback?.rating ?? null,
    feedbackNotes: feedback?.feedback ?? null,
    feedbackCreatedAt: feedback?.createdAt ?? null,
  });
});

export const PATCH = withRouteErrorHandling(async (req: Request, context: { params: Promise<{ sessionId: string }> }) => {
  const { sessionId } = await context.params;
  const userId = await requireAuth();

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new ApiRouteError(404, "Session not found");
  }

  if (session.founderClerkId !== userId && session.expertClerkId !== userId) {
    throw new ApiRouteError(403, "Forbidden");
  }

  const body = await parseJsonBody(req, sessionsPatchSchema);
  const status = body.status;
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

  if (scheduledAt && scheduledAt <= new Date()) {
    throw new ApiRouteError(400, "scheduledAt must be in the future");
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (status) {
    updates.status = status;
    if (status === "completed") {
      updates.recordingReadyAt = new Date();
    }
  }

  if (scheduledAt) {
    updates.scheduledAt = scheduledAt;
  }

  const [updated] = await db
    .update(sessions)
    .set(updates)
    .where(eq(sessions.id, sessionId))
    .returning();

  if (status === "completed" && session.status !== "completed") {
    try {
      await awardSessionCompletionCredits(
        session.id,
        session.expertClerkId,
        session.creditsEarned,
      );
    } catch (err) {
      console.error("Failed to award expert credits for session", session.id, err);
    }
  }

  return NextResponse.json(updated);
});
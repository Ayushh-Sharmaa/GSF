import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inAppNotifications } from "@/lib/schema";
import {
  parseJsonBody,
  requireAuth,
  withRouteErrorHandling,
  ApiRouteError,
} from "@/lib/api/route-helpers";
import { z } from "zod";

const createNotificationSchema = z.object({
  recipientClerkId: z.string().min(1),
  type: z.enum(["message", "session", "system", "venture", "credit"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
});

// GET /api/in-app-notifications - Fetch user's notifications
export const GET = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";

  let query = db
    .select()
    .from(inAppNotifications)
    .where(eq(inAppNotifications.recipientClerkId, userId))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(50);

  if (unreadOnly) {
    query = db
      .select()
      .from(inAppNotifications)
      .where(
        and(
          eq(inAppNotifications.recipientClerkId, userId),
          eq(inAppNotifications.isRead, false)
        )
      )
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(50);
  }

  const notifications = await query;
  return NextResponse.json(notifications);
});

// POST /api/in-app-notifications - Create a new notification
export const POST = withRouteErrorHandling(async (req: Request) => {
  await requireAuth(); // Only authenticated users can create notifications
  
  const body = await parseJsonBody(req, createNotificationSchema);

  const [notification] = await db
    .insert(inAppNotifications)
    .values({
      recipientClerkId: body.recipientClerkId,
      type: body.type,
      title: body.title,
      message: body.message,
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      metadata: body.metadata || {},
    })
    .returning();

  return NextResponse.json(notification, { status: 201 });
});

// PATCH /api/in-app-notifications - Mark notifications as read
export const PATCH = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const body = await parseJsonBody(req, markReadSchema);

  if (body.markAll) {
    // Mark all unread notifications as read
    await db
      .update(inAppNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(inAppNotifications.recipientClerkId, userId),
          eq(inAppNotifications.isRead, false)
        )
      );

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  }

  if (body.notificationIds && body.notificationIds.length > 0) {
    // Mark specific notifications as read
    for (const notificationId of body.notificationIds) {
      await db
        .update(inAppNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(inAppNotifications.id, notificationId),
            eq(inAppNotifications.recipientClerkId, userId)
          )
        );
    }

    return NextResponse.json({ 
      success: true, 
      message: `${body.notificationIds.length} notification(s) marked as read` 
    });
  }

  throw new ApiRouteError(400, "Either markAll or notificationIds must be provided");
});

// DELETE /api/in-app-notifications - Delete a notification
export const DELETE = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  const url = new URL(req.url);
  const notificationId = url.searchParams.get("id");

  if (!notificationId) {
    throw new ApiRouteError(400, "Notification ID is required");
  }

  const [deleted] = await db
    .delete(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.id, notificationId),
        eq(inAppNotifications.recipientClerkId, userId)
      )
    )
    .returning();

  if (!deleted) {
    throw new ApiRouteError(404, "Notification not found");
  }

  return NextResponse.json({ success: true, message: "Notification deleted" });
});

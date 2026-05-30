import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/schema";
import {
  parseJsonBody,
  requireAuth,
  withRouteErrorHandling,
  ApiRouteError,
} from "@/lib/api/route-helpers";
import { conversationsMessagePostSchema } from "@/lib/validators/api-routes";
import { notificationService } from "@/lib/services/notificationService";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

async function getConversation(conversationId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return conversation ?? null;
}

export const GET = withRouteErrorHandling(async (_: Request, context: RouteContext) => {
  const { conversationId } = await context.params;
  const userId = await requireAuth();

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new ApiRouteError(404, "Conversation not found");
  }

  if (conversation.founderClerkId !== userId && conversation.expertClerkId !== userId) {
    throw new ApiRouteError(403, "Forbidden");
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt));

  return NextResponse.json(rows.reverse());
});

export const POST = withRouteErrorHandling(async (req: Request, context: RouteContext) => {
  const { conversationId } = await context.params;
  const userId = await requireAuth();

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new ApiRouteError(404, "Conversation not found");
  }

  if (conversation.founderClerkId !== userId && conversation.expertClerkId !== userId) {
    throw new ApiRouteError(403, "Forbidden");
  }

  const body = await parseJsonBody(req, conversationsMessagePostSchema);
  const { message: messageText, senderName = userId } = body;

  const [created] = await db
    .insert(messages)
    .values({
      conversationId,
      senderClerkId: userId,
      senderName,
      body: messageText,
    })
    .returning();

  // Determine recipient and send notification
  const recipientClerkId = conversation.founderClerkId === userId 
    ? conversation.expertClerkId 
    : conversation.founderClerkId;

  if (conversation.founderClerkId === userId) {
    await db
      .update(conversations)
      .set({
        lastMessage: messageText,
        lastMessageBy: userId,
        expertUnread: (conversation.expertUnread ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  } else {
    await db
      .update(conversations)
      .set({
        lastMessage: messageText,
        lastMessageBy: userId,
        founderUnread: (conversation.founderUnread ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  // Send in-app notification to recipient
  try {
    await notificationService.notifyNewMessage({
      recipientClerkId,
      senderName,
      conversationId,
      messagePreview: messageText.substring(0, 100),
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
    // Don't fail the request if notification fails
  }

  return NextResponse.json(created, { status: 201 });
});


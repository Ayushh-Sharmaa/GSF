import { db } from "@/lib/db";
import { inAppNotifications } from "@/lib/schema";

export type NotificationType = "message" | "session" | "system" | "venture" | "credit";

export interface CreateNotificationParams {
  recipientClerkId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an in-app notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const [notification] = await db
    .insert(inAppNotifications)
    .values({
      recipientClerkId: params.recipientClerkId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      metadata: params.metadata || {},
    })
    .returning();

  return notification;
}

/**
 * Notification templates for common scenarios
 */
export const notificationTemplates = {
  newMessage: (senderName: string, conversationId: string) => ({
    type: "message" as const,
    title: "New message",
    message: `${senderName} sent you a message`,
    actionUrl: `/chat?conversation=${conversationId}`,
    actionLabel: "View message",
  }),

  sessionBooked: (expertName: string, sessionId: string, scheduledAt: Date) => ({
    type: "session" as const,
    title: "Session booked",
    message: `Your session with ${expertName} is scheduled for ${scheduledAt.toLocaleDateString()}`,
    actionUrl: `/sessions/${sessionId}`,
    actionLabel: "View session",
  }),

  sessionReminder: (expertName: string, sessionId: string, minutesUntil: number) => ({
    type: "session" as const,
    title: "Session reminder",
    message: `Your session with ${expertName} starts in ${minutesUntil} minutes`,
    actionUrl: `/sessions/${sessionId}`,
    actionLabel: "Join session",
  }),

  sessionCompleted: (expertName: string, sessionId: string) => ({
    type: "session" as const,
    title: "Session completed",
    message: `Your session with ${expertName} has been completed. Please leave feedback!`,
    actionUrl: `/sessions/${sessionId}/feedback`,
    actionLabel: "Leave feedback",
  }),

  creditsAdded: (amount: number, reason: string) => ({
    type: "credit" as const,
    title: "Credits added",
    message: `${amount} credits have been added to your account. ${reason}`,
    actionUrl: "/credits",
    actionLabel: "View balance",
  }),

  creditsDeducted: (amount: number, reason: string) => ({
    type: "credit" as const,
    title: "Credits used",
    message: `${amount} credits have been deducted from your account. ${reason}`,
    actionUrl: "/credits",
    actionLabel: "View balance",
  }),

  ventureInterest: (investorName: string, ventureId: string) => ({
    type: "venture" as const,
    title: "New investment interest",
    message: `${investorName} is interested in your venture`,
    actionUrl: `/ventures/${ventureId}`,
    actionLabel: "View details",
  }),

  systemAnnouncement: (title: string, message: string, actionUrl?: string) => ({
    type: "system" as const,
    title,
    message,
    actionUrl,
    actionLabel: actionUrl ? "Learn more" : undefined,
  }),
};

/**
 * Helper to send a notification using a template
 */
export async function sendNotification(
  recipientClerkId: string,
  template: ReturnType<typeof notificationTemplates[keyof typeof notificationTemplates]>,
  metadata?: Record<string, any>
) {
  return createNotification({
    recipientClerkId,
    ...template,
    metadata,
  });
}

/**
 * Notification Service
 * 
 * High-level service for sending notifications in common scenarios.
 * Use these functions instead of directly calling the notification API.
 */

import { sendNotification, notificationTemplates } from "@/lib/notifications";

export const notificationService = {
  /**
   * Notify user of a new message
   */
  async notifyNewMessage(params: {
    recipientClerkId: string;
    senderName: string;
    conversationId: string;
    messagePreview?: string;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.newMessage(params.senderName, params.conversationId),
      { messagePreview: params.messagePreview }
    );
  },

  /**
   * Notify user of a booked session
   */
  async notifySessionBooked(params: {
    recipientClerkId: string;
    expertName: string;
    sessionId: string;
    scheduledAt: Date;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.sessionBooked(
        params.expertName,
        params.sessionId,
        params.scheduledAt
      )
    );
  },

  /**
   * Send session reminder
   */
  async notifySessionReminder(params: {
    recipientClerkId: string;
    expertName: string;
    sessionId: string;
    minutesUntil: number;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.sessionReminder(
        params.expertName,
        params.sessionId,
        params.minutesUntil
      )
    );
  },

  /**
   * Notify session completion
   */
  async notifySessionCompleted(params: {
    recipientClerkId: string;
    expertName: string;
    sessionId: string;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.sessionCompleted(params.expertName, params.sessionId)
    );
  },

  /**
   * Notify credits added
   */
  async notifyCreditsAdded(params: {
    recipientClerkId: string;
    amount: number;
    reason: string;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.creditsAdded(params.amount, params.reason)
    );
  },

  /**
   * Notify credits deducted
   */
  async notifyCreditsDeducted(params: {
    recipientClerkId: string;
    amount: number;
    reason: string;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.creditsDeducted(params.amount, params.reason)
    );
  },

  /**
   * Notify venture interest
   */
  async notifyVentureInterest(params: {
    recipientClerkId: string;
    investorName: string;
    ventureId: string;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.ventureInterest(params.investorName, params.ventureId)
    );
  },

  /**
   * Send system announcement to user
   */
  async notifySystemAnnouncement(params: {
    recipientClerkId: string;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    return sendNotification(
      params.recipientClerkId,
      notificationTemplates.systemAnnouncement(
        params.title,
        params.message,
        params.actionUrl
      )
    );
  },

  /**
   * Send system announcement to multiple users
   */
  async broadcastSystemAnnouncement(params: {
    recipientClerkIds: string[];
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    const promises = params.recipientClerkIds.map((recipientClerkId) =>
      this.notifySystemAnnouncement({
        recipientClerkId,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
      })
    );

    return Promise.allSettled(promises);
  },

  /**
   * Send custom notification
   */
  async sendCustom(params: {
    recipientClerkId: string;
    type: "message" | "session" | "system" | "venture" | "credit";
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }) {
    return sendNotification(
      params.recipientClerkId,
      {
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        actionLabel: params.actionLabel,
      },
      params.metadata
    );
  },
};

/**
 * Example usage:
 * 
 * // In your API route or server action
 * import { notificationService } from "@/lib/services/notificationService";
 * 
 * // Send a message notification
 * await notificationService.notifyNewMessage({
 *   recipientClerkId: "user_123",
 *   senderName: "John Doe",
 *   conversationId: "conv_456",
 * });
 * 
 * // Send session reminder
 * await notificationService.notifySessionReminder({
 *   recipientClerkId: "user_123",
 *   expertName: "Jane Smith",
 *   sessionId: "session_789",
 *   minutesUntil: 15,
 * });
 * 
 * // Broadcast announcement to all users
 * await notificationService.broadcastSystemAnnouncement({
 *   recipientClerkIds: ["user_1", "user_2", "user_3"],
 *   title: "Platform Update",
 *   message: "We've added new features!",
 *   actionUrl: "/updates",
 * });
 */

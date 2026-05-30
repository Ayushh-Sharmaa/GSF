"use client";

import { useEffect } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { toast } from "sonner";
import { Bell, MessageSquare, Calendar, Coins, Lightbulb } from "lucide-react";

const notificationIcons = {
  message: MessageSquare,
  session: Calendar,
  system: Bell,
  venture: Lightbulb,
  credit: Coins,
};

/**
 * Component that listens for new notifications and displays toast alerts
 * Should be mounted once at the app root level
 */
export function NotificationToast() {
  const { notifications } = useNotifications();

  useEffect(() => {
    // Get the most recent unread notification
    const latestUnread = notifications.find((n) => !n.isRead);
    
    if (latestUnread) {
      const Icon = notificationIcons[latestUnread.type as keyof typeof notificationIcons] || Bell;
      
      toast(latestUnread.title, {
        description: latestUnread.message,
        icon: <Icon className="size-5" />,
        action: latestUnread.actionUrl
          ? {
              label: latestUnread.actionLabel || "View",
              onClick: () => {
                window.location.href = latestUnread.actionUrl!;
              },
            }
          : undefined,
        duration: 5000,
      });
    }
  }, [notifications]);

  return null; // This component doesn't render anything
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { InAppNotification } from "@/lib/schema";

export function useNotifications() {
  const { isSignedIn } = useUser();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      setLoading(true);
      const response = await fetch("/api/in-app-notifications");
      
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: InAppNotification) => !n.isRead).length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Mark notification(s) as read
  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    try {
      const response = await fetch("/api/in-app-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          notificationIds 
            ? { notificationIds } 
            : { markAll: true }
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          !notificationIds || notificationIds.includes(n.id)
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
      
      if (!notificationIds) {
        setUnreadCount(0);
      } else {
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/in-app-notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // Update local state
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, []);

  // Set up real-time SSE connection
  useEffect(() => {
    if (!isSignedIn) return;

    // Initial fetch
    void fetchNotifications();

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource("/api/in-app-notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "notifications" && data.data) {
          // Add new notifications to the list
          setNotifications((prev) => {
            const newNotifications = data.data.filter(
              (newNotif: InAppNotification) =>
                !prev.some((existingNotif) => existingNotif.id === newNotif.id)
            );
            
            if (newNotifications.length > 0) {
              setUnreadCount((count) => count + newNotifications.length);
              return [...newNotifications, ...prev];
            }
            
            return prev;
          });
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isSignedIn, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

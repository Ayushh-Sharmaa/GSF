"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils/date";
import type { InAppNotification } from "@/lib/schema";

const notificationIcons = {
  message: "💬",
  session: "📅",
  system: "🔔",
  venture: "💡",
  credit: "💰",
};

function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete 
}: { 
  notification: InAppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const icon = notificationIcons[notification.type as keyof typeof notificationIcons] || "🔔";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "group relative p-4 border-b border-border hover:bg-canvas transition-colors",
        !notification.isRead && "bg-primary-50/30 dark:bg-primary-900/10"
      )}
    >
      <div className="flex gap-3">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium text-text-primary",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </h4>
            
            {!notification.isRead && (
              <span className="size-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-text-muted">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {notification.actionUrl && notification.actionLabel && (
              <a
                href={notification.actionUrl}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {notification.actionLabel}
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 transition-colors"
            title="Mark as read"
          >
            <Check className="size-3.5" />
          </button>
        )}
        
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotification 
  } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAllRead = () => {
    void markAsRead();
  };

  const handleMarkRead = (id: string) => {
    void markAsRead([id]);
  };

  const handleDelete = (id: string) => {
    void deleteNotification(id);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-colors",
          isOpen 
            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" 
            : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
        )}
      >
        <Bell className="size-5" />
        
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-xl shadow-soft-lg overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-canvas">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </button>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-text-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="size-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-text-muted mt-3">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="size-12 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-text-primary">No notifications</p>
                  <p className="text-xs text-text-muted mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
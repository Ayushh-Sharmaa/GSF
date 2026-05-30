"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Bell, MessageSquare, Calendar, Coins, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const notificationTypes = [
  { type: "message", icon: MessageSquare, label: "Message", color: "text-blue-600" },
  { type: "session", icon: Calendar, label: "Session", color: "text-green-600" },
  { type: "credit", icon: Coins, label: "Credit", color: "text-yellow-600" },
  { type: "venture", icon: Lightbulb, label: "Venture", color: "text-purple-600" },
  { type: "system", icon: Bell, label: "System", color: "text-gray-600" },
];

export default function TestNotificationsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const sendTestNotification = async (type: string) => {
    if (!user) {
      toast.error("You must be signed in to test notifications");
      return;
    }

    setLoading(true);
    try {
      const titles: Record<string, string> = {
        message: "New message from John Doe",
        session: "Session booked with Sarah Smith",
        credit: "100 credits added to your account",
        venture: "New investment interest in your venture",
        system: "Platform maintenance scheduled",
      };

      const messages: Record<string, string> = {
        message: "Hey! I'd love to discuss your venture idea. Are you available for a quick chat?",
        session: "Your mentorship session is scheduled for tomorrow at 2:00 PM",
        credit: "Congratulations! You've earned 100 credits for completing your profile",
        venture: "Alex Johnson is interested in investing in your startup",
        system: "We'll be performing scheduled maintenance on Sunday at 3:00 AM EST",
      };

      const response = await fetch("/api/in-app-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientClerkId: user.id,
          type,
          title: titles[type],
          message: messages[type],
          actionUrl: type === "message" ? "/chat" : type === "session" ? "/sessions" : undefined,
          actionLabel: type === "message" ? "View message" : type === "session" ? "View session" : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create notification");
      }

      toast.success("Test notification sent!", {
        description: "Check the notification bell in the header",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to test the notification system
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Notification System Test
          </h1>
          <p className="text-text-secondary">
            Test the real-time notification system by sending yourself test notifications.
            Check the notification bell in the header to see them appear in real-time.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Test Notifications</CardTitle>
            <CardDescription>
              Click any button below to send yourself a test notification of that type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notificationTypes.map(({ type, icon: Icon, label, color }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="lg"
                  onClick={() => sendTestNotification(type)}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 h-auto py-6"
                >
                  <Icon className={`size-8 ${color}`} />
                  <span className="font-medium">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Real-time delivery via Server-Sent Events (SSE)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Notification bell with unread counter badge</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Dropdown panel with recent notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Mark as read functionality (individual or all)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Delete notifications capability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Toast notifications for immediate alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">✓</span>
                <span>Action buttons for quick navigation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-text-secondary list-decimal list-inside">
              <li>Click a button above to create a test notification</li>
              <li>The notification is saved to the database</li>
              <li>SSE connection detects the new notification</li>
              <li>Notification bell updates with unread count</li>
              <li>Toast notification appears briefly</li>
              <li>Click the bell to view all notifications</li>
              <li>Mark as read or delete notifications as needed</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

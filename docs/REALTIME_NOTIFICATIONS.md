# Real-Time Chat & Notification System

## Overview

The GSF platform now includes a comprehensive real-time communication and notification system that provides instant updates without page refreshes. This system enhances user engagement and ensures users never miss important platform activity.

## Features

### 🔔 In-App Notifications
- **Real-time delivery** via Server-Sent Events (SSE)
- **Notification bell** with unread counter badge
- **Dropdown panel** showing recent notifications
- **Mark as read** functionality (individual or all)
- **Delete notifications** capability
- **Action buttons** for quick navigation
- **Toast notifications** for immediate alerts

### 💬 Chat Integration
- Automatic notifications when new messages arrive
- Unread message counters
- Direct links to conversations

### 📊 Notification Types
- **Message** - New chat messages
- **Session** - Session bookings, reminders, completions
- **Credit** - Credit additions/deductions
- **Venture** - Investment interests, updates
- **System** - Platform announcements

## Architecture

### Database Schema

```sql
CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY,
  recipient_clerk_id TEXT NOT NULL,
  type TEXT NOT NULL, -- message | session | system | venture | credit
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### GET `/api/in-app-notifications`
Fetch user's notifications
- Query params: `unreadOnly=true` (optional)
- Returns: Array of notifications

#### POST `/api/in-app-notifications`
Create a new notification
```json
{
  "recipientClerkId": "user_xxx",
  "type": "message",
  "title": "New message",
  "message": "John sent you a message",
  "actionUrl": "/chat?conversation=123",
  "actionLabel": "View message"
}
```

#### PATCH `/api/in-app-notifications`
Mark notifications as read
```json
{
  "notificationIds": ["id1", "id2"], // or
  "markAll": true
}
```

#### DELETE `/api/in-app-notifications?id=xxx`
Delete a notification

#### GET `/api/in-app-notifications/stream`
Server-Sent Events endpoint for real-time updates
- Automatically pushes new notifications to connected clients
- Heartbeat every 3 seconds to keep connection alive

## Usage

### Using the Notification Hook

```tsx
import { useNotifications } from "@/lib/hooks/useNotifications";

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotification 
  } = useNotifications();

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notif => (
        <div key={notif.id}>
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
          <button onClick={() => markAsRead([notif.id])}>
            Mark as read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Creating Notifications

```typescript
import { sendNotification, notificationTemplates } from "@/lib/notifications";

// Using a template
await sendNotification(
  recipientClerkId,
  notificationTemplates.newMessage("John Doe", conversationId)
);

// Custom notification
await sendNotification(
  recipientClerkId,
  {
    type: "system",
    title: "Welcome!",
    message: "Thanks for joining GSF",
    actionUrl: "/onboarding",
    actionLabel: "Get started"
  }
);
```

### Available Templates

```typescript
notificationTemplates.newMessage(senderName, conversationId)
notificationTemplates.sessionBooked(expertName, sessionId, scheduledAt)
notificationTemplates.sessionReminder(expertName, sessionId, minutesUntil)
notificationTemplates.sessionCompleted(expertName, sessionId)
notificationTemplates.creditsAdded(amount, reason)
notificationTemplates.creditsDeducted(amount, reason)
notificationTemplates.ventureInterest(investorName, ventureId)
notificationTemplates.systemAnnouncement(title, message, actionUrl?)
```

## Components

### NotificationBell
The main notification UI component with dropdown panel
- Shows unread count badge
- Displays recent notifications
- Mark as read/delete actions
- Auto-closes on outside click

```tsx
import { NotificationBell } from "@/components/ui/NotificationBell";

<NotificationBell />
```

### NotificationToast
Displays toast alerts for new notifications
- Should be mounted once at app root level
- Automatically shows toasts for new unread notifications

```tsx
import { NotificationToast } from "@/components/ui/NotificationToast";

<NotificationToast />
```

## Integration Points

### Existing Features Enhanced

1. **Chat System** (`/app/api/conversations/[conversationId]/messages/route.ts`)
   - Automatically sends notifications when messages are sent
   - Updates unread counters

2. **Dashboard Layouts** (`/components/layout/DashboardLayout.tsx`)
   - NotificationBell integrated in header
   - NotificationToast mounted for real-time alerts

3. **Navbar** (`/components/layout/Navbar.tsx`)
   - NotificationBell visible for authenticated users

## Migration

Run the migration to create the notifications table:

```bash
# Using your preferred database migration tool
psql $DATABASE_URL < migrations/001_add_in_app_notifications.sql
```

Or use Drizzle Kit:

```bash
npm run db:push
```

## Performance Considerations

- **SSE Connection**: One persistent connection per user
- **Polling Interval**: 3 seconds for new notifications
- **Query Limits**: Max 50 notifications fetched at once
- **Indexes**: Optimized queries on `recipient_clerk_id` and `is_read`

## Security

- All endpoints require authentication via Clerk
- Users can only access their own notifications
- Recipient validation on notification creation
- SQL injection protection via Drizzle ORM

## Future Enhancements

- [ ] Push notifications (browser/mobile)
- [ ] Email digest for unread notifications
- [ ] Notification preferences/settings
- [ ] Notification grouping (e.g., "3 new messages")
- [ ] WebSocket upgrade for lower latency
- [ ] Notification sound effects
- [ ] Read receipts for messages

## Troubleshooting

### Notifications not appearing
1. Check SSE connection in Network tab
2. Verify user is authenticated
3. Check database for notification records
4. Ensure NotificationToast is mounted

### High database load
1. Review notification creation frequency
2. Add rate limiting if needed
3. Consider archiving old notifications
4. Optimize queries with proper indexes

## Testing

```typescript
// Create a test notification
await fetch("/api/in-app-notifications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipientClerkId: "user_xxx",
    type: "system",
    title: "Test Notification",
    message: "This is a test",
  })
});
```

## Support

For issues or questions about the notification system:
1. Check this documentation
2. Review the code in `/lib/notifications.ts`
3. Inspect browser console for errors
4. Check server logs for API errors

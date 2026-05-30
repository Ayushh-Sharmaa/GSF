import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { inAppNotifications } from "@/lib/schema";
import { and, desc, eq, gt } from "drizzle-orm";

// Server-Sent Events endpoint for real-time notifications
export async function GET(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      let lastCheckTime = new Date();

      // Poll for new notifications every 3 seconds
      intervalId = setInterval(async () => {
        try {
          // Fetch notifications created since last check
          const newNotifications = await db
            .select()
            .from(inAppNotifications)
            .where(
              and(
                eq(inAppNotifications.recipientClerkId, userId),
                gt(inAppNotifications.createdAt, lastCheckTime)
              )
            )
            .orderBy(desc(inAppNotifications.createdAt));

          if (newNotifications.length > 0) {
            // Send new notifications to client
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: "notifications", 
                  data: newNotifications 
                })}\n\n`
              )
            );
            
            lastCheckTime = new Date();
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }, 3000);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

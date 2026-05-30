// ===== DRIZZLE ORM SCHEMA =====
// Tables: ventures, expert_profiles, sessions, credit_transactions, credit_balances
// Identity (name, email, PFP) lives in Clerk.
// Profile extras (bio, location, links) live in Clerk unsafeMetadata.
// App data (ventures, sessions, credits log, credit balances) lives here in Supabase.
//
// CREDIT SYSTEM NOTE:
// credit_balances is the canonical source of truth for a user's credit balance.
// Clerk publicMetadata.credits is a read-only cache for display purposes only.
// All balance mutations go through lib/credits-server.ts which wraps the
// balance update + transaction log insert in a single DB transaction.

import {
  pgTable, text, integer, boolean,
  timestamp, jsonb, uuid,
} from "drizzle-orm/pg-core";

// ===================================================
// USERS (synced from Clerk via webhooks)
// ===================================================
export const users = pgTable("users", {
  id:            uuid("id").defaultRandom().primaryKey(),
  clerkId:       text("clerk_id").notNull().unique(),
  name:          text("name").notNull(),
  email:         text("email").notNull(),
  role:          text("role").default("student"),
  cohortId:      uuid("cohort_id"),
  avatarUrl:     text("avatar_url"),
  bio:           text("bio"),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onboarding:    jsonb("onboarding").$type<any>().default({}),
  isActive:      boolean("is_active").default(true),
  createdAt:     timestamp("created_at").defaultNow(),
  updatedAt:     timestamp("updated_at").defaultNow(),
});

// ===================================================
// AVAILABILITY SLOTS  (expert calendars)
// ===================================================
export const availabilitySlots = pgTable("availability_slots", {
  id:              uuid("id").defaultRandom().primaryKey(),
  expertClerkId:    text("expert_clerk_id").notNull(),
  expertName:       text("expert_name").notNull(),
  startAt:          timestamp("start_at").notNull(),
  endAt:            timestamp("end_at").notNull(),
  timezone:         text("timezone").default("Asia/Kolkata"),
  notes:            text("notes").default(""),
  isBooked:         boolean("is_booked").default(false),
  bookedByClerkId:  text("booked_by_clerk_id"),
  bookedSessionId:  uuid("booked_session_id"),
  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
});

// ===================================================
// VENTURES  (one per founder)
// ===================================================
export const ventures = pgTable("ventures", {
  id:              uuid("id").defaultRandom().primaryKey(),
  clerkUserId:     text("clerk_user_id").notNull().unique(),
  name:            text("name").notNull().default(""),
  tagline:         text("tagline").default(""),
  description:     text("description").default(""),
  stage:           text("stage").default("Ideation"),
  sector:          text("sector").default(""),
  equity:          text("equity").default("0"),
  fundingGoal:     text("funding_goal").default("0"),
  traction:        text("traction").default(""),
  teamSize:        integer("team_size").default(1),
  pitchDeckUrl:    text("pitch_deck_url"),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers:     jsonb("team_members").$type<any[]>().default([]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tractionMetrics: jsonb("traction_metrics").$type<any>().default({}),
  
  // Marketplace UI Enhancements
  founderName:     text("founder_name").default(""),
  fundingStage:    text("funding_stage").default("Pre-seed"),
  tags:            jsonb("tags").$type<string[]>().default([]),
  views:           integer("views").default(0),
  campaignEndsAt:  timestamp("campaign_ends_at"),

  createdAt:       timestamp("created_at").defaultNow(),
  updatedAt:       timestamp("updated_at").defaultNow(),
});

// ===================================================
// EXPERT PROFILES  (one per expert)
// ===================================================
export const expertProfiles = pgTable("expert_profiles", {
  id:               uuid("id").defaultRandom().primaryKey(),
  clerkUserId:      text("clerk_user_id").notNull().unique(),
  title:            text("title").default(""),
  company:          text("company").default(""),
  location:         text("location").default(""),
  linkedin:         text("linkedin").default(""),
  website:          text("website").default(""),
  experience:       text("experience").default(""),
  specializations:  text("specializations").array().default([]),
  sessionRate:      integer("session_rate").default(100),
  weeklySlots:      integer("weekly_slots").default(4),
  totalSessions:    integer("total_sessions").default(0),
  rating:           text("rating").default("0"),
  isVerified:       boolean("is_verified").default(false),
  tags:             text("tags").array().default([]),
  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
});

// ===================================================
// SESSIONS  (expert ↔ founder)
// ===================================================
export const sessions = pgTable("sessions", {
  id:             uuid("id").defaultRandom().primaryKey(),
  founderClerkId: text("founder_clerk_id").notNull(),
  expertClerkId:  text("expert_clerk_id").notNull(),
  founderName:    text("founder_name").default(""),
  expertName:     text("expert_name").default(""),
  ventureName:    text("venture_name").default(""),
  scheduledAt:    timestamp("scheduled_at").notNull(),
  duration:       integer("duration").default(30),
  status:         text("status").default("pending"),  // pending | confirmed | completed | cancelled
  creditsCost:    integer("credits_cost").default(100),
  creditsEarned:  integer("credits_earned").default(80),
  notes:          text("notes"),
  meetingUrl:     text("meeting_url"),
  recordingUrl:   text("recording_url"),
  recordingReadyAt: timestamp("recording_ready_at"),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

// ===================================================
// NOTIFICATIONS (email log)
// ===================================================
export const notifications = pgTable("notifications", {
  id:          uuid("id").defaultRandom().primaryKey(),
  sessionId:   uuid("session_id"),
  toEmail:     text("to_email").notNull(),
  type:        text("type").notNull(), // booking_confirmation | reminder | recording_ready
  status:      text("status").notNull().default("pending"),
  payload:     jsonb("payload").$type<any>().default({}),
  sentAt:      timestamp("sent_at"),
  createdAt:   timestamp("created_at").defaultNow(),
});

// ===================================================
// IN-APP NOTIFICATIONS (real-time alerts)
// ===================================================
export const inAppNotifications = pgTable("in_app_notifications", {
  id:            uuid("id").defaultRandom().primaryKey(),
  recipientClerkId: text("recipient_clerk_id").notNull(),
  type:          text("type").notNull(), // message | session | system | venture | credit
  title:         text("title").notNull(),
  message:       text("message").notNull(),
  actionUrl:     text("action_url"),
  actionLabel:   text("action_label"),
  metadata:      jsonb("metadata").$type<any>().default({}),
  isRead:        boolean("is_read").default(false),
  readAt:        timestamp("read_at"),
  createdAt:     timestamp("created_at").defaultNow(),
});

// ===================================================
// CREDIT TRANSACTIONS
// ===================================================
export const creditTransactions = pgTable("credit_transactions", {
  id:               uuid("id").defaultRandom().primaryKey(),
  clerkUserId:      text("clerk_user_id").notNull(),
  type:             text("type").notNull(),   // 'credit' | 'debit'
  amount:           integer("amount").notNull(),
  reason:           text("reason").notNull(),
  balanceBefore:    integer("balance_before").notNull(),
  balanceAfter:     integer("balance_after").notNull(),
  relatedSessionId: uuid("related_session_id"),
  createdAt:        timestamp("created_at").defaultNow(),
});

// ===================================================
// INVESTMENT INTERESTS
// ===================================================
export const investmentInterests = pgTable("investment_interests", {
  id:             uuid("id").defaultRandom().primaryKey(),
  ventureId:      uuid("venture_id").notNull(), // should reference ventures.id, keeping simple
  expertClerkId:  text("expert_clerk_id").notNull(),
  status:         text("status").default("pending"), // pending, accepted, rejected
  message:        text("message"),
  createdAt:      timestamp("created_at").defaultNow(),
});

// ===================================================
// CREDIT BALANCES  (one row per user — source of truth)
// ===================================================
export const creditBalances = pgTable("credit_balances", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  balance:     integer("balance").notNull().default(0),
  updatedAt:   timestamp("updated_at").defaultNow(),
});

// ===================================================
// SESSION FEEDBACK (ratings & reviews)
// ===================================================
export const sessionFeedback = pgTable("session_feedback", {
  id:            uuid("id").defaultRandom().primaryKey(),
  sessionId:     uuid("session_id").notNull(),
  founderClerkId: text("founder_clerk_id").notNull(),
  expertClerkId:  text("expert_clerk_id").notNull(),
  rating:        integer("rating").notNull(), // 1-5
  feedback:      text("feedback").default(""),
  createdAt:     timestamp("created_at").defaultNow(),
});

// ===================================================
// ARTICLES (insights publishing)
// ===================================================
export const articles = pgTable("articles", {
  id:          uuid("id").defaultRandom().primaryKey(),
  authorClerkId: text("author_clerk_id").notNull(),
  authorName:   text("author_name").notNull(),
  title:        text("title").notNull(),
  category:     text("category").notNull(), // "Fundraising", "Product", "Growth", etc.
  body:         text("body").notNull(),
  status:       text("status").notNull().default("draft"), // draft | published
  publishedAt:  timestamp("published_at"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
});

// ===================================================
// CONVERSATIONS TABLE (cross-role messaging)
// ===================================================
export const conversations = pgTable("conversations", {
  id:              uuid("id").defaultRandom().primaryKey(),
  founderClerkId:  text("founder_clerk_id").notNull(),
  expertClerkId:   text("expert_clerk_id").notNull(),
  founderName:     text("founder_name").notNull(),
  expertName:      text("expert_name").notNull(),
  founderAvatarUrl: text("founder_avatar_url"),
  expertAvatarUrl: text("expert_avatar_url"),
  lastMessage:     text("last_message"),
  lastMessageBy:   text("last_message_by"),
  founderUnread:   integer("founder_unread").default(0),
  expertUnread:    integer("expert_unread").default(0),
  createdAt:       timestamp("created_at").defaultNow(),
  updatedAt:       timestamp("updated_at").defaultNow(),
});

// ===================================================
// MESSAGES TABLE
// ===================================================
export const messages = pgTable("messages", {
  id:              uuid("id").defaultRandom().primaryKey(),
  conversationId:  uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderClerkId:   text("sender_clerk_id").notNull(),
  senderName:      text("sender_name").notNull(),
  body:            text("body").notNull(),
  readAt:          timestamp("read_at"),
  createdAt:       timestamp("created_at").defaultNow(),
});

// ===================================================
// FEED INTERACTIONS
// ===================================================
export const feedInteractions = pgTable("feed_interactions", {
  id:            uuid("id").defaultRandom().primaryKey(),
  clerkUserId:   text("clerk_user_id").notNull(),
  targetId:      text("target_id").notNull(),
  action:        text("action").notNull(), // connect | dismiss | save
  createdAt:     timestamp("created_at").defaultNow(),
});

// ===================================================
// TYPE EXPORTS
// ===================================================
export type User                 = typeof users.$inferSelect;
export type NewUser              = typeof users.$inferInsert;
export type AvailabilitySlot     = typeof availabilitySlots.$inferSelect;
export type NewAvailabilitySlot  = typeof availabilitySlots.$inferInsert;
export type Venture              = typeof ventures.$inferSelect;
export type NewVenture           = typeof ventures.$inferInsert;
export type ExpertProfile        = typeof expertProfiles.$inferSelect;
export type NewExpertProfile     = typeof expertProfiles.$inferInsert;
export type Session              = typeof sessions.$inferSelect;
export type NewSession           = typeof sessions.$inferInsert;
export type CreditTransaction    = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type InvestmentInterest   = typeof investmentInterests.$inferSelect;
export type NewInvestmentInterest= typeof investmentInterests.$inferInsert;
export type CreditBalance        = typeof creditBalances.$inferSelect;
export type Notification         = typeof notifications.$inferSelect;
export type InAppNotification    = typeof inAppNotifications.$inferSelect;
export type NewInAppNotification = typeof inAppNotifications.$inferInsert;
export type SessionFeedback      = typeof sessionFeedback.$inferSelect;
export type Article              = typeof articles.$inferSelect;
export type NewArticle           = typeof articles.$inferInsert;
export type Conversation         = typeof conversations.$inferSelect;
export type NewConversation      = typeof conversations.$inferInsert;
export type Message              = typeof messages.$inferSelect;
export type NewMessage           = typeof messages.$inferInsert;
export type FeedInteraction     = typeof feedInteractions.$inferSelect;
export type NewFeedInteraction  = typeof feedInteractions.$inferInsert;


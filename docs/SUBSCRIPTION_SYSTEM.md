# 💳 Subscription & Entitlement Core Engine

## Overview

A centralized subscription state management and feature gating system for the GSF platform. This system provides robust database-level tracking and server-side utilities to evaluate user entitlements before executing premium features.

## 🎯 Features

### Core Functionality
- ✅ **Multi-tier subscription framework** (FREE, BUILDER, FOUNDER)
- ✅ **Feature gating** based on subscription tier
- ✅ **Usage limits** and quota tracking
- ✅ **Trial period management** (14-day free trial)
- ✅ **Subscription lifecycle** (active, past_due, canceled, expired)
- ✅ **Type-safe API** with TypeScript
- ✅ **Server-side guards** for route protection
- ✅ **React hooks** for frontend integration
- ✅ **Stripe-ready** (fields included for future integration)

### Plan Tiers

| Feature | FREE | BUILDER | FOUNDER |
|---------|------|---------|---------|
| **Price** | $0/month | $29/month | $99/month |
| **Mentor Sessions** | 2/month | 10/month | Unlimited |
| **Expert Connections** | 3 | 15 | Unlimited |
| **Publish Venture** | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ✅ | ✅ |
| **AI Assistant** | ❌ | ✅ | ✅ |
| **Direct Messages** | 10/day | 50/day | Unlimited |
| **Premium Content** | ❌ | ✅ | ✅ |
| **Exclusive Events** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |
| **Monthly Credits** | 100 | 500 | 2000 |
| **Credit Multiplier** | 1.0x | 1.2x | 1.5x |

## 🗄️ Database Schema

### `user_subscriptions` Table

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan_tier TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP,
  trial_ends_at TIMESTAMP,
  canceled_at TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `user_id` (unique)
- `status`
- `plan_tier`
- `current_period_end`

## 📚 API Reference

### Core Functions

#### `getUserEntitlement(userId: string)`
Get user's subscription entitlement and access rights.

```typescript
const entitlement = await getUserEntitlement(userId);
console.log(entitlement.tier); // "FREE" | "BUILDER" | "FOUNDER"
console.log(entitlement.hasAccess); // boolean
console.log(entitlement.isTrial); // boolean
```

#### `getPlanFeatures(tier: PlanTier)`
Get feature configuration for a specific tier.

```typescript
const features = getPlanFeatures("BUILDER");
console.log(features.maxMentorSessions); // 10
console.log(features.canPublishVenture); // true
```

#### `hasFeatureAccess(userId: string, feature: keyof PlanFeatures)`
Check if user has access to a specific feature.

```typescript
const canPublish = await hasFeatureAccess(userId, "canPublishVenture");
if (!canPublish) {
  throw new Error("Upgrade to BUILDER plan to publish ventures");
}
```

#### `canPerformAction(userId: string, feature: keyof PlanFeatures, currentUsage: number)`
Check if user can perform an action based on usage limits.

```typescript
const sessionsCount = await getSessionCount(userId);
const canBook = await canPerformAction(userId, "maxMentorSessions", sessionsCount);
if (!canBook) {
  throw new Error("Session limit reached. Upgrade to book more sessions.");
}
```

#### `requirePlanTier(userId: string, requiredTier: PlanTier)`
Require specific plan tier or throw error.

```typescript
await requirePlanTier(userId, "BUILDER");
// Continues if user has BUILDER or FOUNDER tier
// Throws error if user has FREE tier
```

### Subscription Guards

#### `requireActiveSubscription(userId: string)`
Ensure user has an active subscription.

```typescript
export const POST = async (req: Request) => {
  const userId = await requireAuth();
  await requireActiveSubscription(userId);
  // Protected logic here
};
```

#### `requireTier(userId: string, requiredTier: PlanTier)`
Require minimum plan tier.

```typescript
export const POST = async (req: Request) => {
  const userId = await requireAuth();
  await requireTier(userId, "BUILDER");
  // Only BUILDER and FOUNDER users can proceed
};
```

#### `requireFeature(userId: string, feature: keyof PlanFeatures)`
Require specific feature access.

```typescript
export const POST = async (req: Request) => {
  const userId = await requireAuth();
  await requireFeature(userId, "canPublishVenture");
  // Only users with venture publishing access can proceed
};
```

#### `checkUsageLimit(userId: string, feature: keyof PlanFeatures, currentUsage: number)`
Check usage limit before allowing action.

```typescript
export const POST = async (req: Request) => {
  const userId = await requireAuth();
  const sessionCount = await getSessionCount(userId);
  await checkUsageLimit(userId, "maxMentorSessions", sessionCount);
  // User can book another session
};
```

## 🔌 API Endpoints

### GET `/api/subscription`
Get user's subscription details.

**Response:**
```json
{
  "tier": "BUILDER",
  "planName": "Builder",
  "status": "active",
  "hasAccess": true,
  "isTrial": false,
  "daysUntilExpiry": 25,
  "features": { ... },
  "price": 29
}
```

### POST `/api/subscription`
Update user's subscription tier.

**Request:**
```json
{
  "planTier": "BUILDER",
  "periodEnd": "2024-12-31T23:59:59Z"
}
```

### DELETE `/api/subscription`
Cancel user's subscription.

**Request:**
```json
{
  "immediate": false
}
```

### GET `/api/subscription/features`
Get user's plan features.

**Query Parameters:**
- `feature` (optional) - Specific feature to check
- `currentUsage` (optional) - Current usage count

**Response:**
```json
{
  "tier": "BUILDER",
  "features": { ... },
  "entitlement": {
    "hasAccess": true,
    "isTrial": false,
    "daysUntilExpiry": 25
  }
}
```

## ⚛️ React Hook

### `useSubscription()`

```typescript
import { useSubscription } from "@/lib/hooks/useSubscription";

function MyComponent() {
  const {
    subscription,
    loading,
    tier,
    isBuilderTier,
    hasFeature,
    canPerformAction,
    getRemainingQuota,
    updateSubscription,
    cancelSubscription,
  } = useSubscription();

  // Check feature access
  if (hasFeature("canPublishVenture")) {
    // Show publish button
  }

  // Check usage limits
  const sessionsCount = 5;
  if (canPerformAction("maxMentorSessions", sessionsCount)) {
    // Allow booking
  }

  // Get remaining quota
  const remaining = getRemainingQuota("maxMentorSessions", sessionsCount);
  console.log(`${remaining} sessions remaining`);

  return (
    <div>
      <p>Current Plan: {tier}</p>
      <p>Status: {subscription?.statusLabel}</p>
    </div>
  );
}
```

## 🛡️ Usage Examples

### Protecting API Routes

```typescript
// app/api/ventures/publish/route.ts
import { requireAuth, withRouteErrorHandling } from "@/lib/api/route-helpers";
import { requireFeature } from "@/lib/subscription-guards";

export const POST = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  
  // Require venture publishing feature
  await requireFeature(userId, "canPublishVenture");
  
  // Publish venture logic
  return NextResponse.json({ success: true });
});
```

### Checking Usage Limits

```typescript
// app/api/sessions/book/route.ts
import { requireAuth, withRouteErrorHandling } from "@/lib/api/route-helpers";
import { checkUsageLimit } from "@/lib/subscription-guards";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { eq, count } from "drizzle-orm";

export const POST = withRouteErrorHandling(async (req: Request) => {
  const userId = await requireAuth();
  
  // Get current session count
  const [result] = await db
    .select({ count: count() })
    .from(sessions)
    .where(eq(sessions.founderClerkId, userId));
  
  const sessionCount = result.count;
  
  // Check if user can book another session
  await checkUsageLimit(userId, "maxMentorSessions", sessionCount);
  
  // Book session logic
  return NextResponse.json({ success: true });
});
```

### Frontend Feature Gating

```typescript
"use client";

import { useSubscription } from "@/lib/hooks/useSubscription";
import { Button } from "@/components/ui/Button";

export function PublishVentureButton() {
  const { hasFeature, tier } = useSubscription();

  if (!hasFeature("canPublishVenture")) {
    return (
      <div>
        <p>Upgrade to BUILDER plan to publish ventures</p>
        <Button href="/pricing">Upgrade Now</Button>
      </div>
    );
  }

  return <Button>Publish Venture</Button>;
}
```

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
psql $DATABASE_URL < migrations/002_add_user_subscriptions.sql
```

### 2. Verify Migration

```bash
psql $DATABASE_URL -c "SELECT * FROM user_subscriptions LIMIT 1;"
```

### 3. Test the System

```typescript
// In any API route or server action
import { getUserEntitlement } from "@/lib/subscription";

const entitlement = await getUserEntitlement(userId);
console.log(entitlement);
```

## 🔒 Security

- ✅ All subscription checks are server-side
- ✅ Database-level constraints on plan tiers and statuses
- ✅ Type-safe API with Zod validation
- ✅ Clerk authentication required
- ✅ Authorization checks before feature access

## 📊 Performance

- Indexed queries for fast lookups
- Efficient database schema
- Caching-ready (can add Redis layer)
- Minimal overhead on API routes

## 🧪 Testing

### Manual Testing

```bash
# Get subscription
curl http://localhost:3000/api/subscription

# Update subscription
curl -X POST http://localhost:3000/api/subscription \
  -H "Content-Type: application/json" \
  -d '{"planTier": "BUILDER"}'

# Get features
curl http://localhost:3000/api/subscription/features
```

### Integration Testing

```typescript
import { getUserEntitlement, hasFeatureAccess } from "@/lib/subscription";

// Test entitlement
const entitlement = await getUserEntitlement("user_123");
expect(entitlement.tier).toBe("FREE");
expect(entitlement.hasAccess).toBe(true);

// Test feature access
const canPublish = await hasFeatureAccess("user_123", "canPublishVenture");
expect(canPublish).toBe(false);
```

## 🔄 Future Enhancements

- [ ] Stripe payment integration
- [ ] Webhook handlers for subscription events
- [ ] Usage analytics dashboard
- [ ] Automated tier upgrades/downgrades
- [ ] Proration calculations
- [ ] Invoice generation
- [ ] Email notifications for subscription events
- [ ] Admin panel for subscription management

## 📝 Migration Guide

### From No Subscription System

1. Run database migration
2. All existing users will be assigned FREE tier automatically
3. Update API routes to use subscription guards
4. Add feature gating to frontend components

### Adding New Features

1. Add feature to `PlanFeatures` interface
2. Update `PLAN_FEATURES` configuration
3. Use `requireFeature()` guard in API routes
4. Use `hasFeature()` in frontend components

## 🤝 Contributing

When adding new subscription features:

1. Update `PlanFeatures` interface in `lib/subscription.ts`
2. Update `PLAN_FEATURES` configuration
3. Add guards if needed in `lib/subscription-guards.ts`
4. Update documentation
5. Add tests

## 📚 Related Documentation

- Database schema: `lib/schema.ts`
- Core utilities: `lib/subscription.ts`
- Guards: `lib/subscription-guards.ts`
- React hook: `lib/hooks/useSubscription.ts`
- API routes: `app/api/subscription/`

---

**Status**: ✅ Ready for Production  
**Version**: 1.0.0  
**Last Updated**: 2024

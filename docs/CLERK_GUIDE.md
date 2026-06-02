# GSF Clerk Authentication Integration Guide

Based on a full scan of the GSF codebase, Clerk is heavily and correctly integrated across the platform. The application uses Clerk as the absolute "Source of Truth" for identity management.

This guide outlines exactly where Clerk is used and how to handle it moving forward.

---

## 1. Where Clerk is Currently Used

Clerk integration has been handled at multiple levels, from edge routing down to component-level conditional rendering.

### Global Architecture
* **`app/layout.tsx`**: Wraps the entire application in `<ClerkProvider>`, injecting the session context globally for all components.
* **`middleware.ts`**: Uses `clerkMiddleware` to run on the Edge, intercepting incoming requests and protecting restricted routes before they reach the server or client.

### Client-Side UI & Dashboards
These files rely on the `useUser()` and `useClerk()` hooks for dynamic state updates:
* **Dashboards & Shells**: `DashboardShell.tsx`, `dashboard/page.tsx`, and `expert-dashboard/page.tsx` use the auth hooks to determine if the user is authenticated, retrieve profile details, and enforce "expert" vs "founder" environments.
* **Nested Protected Pages**: Profile, Chat, Credits, and Venture pages fetch live user state directly from Clerk rather than legacy local storage.
* **Conditional Content**: `app/insights/page.tsx` reads the user's email domain directly out of the Clerk session to conditionally display the **Post Article** button exclusively to GSF team members (`@gsf` emails).
* **Navigation**: `Navbar.tsx` dynamically swaps the "Sign In" button with the active "Dashboard" portal based on auth state.

### Custom Authentication Flows
* **Sign up / Login**: `app/login/page.tsx` and `app/sign-up/page.tsx` manage bespoke authentication screens.
* **SSO & Onboarding**: `sso-callback/page.tsx` gracefully handles third-party sign-ins (like Google), while `onboarding/page.tsx` captures initial user data during first-time setups.

### Backend Server Functions
These files leverage Next.js server-side tools (`auth()` and `clerkClient`):
* **`api/onboarding-complete/route.ts`**: Securely reads the active backend session and mutates internal metadata once users finish onboarding.

---

## 2. Next Steps & Handling Best Practices

Because you are using Clerk for identity, here is how you should handle backend integration and feature expansion moving forward:

### A. Secure Database Syncing (Webhooks)
**Concept**: You don't need to save passwords in your PostgreSQL/Neon database, but you need a database to store app-specific data (e.g., Venture Pitch Decks or Expert Reviews).
**Implementation**: 
1. Create an `/api/webhooks/clerk` endpoint.
2. In the Clerk Dashboard, configure Webhooks for the `user.created` and `user.updated` events. 
3. Whenever someone signs up, Clerk will ping your API, automatically inserting or updating a row in your `users` Postgres table using their `clerk_id` as the primary key.

### B. Leverage `publicMetadata` for Roles
**Concept**: You have "Founders" and "Experts". You should attach this rigidly to the user object inside Clerk.
**Implementation**: 
* During onboarding, use `clerkClient.users.updateUserMetadata(userId, { publicMetadata: { role: "expert" } })`. 
* Moving forward, you never need to query your database to check a user's role. You can instantly read `user.publicMetadata.role` on the frontend, or hit `auth().sessionClaims?.publicMetadata` securely on the backend.

### C. Backend API Protection
**Concept**: As you build features (like saving a Venture or altering Credits), you will write Next.js Server Actions or API routes.
**Implementation**: Wrap these actions to ensure requests cannot be faked. Handle this gracefully by starting every backend function with:
```typescript
import { auth } from "@clerk/nextjs/server";

export async function deductUserCredits() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // Proceed to safely deduct credits in Postgres where id === userId
}
```

### D. Drop-in UI Components
**Concept**: Clerk offers pre-built, highly secure UI modals for account management.
**Implementation**: If you ever want users to manage connected accounts, change passwords, or set up 2FA, you don't have to build custom pages. You can just mount `<UserProfile />` or rely on the `<UserButton />` in your Navbar, which handles password resets and device management automatically.

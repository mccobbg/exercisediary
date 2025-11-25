# Authentication Coding Standards

This document outlines the strict authentication coding standards for this project. All developers must adhere to these guidelines when implementing authentication features.

---

## Authentication Provider

### Clerk - REQUIRED

**ONLY [Clerk](https://clerk.com/) SHALL be used for authentication throughout this project.**

Clerk is a comprehensive authentication and user management solution that handles:
- Sign up and sign in flows
- Session management
- User profile management
- Multi-factor authentication (MFA)
- Social OAuth providers
- Email/password authentication
- Magic links
- Organization management

#### Key Rules:
1. **NO custom authentication logic** should be implemented
2. **ALL authentication** must go through Clerk
3. **NEVER** implement your own JWT validation, session management, or password hashing
4. Use Clerk's provided components, hooks, and server-side utilities
5. Follow [Clerk's Next.js integration guide](https://clerk.com/docs/quickstarts/nextjs)

---

## Installation & Setup

### Required Packages

```bash
npm install @clerk/nextjs
```

### Environment Variables

The following environment variables MUST be configured in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Customize Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Middleware Configuration

**REQUIRED**: Protect routes using Clerk middleware.

**File**: `src/middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Root Layout

Wrap your application with `ClerkProvider` in the root layout.

**File**: `src/app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## Authentication Patterns

### Server Components (PREFERRED)

**ALL authentication checks in Server Components MUST use Clerk's server utilities.**

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';

// Pattern 1: Get user ID only
export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // userId is available for database queries
  const data = await getUserData(userId);

  return <div>Welcome! {data.name}</div>;
}

// Pattern 2: Get full user object
export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

### Client Components

**ALL authentication in Client Components MUST use Clerk's hooks.**

```typescript
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

// Pattern 1: Using useUser hook
export function ProfileCard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <SignInButton />;
  }

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <UserButton />
    </div>
  );
}

// Pattern 2: Using useAuth hook (for userId only)
export function WorkoutList() {
  const { userId, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return <SignInButton />;
  }

  return <div>Your workouts...</div>;
}
```

---

## Clerk Components

### Pre-built UI Components - REQUIRED

Clerk provides pre-built components that MUST be used for authentication flows:

#### Sign In & Sign Up

```typescript
'use client';

import { SignIn, SignUp, SignInButton, SignUpButton } from '@clerk/nextjs';

// Full sign-in page
export default function SignInPage() {
  return <SignIn />;
}

// Full sign-up page
export default function SignUpPage() {
  return <SignUp />;
}

// Sign-in button (opens modal)
export function Header() {
  return (
    <header>
      <SignInButton mode="modal">
        <button>Sign in</button>
      </SignInButton>
    </header>
  );
}
```

#### User Management

```typescript
'use client';

import { UserButton, UserProfile } from '@clerk/nextjs';

// User button (avatar with dropdown)
export function Navigation() {
  return (
    <nav>
      <UserButton />
    </nav>
  );
}

// Full user profile page
export default function ProfilePage() {
  return <UserProfile />;
}
```

---

## Data Access Integration

### CRITICAL: User ID in Database Queries

**ALL database queries MUST filter by the authenticated user's ID.**

This integrates with the Data Fetching Guidelines (`/docs/data-fetching.md`):

```typescript
// Example: /data/user-workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function getUserWorkouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User must be logged in');
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

export async function createWorkout(data: { name: string; date: Date }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: User must be logged in');
  }

  return await db
    .insert(workouts)
    .values({
      ...data,
      userId, // Always include userId
    })
    .returning();
}
```

### Database Schema

Your database tables MUST include a `userId` column:

```typescript
// Example: /db/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Protected Routes

### Middleware-Based Protection (RECOMMENDED)

Use Clerk middleware to protect entire route groups:

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)', // Public webhook endpoint
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
```

### Component-Level Protection

For specific components or pages:

```typescript
// Server Component
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <div>Protected content</div>;
}
```

---

## Security Best Practices

### ✅ DO

- **Always** check authentication status before accessing user data
- **Always** include `userId` in database queries
- Use Clerk's built-in components for auth UI
- Use `await auth.protect()` in middleware for blanket protection
- Store Clerk secrets in environment variables (never in code)
- Use Clerk webhooks for user lifecycle events (user.created, user.deleted, etc.)

### ❌ DON'T

- **NEVER** implement custom authentication logic
- **NEVER** bypass Clerk's authentication checks
- **NEVER** trust client-side authentication state for sensitive operations
- **NEVER** expose Clerk secret keys in client-side code
- **NEVER** allow users to access data without userId verification
- **NEVER** use local storage or cookies for session management (Clerk handles this)

---

## Common Use Cases

### 1. Checking if User is Authenticated

```typescript
// Server Component
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  return <div>{isAuthenticated ? 'Logged in' : 'Logged out'}</div>;
}

// Client Component
'use client';
import { useAuth } from '@clerk/nextjs';

export function Component() {
  const { isSignedIn } = useAuth();

  return <div>{isSignedIn ? 'Logged in' : 'Logged out'}</div>;
}
```

### 2. Getting User Information

```typescript
// Server Component - Full user object
import { currentUser } from '@clerk/nextjs/server';

export default async function Page() {
  const user = await currentUser();

  return (
    <div>
      <p>Email: {user?.emailAddresses[0].emailAddress}</p>
      <p>Name: {user?.firstName} {user?.lastName}</p>
      <img src={user?.imageUrl} alt="Profile" />
    </div>
  );
}

// Client Component
'use client';
import { useUser } from '@clerk/nextjs';

export function Component() {
  const { user } = useUser();

  return <div>{user?.firstName}</div>;
}
```

### 3. Sign Out

```typescript
'use client';
import { useClerk } from '@clerk/nextjs';

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button onClick={() => signOut()}>
      Sign out
    </button>
  );
}

// Or use the pre-built UserButton which includes sign-out
import { UserButton } from '@clerk/nextjs';

export function Navigation() {
  return <UserButton />;
}
```

---

## API Routes

When creating API routes, protect them with Clerk authentication:

```typescript
// app/api/workouts/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user's workouts
  const workouts = await getUserWorkouts(userId);

  return NextResponse.json(workouts);
}
```

---

## Webhooks

For syncing Clerk users with your database, use Clerk webhooks:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    return new Response('Error: Verification error', { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    await db.insert(users).values({
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
    });
  }

  return new Response('Webhook received', { status: 200 });
}
```

---

## Summary

1. **Authentication Provider**: ONLY Clerk - NO custom auth logic
2. **Server Components**: Use `auth()` or `currentUser()` from `@clerk/nextjs/server`
3. **Client Components**: Use `useAuth()` or `useUser()` hooks
4. **UI Components**: Use Clerk's pre-built components (`SignIn`, `SignUp`, `UserButton`, etc.)
5. **Data Access**: ALWAYS filter by `userId` from Clerk
6. **Route Protection**: Use Clerk middleware and `auth.protect()`
7. **Security**: NEVER bypass Clerk's authentication or access other users' data

---

**Failure to comply with these standards will result in code review rejections and potential security vulnerabilities.**

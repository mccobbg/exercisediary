# Routing Standards

This document defines the routing architecture and standards for the Exercise Diary application.

## Core Routing Principles

### 1. Dashboard-Centric Architecture

**All application routes MUST be accessed via the `/dashboard` prefix.**

- ✅ **Correct:** `/dashboard`, `/dashboard/workouts`, `/dashboard/workout/123`
- ❌ **Incorrect:** `/workouts`, `/workout/123`, `/profile`

**Rationale:** This provides a clear separation between public marketing/landing pages (if any) and the authenticated application experience.

### 2. Route Protection

**All `/dashboard` routes and sub-routes are protected routes that require authentication.**

#### Implementation: Next.js Middleware

Route protection MUST be implemented using Next.js middleware, NOT individual route guards.

**File:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication status
  const isAuthenticated = checkAuth(request); // Implement based on your auth strategy

  // Protect all /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    '/dashboard/:path*', // Matches /dashboard and all sub-routes
  ],
};
```

**Key Requirements:**
- Use the `matcher` config to target `/dashboard/:path*` for optimal performance
- Redirect unauthenticated users to a login page (e.g., `/login`)
- Authentication check should be fast and efficient (token validation, session check, etc.)
- Middleware runs on Edge Runtime by default - ensure auth checks are compatible

### 3. Route Structure

#### App Router File Organization

```
src/app/
├── page.tsx                    # Public landing page (/)
├── login/
│   └── page.tsx               # Login page (/login)
└── dashboard/
    ├── page.tsx               # Dashboard home (/dashboard)
    ├── layout.tsx             # Dashboard layout (optional)
    ├── workouts/
    │   └── page.tsx          # Workouts list (/dashboard/workouts)
    ├── workout/
    │   └── [workoutId]/
    │       └── page.tsx      # Single workout (/dashboard/workout/[id])
    └── profile/
        └── page.tsx          # User profile (/dashboard/profile)
```

#### Route Naming Conventions

1. **Use kebab-case for route segments**
   - ✅ `/dashboard/workout-history`
   - ❌ `/dashboard/workoutHistory` or `/dashboard/workout_history`

2. **Dynamic routes use bracket notation**
   - ✅ `/dashboard/workout/[workoutId]`
   - ✅ `/dashboard/exercise/[exerciseId]/edit`

3. **Use descriptive, RESTful route names**
   - ✅ `/dashboard/workouts` (list), `/dashboard/workout/[id]` (detail)
   - ❌ `/dashboard/list-workouts`, `/dashboard/show-workout`

### 4. Navigation Patterns

#### Using Next.js Link Component

```tsx
import Link from 'next/link';

// Always use absolute paths with /dashboard prefix
<Link href="/dashboard/workouts">View Workouts</Link>
<Link href={`/dashboard/workout/${workoutId}`}>View Details</Link>
```

#### Programmatic Navigation

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function MyComponent() {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/dashboard/workouts');
  };

  return <button onClick={handleNavigate}>Go to Workouts</button>;
}
```

**Important:** Use `useRouter` from `next/navigation` (App Router), NOT `next/router` (Pages Router).

### 5. Layout Patterns

#### Dashboard Layout

Create a shared layout for all dashboard routes:

```tsx
// src/app/dashboard/layout.tsx
import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <nav>{/* Dashboard navigation */}</nav>
      <aside>{/* Dashboard sidebar */}</aside>
      <main>{children}</main>
    </div>
  );
}
```

**Benefits:**
- Shared navigation/sidebar across all dashboard pages
- Layout persists during navigation (no re-mount)
- Reduces code duplication

### 6. Route Groups (Optional)

For organizing routes without affecting the URL structure, use route groups:

```
src/app/dashboard/
├── (authenticated)/
│   ├── workouts/
│   └── profile/
└── (settings)/
    ├── account/
    └── preferences/
```

This creates `/dashboard/workouts`, `/dashboard/profile`, etc., while maintaining logical file organization.

### 7. Redirect Patterns

#### After Authentication

```typescript
// After successful login, redirect to dashboard
router.push('/dashboard');
```

#### Handling Unauthorized Access

```typescript
// In middleware.ts
if (!isAuthenticated && pathname.startsWith('/dashboard')) {
  // Preserve the intended destination
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(redirectUrl);
}
```

```typescript
// After login, redirect back to intended page
const searchParams = new URLSearchParams(window.location.search);
const redirectTo = searchParams.get('redirect') || '/dashboard';
router.push(redirectTo);
```

### 8. Route Metadata

Every route should define appropriate metadata:

```tsx
// src/app/dashboard/workouts/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Workouts | Exercise Diary',
  description: 'View and manage your workout history',
};

export default function WorkoutsPage() {
  // Page content
}
```

### 9. Loading and Error States

#### Loading States

```tsx
// src/app/dashboard/workouts/loading.tsx
export default function Loading() {
  return <div>Loading workouts...</div>;
}
```

#### Error Boundaries

```tsx
// src/app/dashboard/workouts/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 10. Best Practices Checklist

- [ ] All app routes use `/dashboard` prefix
- [ ] Middleware protects all `/dashboard` routes
- [ ] Route segments use kebab-case naming
- [ ] Navigation uses absolute paths with `Link` or `useRouter`
- [ ] Each route defines appropriate metadata
- [ ] Shared layouts reduce code duplication
- [ ] Loading and error states are handled
- [ ] Redirects preserve user intent (via query params)
- [ ] Dynamic routes use TypeScript-safe parameter access

## Examples

### Complete Route Implementation

```tsx
// src/app/dashboard/workout/[workoutId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: { workoutId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Workout ${params.workoutId} | Exercise Diary`,
  };
}

export default async function WorkoutDetailPage({ params }: Props) {
  const workout = await fetchWorkout(params.workoutId);

  if (!workout) {
    notFound();
  }

  return (
    <div>
      <h1>{workout.name}</h1>
      {/* Workout details */}
    </div>
  );
}
```

### Middleware Configuration

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!token; // Replace with actual validation

  if (request.nextUrl.pathname.startsWith('/dashboard') && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

## Migration Notes

If converting existing routes to this standard:

1. Move all authenticated routes under `/dashboard`
2. Implement middleware protection
3. Update all `Link` components with new paths
4. Update any hardcoded navigation strings
5. Test authentication redirects thoroughly
6. Update sitemap and navigation menus

## Related Documentation

- [Authentication Standards](/docs/auth.md)
- [UI Components](/docs/ui.md)
- [Data Fetching](/docs/data-fetching.md)

# Data Mutations Guidelines

This document outlines the strict coding standards for data mutations in this project. All developers must adhere to these guidelines when creating, updating, or deleting data.

---

## Core Principles

### 1. Helper Functions in `/data` Directory - REQUIRED

**ALL data mutations MUST be implemented as helper functions within the `/src/data` directory.**

#### Key Rules:
1. **NO direct database calls** outside the `/src/data` directory
2. **ALL mutation logic** must be centralized in data helper functions
3. **MUST use Drizzle ORM** for all database operations
4. **NEVER use raw SQL** for mutations
5. Helper functions handle business logic, validation, and database operations

#### File Organization

```
src/data/
├── workouts.ts       # Workout-related mutations
├── exercises.ts      # Exercise-related mutations
├── user-profile.ts   # User profile mutations
└── ...
```

---

## 2. Server Actions - REQUIRED

**ALL data mutations MUST be executed via Server Actions defined in colocated `actions.ts` files.**

#### Key Rules:
1. **ONLY Server Actions** may call data helper functions for mutations
2. **NO mutations** in Server Components directly
3. **NO mutations** via API routes
4. **NO client-side mutations**
5. Server Actions MUST be in files named `actions.ts`
6. Server Actions MUST be colocated with the feature/page using them
7. **NEVER use `redirect()`** within Server Actions - redirects MUST be handled client-side after the server action resolves

#### File Colocation Pattern

```
src/app/workouts/
├── page.tsx           # Server Component (displays data)
├── actions.ts         # Server Actions (mutations only)
└── workout-form.tsx   # Client Component (calls actions)
```

---

## 3. Type-Safe Parameters - REQUIRED

**Server Action parameters MUST be explicitly typed and MUST NOT use the `FormData` type.**

#### ✅ CORRECT: Typed Parameters

```typescript
// src/app/workouts/actions.ts
'use server'

type CreateWorkoutInput = {
  name: string
  date: Date
  exercises: Array<{
    name: string
    sets: number
    reps: number
  }>
}

export async function createWorkout(input: CreateWorkoutInput) {
  // Implementation
}
```

#### ❌ INCORRECT: FormData Parameters

```typescript
// src/app/workouts/actions.ts
'use server'

// ❌ DO NOT USE FormData
export async function createWorkout(formData: FormData) {
  const name = formData.get('name')
  // This is NOT allowed
}
```

---

## 4. Zod Validation - REQUIRED

**ALL Server Actions MUST validate their input parameters using Zod schemas.**

#### Key Rules:
1. **EVERY Server Action** must define a Zod schema
2. **VALIDATE inputs** before calling data helper functions
3. **RETURN validation errors** to the client
4. Use Zod's type inference for parameter types

#### Installation

```bash
npm install zod
```

---

## Complete Implementation Pattern

### Step 1: Define Zod Schema

```typescript
// src/app/workouts/actions.ts
'use server'

import { z } from 'zod'

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  date: z.date(),
  notes: z.string().optional(),
  exercises: z.array(
    z.object({
      name: z.string().min(1, 'Exercise name is required'),
      sets: z.number().int().positive(),
      reps: z.number().int().positive(),
      weight: z.number().positive().optional(),
    })
  ).min(1, 'At least one exercise is required'),
})

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
```

### Step 2: Create Data Helper Function

```typescript
// src/data/workouts.ts
import { db } from '@/db'
import { workouts, exercises } from '@/db/schema'
import { auth } from '@/lib/auth'

type CreateWorkoutData = {
  name: string
  date: Date
  notes?: string
  exercises: Array<{
    name: string
    sets: number
    reps: number
    weight?: number
  }>
}

export async function createWorkout(data: CreateWorkoutData) {
  // Get authenticated user
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Use Drizzle ORM for database operations
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: session.user.id,
      name: data.name,
      date: data.date,
      notes: data.notes,
    })
    .returning()

  // Insert exercises
  if (data.exercises.length > 0) {
    await db.insert(exercises).values(
      data.exercises.map(exercise => ({
        workoutId: workout.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
      }))
    )
  }

  return workout
}
```

### Step 3: Implement Server Action

```typescript
// src/app/workouts/actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createWorkout as createWorkoutData } from '@/data/workouts'

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  date: z.date(),
  notes: z.string().optional(),
  exercises: z.array(
    z.object({
      name: z.string().min(1, 'Exercise name is required'),
      sets: z.number().int().positive(),
      reps: z.number().int().positive(),
      weight: z.number().positive().optional(),
    })
  ).min(1, 'At least one exercise is required'),
})

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createWorkout(
  input: CreateWorkoutInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate input with Zod
    const validatedData = createWorkoutSchema.parse(input)

    // 2. Call data helper function
    const workout = await createWorkoutData(validatedData)

    // 3. Revalidate relevant paths
    revalidatePath('/workouts')
    revalidatePath('/dashboard')

    // 4. Return success result
    return {
      success: true,
      data: { id: workout.id },
    }
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      }
    }

    // Handle other errors
    console.error('Failed to create workout:', error)
    return {
      success: false,
      error: 'Failed to create workout. Please try again.',
    }
  }
}
```

### Step 4: Use in Client Component

```typescript
// src/app/workouts/workout-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkout } from './actions'
import { Button } from '@/components/ui/button'

export function WorkoutForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    // Build typed input object
    const input = {
      name: formData.get('name') as string,
      date: new Date(formData.get('date') as string),
      notes: formData.get('notes') as string || undefined,
      exercises: [
        {
          name: formData.get('exercise-name') as string,
          sets: parseInt(formData.get('sets') as string, 10),
          reps: parseInt(formData.get('reps') as string, 10),
          weight: parseFloat(formData.get('weight') as string) || undefined,
        },
      ],
    }

    // Call server action with typed input
    const result = await createWorkout(input)

    if (result.success) {
      router.push('/workouts')
    } else {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-500">{error}</div>}
      {/* Form fields */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Workout'}
      </Button>
    </form>
  )
}
```

---

## Security Requirements

### User Data Isolation - CRITICAL

**A logged-in user MUST ONLY be able to mutate their own data.**

#### Required Security Checks:
1. **ALWAYS verify authentication** in data helper functions
2. **ALWAYS filter by user ID** when querying data
3. **NEVER trust client input** for user identification
4. **ALWAYS use server-side session** to get user ID

#### ✅ CORRECT: Secure Mutation

```typescript
// src/data/workouts.ts
export async function updateWorkout(id: string, data: UpdateData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify ownership before updating
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, session.user.id) // ✅ Verify ownership
      )
    )

  if (!workout) {
    throw new Error('Workout not found or unauthorized')
  }

  // Perform update
  return await db
    .update(workouts)
    .set(data)
    .where(eq(workouts.id, id))
    .returning()
}
```

#### ❌ INCORRECT: Insecure Mutation

```typescript
// src/data/workouts.ts
export async function updateWorkout(id: string, userId: string, data: UpdateData) {
  // ❌ NEVER accept userId from client
  // ❌ ALWAYS get it from server-side session
  return await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, userId) // ❌ Insecure!
      )
    )
    .returning()
}
```

---

## Common Patterns

### Update Mutation

```typescript
// actions.ts
const updateWorkoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  notes: z.string().optional(),
})

export async function updateWorkout(
  input: z.infer<typeof updateWorkoutSchema>
): Promise<ActionResult<void>> {
  try {
    const validatedData = updateWorkoutSchema.parse(input)
    await updateWorkoutData(validatedData.id, validatedData)
    revalidatePath('/workouts')
    return { success: true, data: undefined }
  } catch (error) {
    // Error handling
  }
}
```

### Delete Mutation

```typescript
// actions.ts
const deleteWorkoutSchema = z.object({
  id: z.string().uuid(),
})

export async function deleteWorkout(
  input: z.infer<typeof deleteWorkoutSchema>
): Promise<ActionResult<void>> {
  try {
    const validatedData = deleteWorkoutSchema.parse(input)
    await deleteWorkoutData(validatedData.id)
    revalidatePath('/workouts')
    return { success: true, data: undefined }
  } catch (error) {
    // Error handling
  }
}
```

### Optimistic Updates (Optional)

For better UX, use React's `useOptimistic` with Server Actions:

```typescript
'use client'

import { useOptimistic } from 'react'
import { deleteWorkout } from './actions'

export function WorkoutList({ workouts }) {
  const [optimisticWorkouts, removeOptimisticWorkout] = useOptimistic(
    workouts,
    (state, workoutId: string) => state.filter(w => w.id !== workoutId)
  )

  async function handleDelete(id: string) {
    removeOptimisticWorkout(id)
    await deleteWorkout({ id })
  }

  return (
    <div>
      {optimisticWorkouts.map(workout => (
        <div key={workout.id}>
          {workout.name}
          <button onClick={() => handleDelete(workout.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

---

## Error Handling

### Standard Error Response Pattern

All Server Actions SHOULD return a consistent result type:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

### Error Handling Checklist:
1. ✅ Catch Zod validation errors separately
2. ✅ Log errors server-side for debugging
3. ✅ Return user-friendly error messages
4. ✅ Never expose sensitive error details to client
5. ✅ Handle authentication/authorization errors

---

## Cache Revalidation

### ALWAYS Revalidate After Mutations

After successful mutations, you MUST revalidate affected paths:

```typescript
import { revalidatePath } from 'next/cache'

export async function createWorkout(input: CreateWorkoutInput) {
  // ... mutation logic ...

  // Revalidate all affected paths
  revalidatePath('/workouts')           // List page
  revalidatePath('/dashboard')          // Dashboard page
  revalidatePath(`/workouts/${result.id}`) // Detail page (if exists)

  return { success: true, data: result }
}
```

### When to Revalidate:
- **CREATE**: Revalidate list pages and dashboard
- **UPDATE**: Revalidate list pages, detail page, and dashboard
- **DELETE**: Revalidate list pages and dashboard

---

## Summary

### Required Architecture:
1. **Data Layer** (`/src/data/*.ts`): Helper functions wrapping Drizzle ORM
2. **Action Layer** (`actions.ts`): Server Actions with Zod validation
3. **UI Layer**: Client Components calling Server Actions

### Checklist for Every Mutation:
- [ ] Data helper function in `/src/data` directory
- [ ] Uses Drizzle ORM (no raw SQL)
- [ ] Server Action in colocated `actions.ts` file
- [ ] Zod schema defined and used for validation
- [ ] Type-safe parameters (no FormData)
- [ ] Authentication check in data helper
- [ ] User ownership verification
- [ ] Error handling with ActionResult type
- [ ] Cache revalidation after success
- [ ] Proper TypeScript types throughout

---

**Failure to comply with these standards will result in code review rejections.**

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createWorkout as createWorkoutData } from '@/data/workouts';

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  startedAt: z.date(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1, 'Exercise name is required'),
        sets: z
          .array(
            z.object({
              weight: z.number().positive().optional(),
              reps: z.number().int().positive().optional(),
            })
          )
          .min(1, 'At least one set is required'),
      })
    )
    .min(1, 'At least one exercise is required'),
});

type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createWorkout(
  input: CreateWorkoutInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input with Zod
    const validatedData = createWorkoutSchema.parse(input);

    // Call data helper function
    const workout = await createWorkoutData(validatedData);

    // Revalidate relevant paths
    revalidatePath('/dashboard');

    // Return success result
    return {
      success: true,
      data: { id: workout.id },
    };
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Validation failed',
      };
    }

    // Handle other errors
    console.error('Failed to create workout:', error);
    return {
      success: false,
      error: 'Failed to create workout. Please try again.',
    };
  }
}

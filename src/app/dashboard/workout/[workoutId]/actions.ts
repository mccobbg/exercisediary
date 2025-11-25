'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateWorkout as updateWorkoutData } from '@/data/workouts';

const updateWorkoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Workout name is required').max(100),
  startedAt: z.date(),
  completedAt: z.date().nullable().optional(),
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

type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateWorkout(
  input: UpdateWorkoutInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input with Zod
    const validatedData = updateWorkoutSchema.parse(input);

    // Call data helper function
    const workout = await updateWorkoutData(validatedData);

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/workout/${workout.id}`);

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
    console.error('Failed to update workout:', error);
    return {
      success: false,
      error: 'Failed to update workout. Please try again.',
    };
  }
}

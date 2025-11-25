import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

/**
 * Fetches workouts for the authenticated user on a specific date
 * @param date - The date to fetch workouts for
 * @returns Array of workouts with their exercises and sets
 */
export async function getUserWorkoutsForDate(date: Date) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Calculate start and end of the day in UTC
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch workouts with all related data using Drizzle's query API
  const userWorkouts = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, startOfDay),
      lt(workouts.startedAt, endOfDay)
    ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
    orderBy: (workouts, { desc }) => [desc(workouts.startedAt)],
  });

  return userWorkouts;
}

/**
 * Fetches a single workout by ID for the authenticated user
 * @param workoutId - The ID of the workout to fetch
 * @returns The workout with all exercises and sets, or null if not found
 */
export async function getUserWorkoutById(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Fetch workout with all related data
  const workout = await db.query.workouts.findFirst({
    where: and(
      eq(workouts.id, workoutId),
      eq(workouts.userId, userId)
    ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });

  return workout;
}

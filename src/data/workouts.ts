import { db } from '@/db';
import { workouts, exercises, workoutExercises, sets } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

type CreateWorkoutData = {
  name: string;
  startedAt: Date;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight?: number;
      reps?: number;
    }>;
  }>;
};

/**
 * Creates a new workout with exercises and sets for the authenticated user
 * @param data - Workout data including name, start time, exercises, and sets
 * @returns The created workout with its ID
 */
export async function createWorkout(data: CreateWorkoutData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Create the workout
  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      name: data.name,
      startedAt: data.startedAt,
    })
    .returning();

  // Process each exercise
  for (let i = 0; i < data.exercises.length; i++) {
    const exerciseData = data.exercises[i];

    // Check if exercise exists in the library, if not create it
    let exercise = await db.query.exercises.findFirst({
      where: eq(exercises.name, exerciseData.name),
    });

    if (!exercise) {
      [exercise] = await db
        .insert(exercises)
        .values({
          name: exerciseData.name,
        })
        .returning();
    }

    // Link exercise to workout
    const [workoutExercise] = await db
      .insert(workoutExercises)
      .values({
        workoutId: workout.id,
        exerciseId: exercise.id,
        order: i,
      })
      .returning();

    // Create sets for this exercise
    if (exerciseData.sets.length > 0) {
      await db.insert(sets).values(
        exerciseData.sets.map((set, setIndex) => ({
          workoutExerciseId: workoutExercise.id,
          setNumber: setIndex + 1,
          weight: set.weight?.toString(),
          reps: set.reps,
        }))
      );
    }
  }

  return workout;
}

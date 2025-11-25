import { notFound } from 'next/navigation';
import { getUserWorkoutById } from '@/data/user-workouts';
import { EditWorkoutForm } from './edit-workout-form';

type PageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

export default async function EditWorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;

  // Fetch the workout data
  const workout = await getUserWorkoutById(workoutId);

  // If workout not found or doesn't belong to user, show 404
  if (!workout) {
    notFound();
  }

  // Transform workout data for the form
  const workoutData = {
    id: workout.id,
    name: workout.name,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    exercises: workout.workoutExercises.map((we) => ({
      name: we.exercise.name,
      sets: we.sets.map((set) => ({
        weight: set.weight ? parseFloat(set.weight) : undefined,
        reps: set.reps ?? undefined,
      })),
    })),
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Workout</h1>
        <p className="text-muted-foreground">
          Update your workout session with exercises and sets
        </p>
      </div>

      <EditWorkoutForm workout={workoutData} />
    </div>
  );
}

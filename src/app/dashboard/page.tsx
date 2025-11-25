import { Suspense } from 'react';
import { DateSelector } from '@/components/date-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/date-utils';
import { getUserWorkoutsForDate } from '@/data/user-workouts';

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const dateParam = params.date;

  // Parse date from URL or use today's date
  const selectedDate = dateParam ? new Date(dateParam) : new Date();

  // Fetch workouts for the selected date (server-side)
  const workouts = await getUserWorkoutsForDate(selectedDate);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with Date Picker */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Workout Dashboard</h1>

        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="w-[280px] h-10 bg-muted animate-pulse rounded-md" />}>
            <DateSelector />
          </Suspense>
        </div>
      </div>

      {/* Workout List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Workouts for {formatDate(selectedDate)}
        </h2>

        {workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <CardTitle>{workout.name}</CardTitle>
                  <CardDescription>
                    {workout.completedAt
                      ? `Completed at ${new Date(workout.completedAt).toLocaleTimeString()}`
                      : 'In progress'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workout.workoutExercises.length > 0 ? (
                    <div className="space-y-4">
                      {workout.workoutExercises.map((workoutExercise) => (
                        <div key={workoutExercise.id} className="border-l-2 border-muted pl-4">
                          <h3 className="font-medium mb-2">{workoutExercise.exercise.name}</h3>
                          {workoutExercise.sets.length > 0 ? (
                            <div className="space-y-1">
                              {workoutExercise.sets.map((set) => (
                                <div key={set.id} className="text-sm text-muted-foreground">
                                  Set {set.setNumber}:
                                  {set.weight && ` ${set.weight} kg`}
                                  {set.reps && ` × ${set.reps} reps`}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No sets recorded</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No exercises in this workout</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No workouts logged for this date.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

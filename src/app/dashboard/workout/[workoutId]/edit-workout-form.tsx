'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateWorkout } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const workoutFormSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Workout name is required').max(100),
  startedAt: z.string().min(1, 'Start time is required'),
  completedAt: z.string().optional(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1, 'Exercise name is required'),
        sets: z
          .array(
            z.object({
              weight: z.string().optional(),
              reps: z.string().optional(),
            })
          )
          .min(1, 'At least one set is required'),
      })
    )
    .min(1, 'At least one exercise is required'),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

type WorkoutData = {
  id: string;
  name: string;
  startedAt: Date;
  completedAt?: Date | null;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight?: number;
      reps?: number;
    }>;
  }>;
};

type EditWorkoutFormProps = {
  workout: WorkoutData;
};

export function EditWorkoutForm({ workout }: EditWorkoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      id: workout.id,
      name: workout.name,
      startedAt: formatDateForInput(workout.startedAt),
      completedAt: workout.completedAt
        ? formatDateForInput(workout.completedAt)
        : '',
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
          weight: set.weight?.toString() ?? '',
          reps: set.reps?.toString() ?? '',
        })),
      })),
    },
  });

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: 'exercises',
  });

  async function onSubmit(data: WorkoutFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Transform the data to match the server action's expected format
      const input = {
        id: data.id,
        name: data.name,
        startedAt: new Date(data.startedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        exercises: data.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets.map((set) => ({
            weight: set.weight ? parseFloat(set.weight) : undefined,
            reps: set.reps ? parseInt(set.reps, 10) : undefined,
          })),
        })),
      };

      const result = await updateWorkout(input);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error);
        setIsLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>Basic information about your workout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Chest Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completed At (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Exercises</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendExercise({
                  name: '',
                  sets: [{ weight: '', reps: '' }],
                })
              }
            >
              Add Exercise
            </Button>
          </div>

          {exerciseFields.map((exerciseField, exerciseIndex) => (
            <ExerciseCard
              key={exerciseField.id}
              exerciseIndex={exerciseIndex}
              form={form}
              onRemove={() => removeExercise(exerciseIndex)}
              canRemove={exerciseFields.length > 1}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Workout'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ExerciseCard({
  exerciseIndex,
  form,
  onRemove,
  canRemove,
}: {
  exerciseIndex: number;
  form: ReturnType<typeof useForm<WorkoutFormValues>>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet,
  } = useFieldArray({
    control: form.control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exercise {exerciseIndex + 1}</CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`exercises.${exerciseIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Bench Press" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sets</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSet({ weight: '', reps: '' })}
            >
              Add Set
            </Button>
          </div>

          {setFields.map((setField, setIndex) => (
            <div
              key={setField.id}
              className="flex items-start gap-2 p-4 border rounded-md"
            >
              <div className="flex-1 grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reps</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {setFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSet(setIndex)}
                  className="mt-8"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

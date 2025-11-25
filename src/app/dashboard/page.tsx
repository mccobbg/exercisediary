'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date-utils';
import { CalendarIcon } from 'lucide-react';

// Mock workout data for UI demonstration
const mockWorkouts = [
  {
    id: '1',
    name: 'Morning Run',
    type: 'Cardio',
    duration: '30 minutes',
    calories: 250,
    notes: 'Felt great! Nice weather for a run.',
  },
  {
    id: '2',
    name: 'Upper Body Strength',
    type: 'Strength Training',
    duration: '45 minutes',
    calories: 180,
    notes: 'Bench press: 3 sets of 10 reps',
  },
  {
    id: '3',
    name: 'Evening Yoga',
    type: 'Flexibility',
    duration: '20 minutes',
    calories: 80,
    notes: 'Relaxing stretch session',
  },
];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with Date Picker */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Workout Dashboard</h1>

        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Workout List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Workouts for {formatDate(selectedDate)}
        </h2>

        {mockWorkouts.length > 0 ? (
          <div className="space-y-4">
            {mockWorkouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <CardTitle>{workout.name}</CardTitle>
                  <CardDescription>{workout.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{workout.duration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Calories</p>
                      <p className="font-medium">{workout.calories} kcal</p>
                    </div>
                  </div>
                  {workout.notes && (
                    <div className="mt-4">
                      <p className="text-muted-foreground text-sm">Notes</p>
                      <p className="text-sm mt-1">{workout.notes}</p>
                    </div>
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

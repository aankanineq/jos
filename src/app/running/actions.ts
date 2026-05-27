'use server'

import { createWorkout } from '@/lib/workouts/repository'
import { revalidatePath } from 'next/cache'
import { CreateWorkoutPayload } from '@/lib/types'

export async function addPlannedRunningAction(data: {
  workout_date: string
  title: string
  markdown: string
}) {
  const payload: CreateWorkoutPayload = {
    workout_date: data.workout_date,
    type: 'Running',
    status: 'planned',
    title: data.title,
    markdown: data.markdown,
    running_distance_km: null,
    running_duration_sec: null,
    running_pace_sec_per_km: null,
    notes: null,
  }

  await createWorkout(payload)

  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/')
}

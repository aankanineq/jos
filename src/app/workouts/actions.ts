'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createWorkout, updateWorkout, deleteWorkout } from '@/lib/workouts/repository'
import { CreateWorkoutPayload, UpdateWorkoutPayload, WorkoutType, WorkoutStatus } from '@/lib/types'
import { validateWorkoutPayload, calculateRunningPace } from '@/lib/workouts/validation'

function formDataToPayload(formData: FormData): CreateWorkoutPayload {
  const type = formData.get('type') as WorkoutType
  const status = formData.get('status') as WorkoutStatus

  const isRunning = type === 'Running'
  const distanceRaw = formData.get('running_distance_km')
  const durationRaw = formData.get('running_duration_sec')

  const running_distance_km = isRunning && distanceRaw ? Number(distanceRaw) : null
  const running_duration_sec = isRunning && durationRaw ? Number(durationRaw) : null
  
  // Calculate pace using shared calculator
  const running_pace_sec_per_km = calculateRunningPace(running_distance_km, running_duration_sec)

  const payload: CreateWorkoutPayload = {
    workout_date: formData.get('workout_date') as string,
    type,
    status,
    title: formData.get('title') as string || null,
    markdown: formData.get('markdown') as string || '',
    notes: formData.get('notes') as string || null,
    running_distance_km,
    running_duration_sec,
    running_pace_sec_per_km,
  }

  // Validate the payload using the shared validation library
  const validation = validateWorkoutPayload(payload)
  if (!validation.isValid) {
    throw new Error(`유효성 검사 실패: ${validation.errors.join(' / ')}`)
  }

  return payload
}

export async function addWorkoutAction(formData: FormData) {
  const payload = formDataToPayload(formData)
  
  await createWorkout(payload)
  
  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/')
  
  redirect(`/workouts/${payload.workout_date}`)
}

export async function editWorkoutAction(id: string, formData: FormData) {
  const payload = formDataToPayload(formData) as UpdateWorkoutPayload
  
  await updateWorkout(id, payload)
  
  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/')
  revalidatePath(`/workouts/${payload.workout_date}`)
  
  redirect(`/workouts/${payload.workout_date}`)
}

export async function deleteWorkoutAction(id: string, date: string) {
  await deleteWorkout(id)
  
  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/')
  revalidatePath(`/workouts/${date}`)
  
  redirect('/workouts')
}

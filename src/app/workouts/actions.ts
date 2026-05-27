'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createWorkout, updateWorkout, deleteWorkout, deleteWorkouts } from '@/lib/workouts/repository'
import { saveExercises } from '@/lib/workouts/exercises-repository'
import { CreateWorkoutPayload, UpdateWorkoutPayload, WorkoutType, WorkoutStatus, ExerciseInput } from '@/lib/types'
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

function parseExercisesFromFormData(formData: FormData): ExerciseInput[] {
  const exercisesJson = formData.get('exercises_json') as string | null
  if (!exercisesJson) return []
  
  try {
    const parsed = JSON.parse(exercisesJson) as any[]
    // Filter out exercises with empty names and map fields securely
    return parsed
      .filter((ex) => ex.exercise_name && ex.exercise_name.trim().length > 0)
      .map((ex) => ({
        exercise_key: ex.exercise_key || null,
        exercise_name: ex.exercise_name.trim(),
        exercise_order: Number(ex.exercise_order) || 1,
        is_bodyweight: !!ex.is_bodyweight,
        notes: ex.notes || null,
        sets: Array.isArray(ex.sets)
          ? ex.sets.map((s: any, idx: number) => ({
              set_number: Number(s.set_number) || (idx + 1),
              reps: Number(s.reps) || 10,
              weight_kg: s.weight_kg !== null && s.weight_kg !== undefined && s.weight_kg !== '' ? Number(s.weight_kg) : null,
            }))
          : [],
      }))
  } catch {
    return []
  }
}

export async function addWorkoutAction(formData: FormData) {
  const payload = formDataToPayload(formData)
  const exercises = parseExercisesFromFormData(formData)
  
  const workout = await createWorkout(payload)
  
  // Save exercises if any
  if (exercises.length > 0) {
    try {
      await saveExercises(workout.id, exercises)
    } catch (err) {
      console.error('Error saving exercises in addWorkoutAction:', err)
      throw err
    }
  }
  
  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/')
  
  redirect(`/workouts/${payload.workout_date}`)
}

export async function editWorkoutAction(id: string, formData: FormData) {
  const payload = formDataToPayload(formData) as UpdateWorkoutPayload
  const exercises = parseExercisesFromFormData(formData)
  
  await updateWorkout(id, payload)
  
  // Save exercises (delete existing + insert new)
  try {
    await saveExercises(id, exercises)
  } catch (err) {
    console.error('Error saving exercises in editWorkoutAction:', err)
    throw err
  }
  
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

export async function deleteWorkoutsBulkAction(ids: string[]) {
  if (ids.length === 0) return
  await deleteWorkouts(ids)
  
  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/')
}

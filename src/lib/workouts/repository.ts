import { createClient } from '@/lib/supabase/server'
import { WorkoutEntry, CreateWorkoutPayload, UpdateWorkoutPayload } from '@/lib/types'

export async function getWorkouts(month?: string): Promise<WorkoutEntry[]> {
  const supabase = await createClient()

  let query = supabase.from('workouts').select('*').order('workout_date', { ascending: false })

  if (month) {
    // month is expected to be in YYYY-MM format
    const startDate = `${month}-01`
    // to get end of month, we can use simple string manipulation or let DB handle it.
    // For simplicity, we just filter text starting with month if workout_date is stored as YYYY-MM-DD
    query = query.gte('workout_date', startDate).lte('workout_date', `${month}-31`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as WorkoutEntry[]
}

export async function getWorkoutByDate(date: string): Promise<WorkoutEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('workout_date', date)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as WorkoutEntry[]
}

export async function getWorkoutById(id: string): Promise<WorkoutEntry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as WorkoutEntry
}

export async function createWorkout(payload: CreateWorkoutPayload): Promise<WorkoutEntry> {
  const supabase = await createClient()
  
  // Get the current authenticated user to explicitly set user_id
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert([{
      ...payload,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) throw error
  return data as WorkoutEntry
}

export async function updateWorkout(id: string, payload: UpdateWorkoutPayload): Promise<WorkoutEntry> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workouts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as WorkoutEntry
}

export async function deleteWorkout(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deleteWorkouts(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('workouts')
    .delete()
    .in('id', ids)

  if (error) throw error
}

import { createClient } from '@/lib/supabase/server'
import { WorkoutEntry } from '@/lib/types'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function getMonthlyStats(date: Date = new Date()) {
  const supabase = await createClient()

  const start = format(startOfMonth(date), 'yyyy-MM-dd')
  const end = format(endOfMonth(date), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .gte('workout_date', start)
    .lte('workout_date', end)

  if (error) throw error

  const workouts = data as WorkoutEntry[]

  const completedWorkouts = workouts.filter((w) => w.status === 'completed')
  const workoutDays = new Set(completedWorkouts.map((w) => w.workout_date)).size

  const runningWorkouts = completedWorkouts.filter((w) => w.type === 'Running')
  const totalRunningDistance = runningWorkouts.reduce((acc, curr) => acc + (curr.running_distance_km || 0), 0)

  return {
    workoutDays,
    totalRunningDistance,
    workouts,
  }
}

export async function getRecentWorkouts(limit: number = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as WorkoutEntry[]
}

export async function getTodayWorkouts() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('workout_date', today)

  if (error) throw error
  return data as WorkoutEntry[]
}

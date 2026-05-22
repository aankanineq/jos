export type WorkoutType =
  | 'Pull'
  | 'Push'
  | 'Leg'
  | 'Running'
  | 'Full'
  | 'Tennis'
  | 'Rest'
  | 'Other'

export type WorkoutStatus = 'planned' | 'completed'
export type RunningIntensity = 'easy' | 'long' | 'tempo' | 'interval' | 'race' | 'unknown'

export type WorkoutEntry = {
  id: string
  user_id: string
  workout_date: string // YYYY-MM-DD
  type: WorkoutType
  status: WorkoutStatus
  title: string | null
  markdown: string
  running_distance_km: number | null
  running_duration_sec: number | null
  running_pace_sec_per_km: number | null
  running_intensity: RunningIntensity | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CreateWorkoutPayload = Omit<WorkoutEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type UpdateWorkoutPayload = Partial<CreateWorkoutPayload>

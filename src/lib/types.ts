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
  notes: string | null
  created_at: string
  updated_at: string
}

export type CreateWorkoutPayload = Omit<WorkoutEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type UpdateWorkoutPayload = Partial<CreateWorkoutPayload>

// 헬스 운동 세트 단위
export type ExerciseSetEntry = {
  id: string
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number | null
  created_at: string
}

// 헬스 운동 종목 단위
export type ExerciseEntry = {
  id: string
  workout_id: string
  exercise_key: string | null
  exercise_name: string
  exercise_order: number
  is_bodyweight: boolean
  notes: string | null
  created_at: string
  updated_at: string
  exercise_sets: ExerciseSetEntry[]
}

// 폼에서 사용할 입력용 타입 (id 없음)
export type ExerciseSetInput = {
  set_number: number
  reps: number
  weight_kg: number | null
}

export type ExerciseInput = {
  exercise_key: string | null
  exercise_name: string
  exercise_order: number
  is_bodyweight: boolean
  notes: string | null
  sets: ExerciseSetInput[]
}

export type WorkoutWithExercises = WorkoutEntry & {
  workout_exercises: ExerciseEntry[]
}

// 과거 무게 히스토리 조회용 타입
export type ExerciseHistoryEntry = {
  id: string
  exercise_key: string | null
  exercise_name: string
  exercise_order: number
  is_bodyweight: boolean
  notes: string | null
  workout_date: string
  workout_type: WorkoutType
  exercise_sets: {
    id: string
    set_number: number
    reps: number
    weight_kg: number | null
  }[]
}

import { createClient } from '@/lib/supabase/server'
import { ExerciseEntry, ExerciseInput, ExerciseHistoryEntry, WorkoutType } from '@/lib/types'
import { DEFAULT_PRESETS, ExercisePreset } from '@/lib/workouts/exercise-presets'

export function normalizeExercises(exercises: ExerciseInput[]): ExerciseInput[] {
  return exercises
    .filter((ex) => ex.exercise_name.trim().length > 0)
    .map((ex, index) => ({
      ...ex,
      exercise_order: index + 1,
      sets: ex.sets.map((set, setIndex) => ({
        ...set,
        set_number: setIndex + 1,
      })),
    }))
}

export async function getExercisesByWorkoutId(workoutId: string): Promise<ExerciseEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*, exercise_sets(*)')
    .eq('workout_id', workoutId)
    .order('exercise_order', { ascending: true })

  if (error) throw error
  
  // Sort exercise_sets by set_number within each exercise
  return (data || []).map((exercise: any) => ({
    ...exercise,
    exercise_sets: (exercise.exercise_sets || []).sort((a: any, b: any) => a.set_number - b.set_number)
  })) as ExerciseEntry[]
}

export async function saveExercises(workoutId: string, exercises: ExerciseInput[]): Promise<void> {
  const supabase = await createClient()
  
  const normalizedExercises = normalizeExercises(exercises)

  try {
    // 1. Delete existing exercises (CASCADE will delete sets too)
    const { error: delError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId)

    if (delError) throw delError

    if (normalizedExercises.length === 0) return

    // 2. Insert new exercises
    const exerciseRows = normalizedExercises.map((ex) => ({
      workout_id: workoutId,
      exercise_key: ex.exercise_key,
      exercise_name: ex.exercise_name,
      exercise_order: ex.exercise_order,
      is_bodyweight: ex.is_bodyweight,
      notes: ex.notes,
    }))

    const { data: insertedExercises, error: exError } = await supabase
      .from('workout_exercises')
      .insert(exerciseRows)
      .select('id, exercise_order')

    if (exError) throw exError
    if (!insertedExercises) return

    // 3. Insert sets for each exercise
    const setRows: {
      exercise_id: string
      set_number: number
      reps: number
      weight_kg: number | null
    }[] = []

    for (const inserted of insertedExercises) {
      const matchingInput = normalizedExercises.find((ex) => ex.exercise_order === inserted.exercise_order)
      if (matchingInput) {
        for (const set of matchingInput.sets) {
          setRows.push({
            exercise_id: inserted.id,
            set_number: set.set_number,
            reps: set.reps,
            weight_kg: set.weight_kg,
          })
        }
      }
    }

    if (setRows.length > 0) {
      const { error: setError } = await supabase
        .from('exercise_sets')
        .insert(setRows)

      if (setError) throw setError
    }
  } catch (error) {
    console.error('Failed to save exercises inside repository:', error)
    throw new Error('운동 기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
  }
}

export async function deleteExercisesByWorkoutId(workoutId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId)

  if (error) throw error
}

export async function getExercisesHistory(): Promise<ExerciseHistoryEntry[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      exercise_key,
      exercise_name,
      exercise_order,
      is_bodyweight,
      notes,
      workouts!inner(
        workout_date,
        type,
        status
      ),
      exercise_sets(
        id,
        set_number,
        reps,
        weight_kg
      )
    `)
  
  if (error) {
    console.error('Error fetching exercises history:', error)
    return []
  }
  
  // 1. completed 상태이고, 헬스 근력운동 계열(Pull, Push, Leg, Full)인 세션만 추출
  const strengthTypes = ['Pull', 'Push', 'Leg', 'Full']
  const filtered = (data || []).filter((ex: any) => 
    ex.workouts?.status === 'completed' && 
    strengthTypes.includes(ex.workouts?.type)
  )

  // 2. 일정한 타입 변환 및 정렬 바인딩
  return filtered.map((ex: any) => ({
    id: ex.id,
    exercise_key: ex.exercise_key,
    exercise_name: ex.exercise_name,
    exercise_order: ex.exercise_order,
    is_bodyweight: ex.is_bodyweight,
    notes: ex.notes,
    workout_date: ex.workouts?.workout_date || '',
    workout_type: ex.workouts?.type as WorkoutType,
    exercise_sets: (ex.exercise_sets || [])
      .map((s: any) => ({
        id: s.id,
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: s.weight_kg,
      }))
      .sort((a: any, b: any) => a.set_number - b.set_number)
  })).sort((a: any, b: any) => b.workout_date.localeCompare(a.workout_date))
}

export async function getDbPresets(): Promise<Record<string, ExercisePreset[]>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return DEFAULT_PRESETS
  }
  
  const { data, error } = await supabase
    .from('exercise_presets')
    .select('exercise_type, exercise_key, exercise_name')
    .eq('user_id', user.id)
    
  if (error) {
    console.error('Error fetching db presets:', error)
    return DEFAULT_PRESETS
  }
  
  // 최초 로그인 유저용 자동 마이그레이션 및 자가 시딩(Self-Seeding)
  if (!data || data.length === 0) {
    const rowsToSeed = []
    for (const [type, list] of Object.entries(DEFAULT_PRESETS)) {
      for (const item of list) {
        rowsToSeed.push({
          user_id: user.id,
          exercise_type: type,
          exercise_key: item.key,
          exercise_name: item.name
        })
      }
    }
    
    const { error: seedError } = await supabase
      .from('exercise_presets')
      .insert(rowsToSeed)
      
    if (seedError) {
      console.error('Error seeding default presets in db:', seedError)
    }
    
    return DEFAULT_PRESETS
  }
  
  // 운동 종류별로 바인딩하여 맵 반환
  const grouped: Record<string, ExercisePreset[]> = {
    Pull: [],
    Push: [],
    Leg: [],
    Full: []
  }
  
  for (const row of data) {
    if (grouped[row.exercise_type]) {
      grouped[row.exercise_type].push({
        key: row.exercise_key,
        name: row.exercise_name
      })
    }
  }
  
  return grouped
}

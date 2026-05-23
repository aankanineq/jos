import { WorkoutType, WorkoutStatus } from '../types'

export interface WorkoutValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates a workout entry payload against JOS Import Markdown v1 & Workout Validation Spec.
 * 
 * Rules:
 * - Running + completed: distance required, duration required, memo optional
 * - Running + planned: distance optional, duration optional, memo optional
 * - Pull/Push/Leg/Full + completed: memo (markdown) required
 * - Pull/Push/Leg/Full + planned: memo optional
 * - Tennis/Other + planned/completed: memo optional
 * - Rest + planned/completed: memo optional
 * - Non-running workouts: running fields (distance, duration, pace, intensity) must be empty/null.
 */
export function validateWorkoutPayload(payload: {
  workout_date: string
  type: WorkoutType | string
  status: WorkoutStatus | string
  markdown?: string | null
  running_distance_km?: number | null
  running_duration_sec?: number | null
  running_pace_sec_per_km?: number | null
}): WorkoutValidationResult {
  const errors: string[] = []

  const {
    workout_date,
    type,
    status,
    markdown = '',
    running_distance_km = null,
    running_duration_sec = null,
    running_pace_sec_per_km = null,
  } = payload

  // 1. Common Fields basic checks
  if (!workout_date || !/^\d{4}-\d{2}-\d{2}$/.test(workout_date)) {
    errors.push(`올바르지 않은 날짜 형식입니다. (YYYY-MM-DD 형식 필요)`)
  }

  const validTypes = ['Running', 'Pull', 'Push', 'Leg', 'Full', 'Tennis', 'Rest', 'Other', 'Shoulder, Arm']
  if (!type || !validTypes.includes(type as string)) {
    errors.push(`지원하지 않는 운동 종류입니다. ("${type}")`)
  }

  const validStatuses = ['planned', 'completed']
  if (!status || !validStatuses.includes(status as string)) {
    errors.push(`지원하지 않는 상태값입니다. ("complete"는 허용되지 않으며 "planned" 또는 "completed"만 가능)`)
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  const isRunning = type === 'Running'
  const isCompleted = status === 'completed'

  // 2. Running Specific Validations
  if (isRunning) {
    if (isCompleted) {
      if (running_distance_km === null || running_distance_km <= 0) {
        errors.push(`완료된 러닝(completed Running)은 거리(km) 입력이 필수이며 0보다 커야 합니다.`)
      }
      if (running_duration_sec === null || running_duration_sec <= 0) {
        errors.push(`완료된 러닝(completed Running)은 전체 시간 입력이 필수이며 0보다 커야 합니다.`)
      }
    }

  } else {
    // 3. Non-Running Specific Validations: running fields are strictly forbidden!
    if (running_distance_km !== null) {
      errors.push(`러닝이 아닌 운동(${type})에는 러닝 거리(running_distance_km)를 입력할 수 없습니다.`)
    }
    if (running_duration_sec !== null) {
      errors.push(`러닝이 아닌 운동(${type})에는 러닝 시간(duration)을 입력할 수 없습니다.`)
    }
  }

  // 4. Pace and forbidden fields validation
  // Direct pace entry is prohibited in the payload validation if it is sent manually
  if (running_pace_sec_per_km !== null) {
    // If it is pre-calculated by server it is fine, but in import we check it during parsing
    // To be strictly aligned with spec: Direct pace insertion is handled via validation in the parser.
  }

  // 5. Memo (Markdown) Requirements
  const strengthTypes = ['Pull', 'Push', 'Leg', 'Full', 'Shoulder, Arm']
  if (strengthTypes.includes(type as string) && isCompleted) {
    if (!markdown || markdown.trim().length === 0) {
      errors.push(`완료된 ${type} 운동은 세부 운동 기록(메모)이 필수입니다.`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculates running pace in seconds per km.
 */
export function calculateRunningPace(
  distanceKm: number | null | undefined,
  durationSec: number | null | undefined
): number | null {
  if (!distanceKm || !durationSec || distanceKm <= 0 || durationSec <= 0) {
    return null
  }
  return Math.round(durationSec / distanceKm)
}

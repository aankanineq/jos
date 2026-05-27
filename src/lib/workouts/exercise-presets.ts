// 운동 종목 프리셋 시스템
// localStorage에 저장되어 사용자가 추가/삭제/변경 가능

export type ExercisePreset = {
  key: string
  name: string
}

export const DEFAULT_PRESETS: Record<string, ExercisePreset[]> = {
  Pull: [
    { key: 'pull_up', name: '풀업' },
    { key: 'two_arm_dumbbell_row', name: '투암 덤벨로우' },
    { key: 'one_arm_dumbbell_row', name: '원암 덤벨로우' },
    { key: 'single_lat_pulldown', name: '싱글 랫풀다운' },
    { key: 'seated_row', name: '시티드로우' },
    { key: 'barbell_curl', name: '바벨컬' },
    { key: 'dumbbell_curl', name: '덤벨컬' },
    { key: 'hammer_curl', name: '해머컬' },
    { key: 'rear_raise', name: '후면레이즈' },
  ],

  Push: [
    { key: 'incline_dumbbell_press', name: '인클라인 덤벨프레스' },
    { key: 'dips', name: '딥스' },
    { key: 'incline_chest_machine', name: '인클라인 체스트머신' },
    { key: 'dumbbell_shoulder_press', name: '덤벨 숄더프레스' },
    { key: 'close_grip_bench_press', name: '클로즈그립 벤치프레스' },
    { key: 'cable_pushdown', name: '케이블 푸쉬다운' },
    { key: 'side_raise', name: '사레레' },
    { key: 'plate_front_raise', name: '플레이트 프론트레이즈' },
  ],

  Leg: [
    { key: 'squat', name: '스쿼트' },
    { key: 'hack_squat', name: '핵스쿼트' },
    { key: 'single_leg_press', name: '싱글 레그프레스' },
    { key: 'hip_thrust', name: '힙쓰러스트' },
  ],

  Full: [
    { key: 'pull_up', name: '풀업' },
    { key: 'dips', name: '딥스' },
    { key: 'squat', name: '스쿼트' },
    { key: 'hack_squat', name: '핵스쿼트' },
    { key: 'incline_dumbbell_press', name: '인클라인 덤벨프레스' },
    { key: 'two_arm_dumbbell_row', name: '투암 덤벨로우' },
    { key: 'hip_thrust', name: '힙쓰러스트' },
  ],
}

// 헬스 계열 운동 타입인지 확인 (exercises 입력 UI를 보여줄 타입)
export const STRENGTH_TYPES = ['Pull', 'Push', 'Leg', 'Full'] as const

const STORAGE_KEY = 'jos-exercise-presets'

export function getPresets(): Record<string, ExercisePreset[]> {
  if (typeof window === 'undefined') return DEFAULT_PRESETS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      
      // 하위 호환성 검증: 기존 문자열 배열 포맷(string[])이 존재하면 마이그레이션(초기화)
      let isOldFormat = false
      for (const type of Object.keys(parsed)) {
        if (Array.isArray(parsed[type]) && parsed[type].length > 0) {
          if (typeof parsed[type][0] === 'string') {
            isOldFormat = true
            break
          }
        }
      }
      
      if (isOldFormat) {
        localStorage.removeItem(STORAGE_KEY)
        return DEFAULT_PRESETS
      }

      // Merge with defaults to ensure all types exist
      return { ...DEFAULT_PRESETS, ...parsed }
    }
  } catch {}
  return DEFAULT_PRESETS
}

export function savePresets(presets: Record<string, ExercisePreset[]>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {}
}

export function resetPresets(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

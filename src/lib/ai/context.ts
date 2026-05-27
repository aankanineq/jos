import { WorkoutEntry, ExerciseHistoryEntry } from '@/lib/types'

// ── Quest Definitions (러닝 퀘스트 시스템 상수, running/page.tsx와 동일) ──

export const LONG_TRACK_DISTANCES = [6, 8, 10, 12]
export const LONG_MIN_PACE = 390 // 6:30/km
export const LONG_MAX_PACE = 420 // 7:00/km

export const FAST_TRACK_STEPS = [
  { paceStr: '6:00', paceLimit: 360 },
  { paceStr: '5:50', paceLimit: 350 },
  { paceStr: '5:40', paceLimit: 340 },
  { paceStr: '5:30', paceLimit: 330 },
  { paceStr: '5:20', paceLimit: 320 },
  { paceStr: '5:10', paceLimit: 310 },
  { paceStr: '5:00', paceLimit: 300 },
  { paceStr: '4:50', paceLimit: 290 },
]

export const FAST_TRACK_MISSIONS = [
  { label: '15분', durationSec: 15 * 60 },
  { label: '20분', durationSec: 20 * 60 },
  { label: '25분', durationSec: 25 * 60 },
  { label: '30분', durationSec: 30 * 60 },
]

// ── Formatters ──

function formatPace(paceSec: number | null): string {
  if (!paceSec) return '-'
  const min = Math.floor(paceSec / 60)
  const sec = paceSec % 60
  return `${min}:${sec < 10 ? '0' : ''}${sec}`
}

function formatDuration(durationSec: number | null): string {
  if (!durationSec) return '-'
  const min = Math.floor(durationSec / 60)
  const sec = durationSec % 60
  return `${min}분${sec > 0 ? ` ${sec}초` : ''}`
}

// ── Quest Progress Computation ──

export interface QuestProgress {
  longTrack: {
    milestones: { distance: number; completed: boolean; date?: string; pace?: string }[]
    nextGoal: number | null
    completedCount: number
  }
  fastTrack: {
    steps: {
      paceStr: string
      paceLimit: number
      isCleared: boolean
      isActive: boolean
      missions: { label: string; durationSec: number; completed: boolean; date?: string }[]
    }[]
    activeStep: string | null
    activePaceLimit: number | null
    nextMission: { label: string; paceStr: string; durationSec: number } | null
  }
}

export function computeQuestProgress(workouts: WorkoutEntry[]): QuestProgress {
  const runRecords = workouts.filter(
    (w) => w.status === 'completed' && w.type === 'Running'
  )

  // ─ Long Track ─
  const longTrackMilestones = LONG_TRACK_DISTANCES.map((dist) => {
    const matched = runRecords.find((r) => {
      const d = r.running_distance_km
      const p = r.running_pace_sec_per_km
      return d !== null && d >= dist && p !== null && p >= LONG_MIN_PACE && p <= LONG_MAX_PACE
    })
    return {
      distance: dist,
      completed: !!matched,
      date: matched?.workout_date,
      pace: matched ? formatPace(matched.running_pace_sec_per_km) : undefined,
    }
  })

  const nextLongGoal = longTrackMilestones.find((m) => !m.completed)

  // ─ Fast Track ─
  const fastTrackSteps = FAST_TRACK_STEPS.map((step) => {
    const missions = FAST_TRACK_MISSIONS.map((m) => {
      const matched = runRecords.find((r) => {
        const p = r.running_pace_sec_per_km
        const d = r.running_duration_sec
        return p !== null && p <= step.paceLimit && d !== null && d >= m.durationSec
      })
      return {
        label: m.label,
        durationSec: m.durationSec,
        completed: !!matched,
        date: matched?.workout_date,
      }
    })
    return {
      paceStr: step.paceStr,
      paceLimit: step.paceLimit,
      isCleared: missions.every((m) => m.completed),
      isActive: false,
      missions,
    }
  })

  let activeIdx = fastTrackSteps.findIndex((s) => !s.isCleared)
  if (activeIdx === -1) activeIdx = fastTrackSteps.length - 1
  if (activeIdx !== -1) fastTrackSteps[activeIdx].isActive = true

  const activeStep = fastTrackSteps[activeIdx]
  const nextMissionData = activeStep?.missions.find((m) => !m.completed) || null

  return {
    longTrack: {
      milestones: longTrackMilestones,
      nextGoal: nextLongGoal?.distance ?? null,
      completedCount: longTrackMilestones.filter((m) => m.completed).length,
    },
    fastTrack: {
      steps: fastTrackSteps,
      activeStep: activeStep?.paceStr ?? null,
      activePaceLimit: activeStep?.paceLimit ?? null,
      nextMission: nextMissionData
        ? { label: nextMissionData.label, paceStr: activeStep.paceStr, durationSec: nextMissionData.durationSec }
        : null,
    },
  }
}

// ── Text Formatters for AI System Prompt ──

export function formatRunningDataForAI(workouts: WorkoutEntry[]): string {
  const runRecords = workouts
    .filter((w) => w.type === 'Running' && w.status === 'completed')
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date))
    .slice(0, 20)

  if (runRecords.length === 0) return '러닝 기록이 없습니다.'

  let text = `## 최근 러닝 기록 (${runRecords.length}개)\n\n`
  runRecords.forEach((r, i) => {
    text += `${i + 1}. ${r.workout_date}`
    text += ` — 거리: ${r.running_distance_km ?? '-'}km`
    text += `, 시간: ${formatDuration(r.running_duration_sec)}`
    text += `, 페이스: ${formatPace(r.running_pace_sec_per_km)}/km`
    if (r.notes) text += ` (메모: ${r.notes})`
    text += '\n'
  })

  const totalDist = runRecords.reduce((a, r) => a + (r.running_distance_km || 0), 0)
  const paces = runRecords.filter((r) => r.running_pace_sec_per_km).map((r) => r.running_pace_sec_per_km!)
  const avgPace = paces.length > 0 ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : 0

  text += `\n### 요약\n`
  text += `- 총 러닝: ${runRecords.length}회\n`
  text += `- 누적 거리: ${totalDist.toFixed(1)}km\n`
  if (avgPace > 0) text += `- 평균 페이스: ${formatPace(avgPace)}/km\n`

  return text
}

export function formatQuestProgressForAI(quest: QuestProgress): string {
  let text = '## 러닝 퀘스트 진행 상황\n\n'

  text += '### Long Track (지구력)\n'
  text += '규칙: 6:30~7:00/km 페이스 유지, 목표 거리 완주\n'
  quest.longTrack.milestones.forEach((m) => {
    text += `- ${m.distance}km: ${m.completed ? `✓ 클리어 (${m.date}, ${m.pace}/km)` : '✗ 미완료'}\n`
  })
  text += `- 다음 목표: ${quest.longTrack.nextGoal ? `${quest.longTrack.nextGoal}km` : '올 클리어!'}\n`
  text += `- 진행률: ${quest.longTrack.completedCount}/${quest.longTrack.milestones.length}\n\n`

  text += '### Fast Track (스피드)\n'
  text += '규칙: 각 페이스 단계에서 15/20/25/30분 미션 전체 클리어 시 다음 단계 해금\n'
  quest.fastTrack.steps.forEach((step) => {
    const done = step.missions.filter((m) => m.completed).length
    const tag = step.isCleared ? 'CLEARED' : step.isActive ? 'ACTIVE' : 'LOCKED'
    text += `- ${step.paceStr}/km [${tag}]: ${done}/4 미션\n`
    if (step.isActive) {
      step.missions.forEach((m) => {
        text += `  · ${m.label}: ${m.completed ? `✓ (${m.date})` : '✗'}\n`
      })
    }
  })
  text += `- 현재 단계: ${quest.fastTrack.activeStep || '완료'}/km\n`
  if (quest.fastTrack.nextMission) {
    text += `- 다음 미션: ${quest.fastTrack.nextMission.paceStr} 페이스로 ${quest.fastTrack.nextMission.label} 달리기\n`
  }

  return text
}

export function formatRecentWorkoutsForAI(workouts: WorkoutEntry[]): string {
  const recent = workouts
    .filter((w) => w.status === 'completed')
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date))
    .slice(0, 15)

  if (recent.length === 0) return '운동 기록이 없습니다.'

  let text = `## 최근 전체 운동 기록 (${recent.length}개)\n\n`
  recent.forEach((w, i) => {
    text += `${i + 1}. ${w.workout_date} — ${w.type}`
    if (w.type === 'Running') {
      text += ` (${w.running_distance_km ?? '-'}km, ${formatPace(w.running_pace_sec_per_km)}/km)`
    }
    text += '\n'
  })

  return text
}

// ── User Profile ──

export type ProfileItem = {
  item_id: string;
  item_label: string;
  item_value: string;
  item_order: number;
};

export function formatProfileForAI(profile: ProfileItem[]): string {
  if (!profile || profile.length === 0) return ''
  const parts = profile
    .filter((item) => item.item_label.trim() && item.item_value.trim())
    .map((item) => `- ${item.item_label.trim()}: ${item.item_value.trim()}`)
  if (parts.length === 0) return ''
  return '## 사용자 개인 프로필 (AI-RAG Context)\n\n' + parts.join('\n') + '\n'
}

export function formatGymDataForAI(history: ExerciseHistoryEntry[]): string {
  if (history.length === 0) return '근력 운동 기록이 없습니다.'

  const groups: Record<string, {
    name: string
    is_bodyweight: boolean
    workout_type: string
    entries: ExerciseHistoryEntry[]
  }> = {}

  for (const entry of history) {
    const groupId = entry.exercise_key || `name_${entry.exercise_name.trim().toLowerCase()}`
    if (!groups[groupId]) {
      groups[groupId] = {
        name: entry.exercise_name,
        is_bodyweight: entry.is_bodyweight,
        workout_type: entry.workout_type,
        entries: []
      }
    }
    groups[groupId].entries.push(entry)
  }

  let text = '## 근력 운동 종목별 히스토리 요약\n\n'

  for (const [groupId, group] of Object.entries(groups)) {
    text += `### ${group.name} (${group.workout_type} 계열${group.is_bodyweight ? ', 맨몸/추가중량 운동' : ''})\n`
    
    let peakWeight = 0
    let peakReps = 0
    let maxVolume = 0
    let maxAddedWeight = 0
    let totalSets = 0
    let estimatedMax1RM = 0
    let estimatedMaxAdded1RM = 0

    const sortedEntries = [...group.entries].sort((a, b) => a.workout_date.localeCompare(b.workout_date))

    for (const session of sortedEntries) {
      let sessionVolume = 0
      for (const set of session.exercise_sets) {
        totalSets++
        if (set.reps > peakReps) peakReps = set.reps
        
        if (group.is_bodyweight) {
          if (set.weight_kg !== null) {
            if (set.weight_kg > maxAddedWeight) maxAddedWeight = set.weight_kg
            const added1RM = set.weight_kg * (1 + set.reps / 30)
            if (added1RM > estimatedMaxAdded1RM) estimatedMaxAdded1RM = added1RM
          }
        } else {
          if (set.weight_kg !== null) {
            if (set.weight_kg > peakWeight) peakWeight = set.weight_kg
            sessionVolume += set.weight_kg * set.reps
            const oneRepMax = set.weight_kg * (1 + set.reps / 30)
            if (oneRepMax > estimatedMax1RM) estimatedMax1RM = oneRepMax
          }
        }
      }
      if (sessionVolume > maxVolume) maxVolume = sessionVolume
    }

    if (group.is_bodyweight) {
      text += `- 최대 추가 중량: ${maxAddedWeight > 0 ? `${maxAddedWeight}kg` : '맨몸(0kg)'}\n`
      if (maxAddedWeight > 0 && estimatedMaxAdded1RM > 0) {
        text += `- 추정 추가 중량 1RM: ${estimatedMaxAdded1RM.toFixed(1)}kg\n`
      }
    } else {
      text += `- 최고 중량: ${peakWeight}kg\n`
      if (estimatedMax1RM > 0) {
        text += `- 추정 1RM: ${estimatedMax1RM.toFixed(1)}kg\n`
      }
      text += `- 단일 세션 최대 볼륨: ${maxVolume}kg\n`
    }
    text += `- 최고 반복 횟수: ${peakReps}회\n`
    text += `- 총 세트 수행 횟수: ${totalSets}세트\n`

    text += `\n* 최근 3회 수행 내역:\n`
    const recentSessions = [...group.entries].sort((a, b) => b.workout_date.localeCompare(a.workout_date)).slice(0, 3)
    recentSessions.forEach((session) => {
      const setsStr = session.exercise_sets.map(s => `${s.weight_kg !== null ? `${s.weight_kg}kg ` : ''}${s.reps}회`).join(' / ')
      text += `  - ${session.workout_date}: ${setsStr}${session.notes ? ` (메모: ${session.notes})` : ''}\n`
    })
    text += '\n'
  }

  return text
}

export function formatGymProfileForAI(profile: ProfileItem[]): string {
  if (!profile || profile.length === 0) return ''
  const parts = profile
    .filter((item) => item.item_label.trim() && item.item_value.trim())
    .map((item) => `- ${item.item_label.trim()}: ${item.item_value.trim()}`)
  if (parts.length === 0) return ''
  return '## 사용자 개인 헬스 프로필 (AI-RAG Context)\n\n' + parts.join('\n') + '\n'
}

export function getUniqueMonths<T extends { workout_date?: string; date?: string }>(
  items: T[]
): string[] {
  const months = new Set<string>();
  for (const item of items) {
    const date = item.workout_date ?? item.date;
    if (!date || date.length < 7) continue;
    months.add(date.slice(0, 7));
  }
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}


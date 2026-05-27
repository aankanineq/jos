'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Trophy,
  Flame,
  Check,
  Lock,
  Clock,
  PlusCircle,
  Compass,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { WorkoutEntry } from '@/lib/types'
import RunningAISection from './RunningAISection'

interface Props {
  initialWorkouts: WorkoutEntry[]
}

// 페이스 초 단위를 분:초 형식으로 포맷팅
function formatPace(paceSec: number | null): string {
  if (!paceSec) return '-'
  const min = Math.floor(paceSec / 60)
  const sec = paceSec % 60
  return `${min}:${sec < 10 ? '0' : ''}${sec}`
}

// 시간 초 단위를 분/초 형식으로 포맷팅
function formatDuration(durationSec: number | null): string {
  if (!durationSec) return '-'
  const min = Math.floor(durationSec / 60)
  const sec = durationSec % 60
  return `${min}분${sec > 0 ? ` ${sec}초` : ''}`
}

export default function RunningClient({ initialWorkouts }: Props) {
  // 각 트랙의 아코디언 펼침/접힘 상태 관리 (기본값: 접힘)
  const [longExpanded, setLongExpanded] = useState(false)
  const [fastExpanded, setFastExpanded] = useState(false)

  // 완료된 러닝 기록 필터링
  const runRecords = initialWorkouts.filter(
    (w) => w.status === 'completed' && w.type === 'Running'
  )

  // 고유 월 리스트 동적 연산 ( RAG 첨부 필터에 주입 )
  const uniqueMonths = Array.from(
    new Set(initialWorkouts.map((w) => w.workout_date.substring(0, 7)))
  ).sort().reverse()

  // 1. Long Track (롱 트랙) 데이터 연산
  const LONG_TRACK_DISTANCES = [6, 8, 10, 12]
  const LONG_MIN_PACE = 390 // 6:30
  const LONG_MAX_PACE = 420 // 7:00

  const longTrackMilestones = LONG_TRACK_DISTANCES.map((dist) => {
    const matchedRecord = runRecords.find((r) => {
      const d = r.running_distance_km
      const p = r.running_pace_sec_per_km
      return (
        d !== null &&
        d >= dist &&
        p !== null &&
        p >= LONG_MIN_PACE &&
        p <= LONG_MAX_PACE
      )
    })

    return {
      distance: dist,
      completed: !!matchedRecord,
      record: matchedRecord || null,
    }
  })

  // 롱 트랙 다음 도전 과제 도출
  const nextLongQuest = longTrackMilestones.find((m) => !m.completed) || null

  // 2. Fast Track (패스트 트랙) 데이터 연산
  const FAST_TRACK_STEPS = [
    { paceStr: '6:00', paceLimit: 360 },
    { paceStr: '5:50', paceLimit: 350 },
    { paceStr: '5:40', paceLimit: 340 },
    { paceStr: '5:30', paceLimit: 330 },
    { paceStr: '5:20', paceLimit: 320 },
    { paceStr: '5:10', paceLimit: 310 },
    { paceStr: '5:00', paceLimit: 300 },
    { paceStr: '4:50', paceLimit: 290 },
  ]

  const MISSIONS = [
    { label: '15분', durationSec: 15 * 60 },
    { label: '20분', durationSec: 20 * 60 },
    { label: '25분', durationSec: 25 * 60 },
    { label: '30분', durationSec: 30 * 60 },
  ]

  const fastTrackProgress = FAST_TRACK_STEPS.map((step) => {
    const missionsProgress = MISSIONS.map((m) => {
      const matchedRecord = runRecords.find((r) => {
        const p = r.running_pace_sec_per_km
        const d = r.running_duration_sec
        return (
          p !== null &&
          p <= step.paceLimit &&
          d !== null &&
          d >= m.durationSec
        )
      })

      return {
        label: m.label,
        durationSec: m.durationSec,
        completed: !!matchedRecord,
        record: matchedRecord || null,
      }
    })

    const isCleared = missionsProgress.every((m) => m.completed)

    return {
      paceStr: step.paceStr,
      paceLimit: step.paceLimit,
      missions: missionsProgress,
      isCleared,
      isActive: false,
    }
  })

  // Active 단계 판정
  let activeIndex = fastTrackProgress.findIndex((step) => !step.isCleared)
  if (activeIndex === -1) {
    activeIndex = fastTrackProgress.length - 1
  }
  if (activeIndex !== -1 && fastTrackProgress[activeIndex]) {
    fastTrackProgress[activeIndex].isActive = true
  }

  const activeFastStep = fastTrackProgress[activeIndex] || null
  const nextFastQuest = activeFastStep
    ? activeFastStep.missions.find((m) => !m.completed) || null
    : null

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-28 max-w-4xl mx-auto">
      
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase border border-slate-200/50">
            <Compass className="w-3.5 h-3.5 text-slate-800" />
            QUEST DASHBOARD
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            러닝 퀘스트
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide">
            나의 한계를 넘고 지구력과 속도를 극대화하는 성장 로드맵
          </p>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          오늘 러닝 기록하기
        </Link>
      </header>

      {/* 🤖 AI Coach section - placed at the very top for high accessibility */}
      <RunningAISection uniqueMonths={uniqueMonths} />

      {/* Empty State Banner */}
      {runRecords.length === 0 && (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center gap-6 shadow-inner text-center sm:text-left">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Compass className="w-10 h-10 text-slate-500 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-lg text-slate-900">첫 러닝을 추가하여 퀘스트를 해금하세요!</h4>
            <p className="text-sm text-slate-500 font-medium">
              아직 측정된 러닝 완주 기록이 존재하지 않습니다. 상단의 [오늘 러닝 기록하기] 버튼을 통해 거리와 시간을 남겨주시면, 기록된 페이스와 거리에 기반하여 퀘스트 맵이 자동으로 실시간 갱신됩니다!
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Long Track (지구력 완주) 아코디언 카드 ── */}
      <section className="retro-card overflow-hidden bg-white border border-slate-150 shadow-sm">
        {/* Clickable Header */}
        <button
          type="button"
          onClick={() => setLongExpanded(!longExpanded)}
          className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Long Track (지구력 완주)</h2>
              <p className="text-[11px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">
                지구력 코스 완수: {longTrackMilestones.filter((m) => m.completed).length} / {LONG_TRACK_DISTANCES.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              {longExpanded ? '접기' : '펼치기'}
            </span>
            {longExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        {longExpanded && (
          <div className="px-5 pb-6 border-t border-slate-100 pt-5 space-y-6 animate-in fade-in duration-200">
            {/* Next Target sub-card */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-50/30 to-white border border-emerald-100/70 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">LONG TRACK NEXT TARGET</span>
                {nextLongQuest ? (
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">
                      {nextLongQuest.distance}km 완주 도전
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      페이스 <span className="text-emerald-600 font-extrabold">6:30 ~ 7:00</span> 사이로 멈추지 않고 <span className="text-slate-950 font-black">{nextLongQuest.distance}km</span>를 성공적으로 완주하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                      🎉 Long Track 올 클리어!
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      모든 목표 거리를 완수했습니다. 당신은 진정한 지구력 러너입니다!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 롱트랙 가로 노선도 맵 */}
            <div className="pt-2 pb-4 overflow-x-auto">
              <div className="min-w-[650px] relative flex items-center justify-between px-8">
                {/* 연결 실선 배경 */}
                <div className="absolute left-[40px] right-[40px] h-[3px] bg-slate-100 top-[22px] z-0" />
                
                {/* 진행도 가로 실선 채우기 */}
                <div 
                  className="absolute left-[40px] h-[3px] bg-emerald-500 top-[22px] z-0 transition-all duration-700" 
                  style={{
                    width: `${
                      (() => {
                        const completedCount = longTrackMilestones.filter((m) => m.completed).length
                        if (completedCount === 0) return 0
                        if (completedCount === LONG_TRACK_DISTANCES.length) return 'calc(100% - 80px)'
                        return `calc((${(completedCount - 0.5) / (LONG_TRACK_DISTANCES.length - 1)} * 100%) - 40px)`
                      })()
                    }`,
                  }}
                />

                {longTrackMilestones.map((m) => {
                  return (
                    <div key={m.distance} className="flex flex-col items-center relative z-10 w-20 group">
                      {/* 정거장 동그라미 노드 */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                        m.completed 
                          ? 'bg-emerald-500 border-emerald-600 text-white hover:scale-105' 
                          : m.distance === nextLongQuest?.distance
                            ? 'bg-white border-emerald-400 text-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                        {m.completed ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : m.distance === nextLongQuest?.distance ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4 opacity-40" />
                        )}
                      </div>

                      {/* 마일스톤 이정표 라벨 */}
                      <span className={`text-sm font-extrabold tracking-tight mt-3 transition-colors ${
                        m.completed ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {m.distance} km
                      </span>

                      {/* 달성 정보 카드 / 미션 정보 */}
                      <div className="mt-1 text-center">
                        {m.completed && m.record ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                              Cleared
                            </span>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">
                              {format(new Date(m.record.workout_date), 'yy/MM/dd')}
                            </p>
                            <p className="text-[8px] text-slate-500 font-semibold">
                              {formatPace(m.record.running_pace_sec_per_km)}/km
                            </p>
                          </div>
                        ) : m.distance === nextLongQuest?.distance ? (
                          <div className="space-y-0.5 animate-bounce mt-1">
                            <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              Next
                            </span>
                            <p className="text-[8px] text-emerald-600 font-extrabold mt-1">
                              오늘의 도전!
                            </p>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Fast Track (스피드 & 심폐력) 아코디언 카드 ── */}
      <section className="retro-card overflow-hidden bg-white border border-slate-150 shadow-sm">
        {/* Clickable Header */}
        <button
          type="button"
          onClick={() => setFastExpanded(!fastExpanded)}
          className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Fast Track (스피드 & 심폐력)</h2>
              <p className="text-[11px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">
                현재 도전 단계: {activeFastStep ? `${activeFastStep.paceStr} 페이스` : '완료'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              {fastExpanded ? '접기' : '펼치기'}
            </span>
            {fastExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        {fastExpanded && (
          <div className="px-5 pb-6 border-t border-slate-100 pt-5 space-y-6 animate-in fade-in duration-200">
            {/* Next Target sub-card */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-orange-50/30 to-white border border-orange-100/70 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-1">FAST TRACK NEXT TARGET</span>
                {activeFastStep && nextFastQuest ? (
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">
                      {activeFastStep.paceStr} 페이스 - {nextFastQuest.label} 달리기
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      페이스 <span className="text-orange-600 font-extrabold">{activeFastStep.paceStr} 이하</span>로 일정하게 유지하며 <span className="text-slate-950 font-black">{nextFastQuest.label}</span> 동안 달리세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                      🏆 Fast Track 올 클리어!
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      모든 스피드 페이스 코스를 격파하셨습니다! 경이로운 폐활량입니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 패스트 트랙 세로 타임라인 성장 보드 */}
            <div className="space-y-6 pt-2 relative">
              {/* 세로축 중심 점선 배경 */}
              <div className="absolute left-[24px] sm:left-[32px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-slate-150 z-0" />

              {fastTrackProgress.map((step) => {
                const isCompleted = step.isCleared
                const isActive = step.isActive
                const isLocked = !isCompleted && !isActive

                return (
                  <div 
                    key={step.paceStr} 
                    className={`relative flex items-start gap-5 sm:gap-6 z-10 transition-all duration-300 ${
                      isLocked ? 'opacity-45' : 'opacity-100'
                    }`}
                  >
                    {/* 종형 노드 아이콘 */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm shrink-0 ${
                      isCompleted 
                        ? 'bg-orange-500 border-orange-600 text-white' 
                        : isActive
                          ? 'bg-white border-orange-500 text-orange-600 ring-4 ring-orange-50'
                          : 'bg-slate-50 border-slate-200 text-slate-355'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-6 h-6 stroke-[3]" />
                      ) : isActive ? (
                        <Flame className="w-6 h-6 sm:w-7 sm:h-7 animate-bounce mt-1" />
                      ) : (
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 opacity-40" />
                      )}
                    </div>

                    {/* 우측 퀘스트 카드 영역 */}
                    <div className={`flex-1 p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                      isActive 
                        ? 'bg-gradient-to-tr from-slate-50/50 to-white border-slate-200 shadow-[0_6px_25px_-5px_rgba(0,0,0,0.02)]' 
                        : isCompleted
                          ? 'bg-slate-50/20 border-slate-100'
                          : 'bg-white border-slate-105'
                    }`}>
                      {/* 헤더 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}>
                            {step.paceStr} Pace Step
                          </h3>
                          {isActive && (
                            <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                              도전 중!
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-extrabold uppercase">
                              Cleared
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                          목표 페이스: {step.paceStr}/km 이하
                        </span>
                      </div>

                      {/* 세부 4대 시간 퀘스트 체크박스 */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
                        {step.missions.map((m, mIdx) => {
                          const isNextGoal = isActive && !m.completed && (
                            step.missions.findIndex((mis) => !mis.completed) === mIdx
                          )

                          return (
                            <div 
                              key={m.label} 
                              className={`p-3 rounded-xl border flex flex-row sm:flex-col sm:items-center justify-between sm:justify-center text-center gap-2 transition-all duration-300 ${
                                m.completed 
                                  ? 'bg-emerald-50/40 border-emerald-100/70 text-emerald-800 shadow-inner' 
                                  : isNextGoal
                                    ? 'bg-orange-50/30 border-orange-200 text-slate-900 ring-2 ring-orange-100/50'
                                    : 'bg-white border-slate-100 text-slate-400'
                              }`}
                            >
                              <div className="flex sm:flex-col items-center gap-1.5">
                                <Clock className={`w-3.5 h-3.5 ${
                                  m.completed ? 'text-emerald-500' : isNextGoal ? 'text-orange-500' : 'text-slate-300'
                                }`} />
                                <span className="text-xs font-extrabold tracking-tight">
                                  {m.label} 달리기
                                </span>
                              </div>

                              {/* 달성 표식 / 기록 */}
                              <div className="text-right sm:text-center">
                                {m.completed && m.record ? (
                                  <div className="space-y-0.5 mt-0.5">
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold uppercase">
                                      Done
                                    </span>
                                    <p className="text-[8px] text-slate-400 font-bold tracking-tight mt-1">
                                      {format(new Date(m.record.workout_date), 'yy/MM/dd')}
                                    </p>
                                    <p className="text-[8px] text-slate-500 font-bold">
                                      {formatPace(m.record.running_pace_sec_per_km)}/km
                                    </p>
                                  </div>
                                ) : isNextGoal ? (
                                  <div className="space-y-0.5 mt-0.5 animate-bounce">
                                    <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                      Go!
                                    </span>
                                    <p className="text-[8px] text-orange-600 font-bold mt-1">
                                      오늘의 과제
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-300 font-semibold uppercase">
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

    </div>
  )
}

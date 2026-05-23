import Link from 'next/link'
import { getWorkouts } from '@/lib/workouts/repository'
import { format } from 'date-fns'
import { 
  Trophy, 
  Flame, 
  Check, 
  Lock, 
  Clock, 
  ChevronRight, 
  PlusCircle, 
  Compass,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react'
import { WorkoutEntry } from '@/lib/types'

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

export default async function RunningQuestPage() {
  const workouts = await getWorkouts()
  
  // 완료된 러닝 기록 필터링
  const runRecords = workouts.filter(
    (w) => w.status === 'completed' && w.type === 'Running'
  )

  // 1. Long Track (롱 트랙) 데이터 연산
  const LONG_TRACK_DISTANCES = [6, 8, 10, 12]
  const LONG_MIN_PACE = 390 // 6:30
  const LONG_MAX_PACE = 420 // 7:00

  const longTrackMilestones = LONG_TRACK_DISTANCES.map((dist) => {
    // 6:30~7:00 페이스 사이이면서 해당 거리(dist) 이상 달린 기록들 찾기
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
      record: matchedRecord || null
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
    { paceStr: '4:50', paceLimit: 290 }
  ]

  const MISSIONS = [
    { label: '15분', durationSec: 15 * 60 },
    { label: '20분', durationSec: 20 * 60 },
    { label: '25분', durationSec: 25 * 60 },
    { label: '30분', durationSec: 30 * 60 }
  ]

  const fastTrackProgress = FAST_TRACK_STEPS.map((step) => {
    const missionsProgress = MISSIONS.map((m) => {
      // 해당 페이스 제한 이하(속도는 빠름)이면서 미션 시간 이상 달린 기록
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
        record: matchedRecord || null
      }
    })

    const isCleared = missionsProgress.every((m) => m.completed)

    return {
      paceStr: step.paceStr,
      paceLimit: step.paceLimit,
      missions: missionsProgress,
      isCleared,
      isActive: false // active 여부는 아래에서 설정
    }
  })

  // Active 단계 판정 (클리어하지 못한 가장 첫 번째 단계)
  let activeIndex = fastTrackProgress.findIndex((step) => !step.isCleared)
  if (activeIndex === -1) {
    // 모두 다 클리어했다면 마지막 단계를 active 로 설정
    activeIndex = fastTrackProgress.length - 1
  }
  if (activeIndex !== -1 && fastTrackProgress[activeIndex]) {
    fastTrackProgress[activeIndex].isActive = true
  }

  const activeFastStep = fastTrackProgress[activeIndex] || null
  // 패스트 트랙의 다음 도전 미션 도출 (현재 active 단계에서 클리어하지 못한 첫 번째 시간 미션)
  const nextFastQuest = activeFastStep 
    ? activeFastStep.missions.find((m) => !m.completed) || null 
    : null

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5 text-slate-800" />
            QUEST DASHBOARD
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Running Quest
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide">
            나의 한계를 넘는 러닝 퀘스트 여정
          </p>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
        >
          <PlusCircle className="w-5 h-5" />
          오늘 러닝 기록하기
        </Link>
      </header>

      {/* 🎯 Next Target Box (다음 타겟 퀘스트 브리핑) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Long Track Next Target */}
        <div className="retro-card p-6 bg-gradient-to-tr from-slate-50 to-white relative overflow-hidden flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Trophy className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LONG TRACK NEXT GOAL</span>
            </div>
            {nextLongQuest ? (
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  {nextLongQuest.distance}km 완주 퀘스트
                </h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  페이스 <span className="text-emerald-600 font-extrabold">6:30 ~ 7:00</span> 사이로 멈추지 않고 <span className="text-slate-950 font-black">{nextLongQuest.distance}km</span>를 성공적으로 완주하세요.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-1.5">
                  🎉 Long Track 올 클리어!
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  모든 목표 거리를 성공적으로 격파하셨습니다! 대단합니다.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">진행률</span>
            <span className="text-emerald-600">
              {longTrackMilestones.filter(m => m.completed).length} / {LONG_TRACK_DISTANCES.length} 완수
            </span>
          </div>
        </div>

        {/* Fast Track Next Target */}
        <div className="retro-card p-6 bg-gradient-to-tr from-slate-50 to-white relative overflow-hidden flex flex-col justify-between border-l-4 border-l-orange-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                <Flame className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FAST TRACK NEXT GOAL</span>
            </div>
            {activeFastStep && nextFastQuest ? (
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  {activeFastStep.paceStr} 페이스 - {nextFastQuest.label} 달리기
                </h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  페이스 <span className="text-orange-600 font-extrabold">{activeFastStep.paceStr} 이하</span>로 일정하게 유지하며 <span className="text-slate-950 font-black">{nextFastQuest.label}</span> 동안 지치지 않고 달리세요.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-1.5">
                  🏆 Fast Track 올 클리어!
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  마지막 4:50 페이스의 최종 단계까지 정복하셨습니다! 경의를 표합니다.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">현재 페이스 단계</span>
            <span className="text-orange-600">
              {activeFastStep ? `${activeFastStep.paceStr} 페이스 도전 중` : '완료'}
            </span>
          </div>
        </div>

      </section>

      {/* Empty State Banner (기록이 하나도 없는 생짜 초보 유저를 위한 안내) */}
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

      {/* 🚀 LONG TRACK VISUALIZATION */}
      <section className="retro-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Long Track (지구력)</h2>
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-0.5">페이스 6:30 - 7:00 고정 거리 퀘스트</p>
          </div>
        </div>

        {/* 롱트랙 가로 노선도 맵 */}
        <div className="pt-6 pb-4 overflow-x-auto">
          <div className="min-w-[650px] relative flex items-center justify-between px-8">
            
            {/* 연결 실선 배경 */}
            <div className="absolute left-[40px] right-[40px] h-[3px] bg-slate-100 top-[22px] z-0" />
            
            {/* 진행도 가로 실선 채우기 */}
            <div 
              className="absolute left-[40px] h-[3px] bg-emerald-500 top-[22px] z-0 transition-all duration-700" 
              style={{
                width: `${
                  (() => {
                    const completedCount = longTrackMilestones.filter(m => m.completed).length
                    if (completedCount === 0) return 0
                    if (completedCount === LONG_TRACK_DISTANCES.length) return 'calc(100% - 80px)'
                    return `calc((${(completedCount - 0.5) / (LONG_TRACK_DISTANCES.length - 1)} * 100%) - 40px)`
                  })()
                }`
              }}
            />

            {longTrackMilestones.map((m, idx) => {
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
                  <span className={`text-base font-extrabold tracking-tight mt-3 transition-colors ${
                    m.completed ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {m.distance} km
                  </span>

                  {/* 달성 정보 카드 / 미션 정보 (툴팁 느낌으로 아래에 렌더링) */}
                  <div className="mt-2 text-center">
                    {m.completed && m.record ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                          Cleared
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {format(new Date(m.record.workout_date), 'yy/MM/dd')}
                        </p>
                        <p className="text-[9px] text-slate-500 font-semibold">
                          {formatPace(m.record.running_pace_sec_per_km)}/km
                        </p>
                      </div>
                    ) : m.distance === nextLongQuest?.distance ? (
                      <div className="space-y-0.5 animate-bounce mt-1">
                        <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Next
                        </span>
                        <p className="text-[9px] text-emerald-600 font-extrabold mt-1">
                          오늘의 도전!
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                        Locked
                      </span>
                    )}
                  </div>

                </div>
              )
            })}

          </div>
        </div>
      </section>

      {/* ⚡ FAST TRACK VISUALIZATION */}
      <section className="retro-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fast Track (스피드 & 심폐력)</h2>
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-0.5">페이스 극복 단계별 시간 퀘스트 로드맵</p>
          </div>
        </div>

        {/* 패스트 트랙 세로 타임라인 성장 보드 */}
        <div className="space-y-6 pt-4 relative">
          
          {/* 세로축 중심 점선 배경 */}
          <div className="absolute left-[24px] sm:left-[32px] top-6 bottom-6 w-[2px] border-l-2 border-dashed border-slate-100 z-0" />

          {fastTrackProgress.map((step, stepIdx) => {
            const isCompleted = step.isCleared
            const isActive = step.isActive
            const isLocked = !isCompleted && !isActive

            return (
              <div 
                key={step.paceStr} 
                className={`relative flex items-start gap-5 sm:gap-6 z-10 transition-all duration-300 ${
                  isLocked ? 'opacity-40' : 'opacity-100'
                }`}
              >
                
                {/* 종형 노드 아이콘 */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                  isCompleted 
                    ? 'bg-orange-500 border-orange-600 text-white' 
                    : isActive
                      ? 'bg-white border-orange-500 text-orange-600 ring-4 ring-orange-50 animate-in pulse duration-1000'
                      : 'bg-slate-50 border-slate-200 text-slate-300'
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
                <div className={`flex-1 p-5 sm:p-6 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-tr from-slate-50/50 to-white border border-slate-200/80 shadow-[0_6px_25px_-5px_rgba(0,0,0,0.02)]' 
                    : isCompleted
                      ? 'bg-slate-50/20 border border-slate-100'
                      : 'bg-white border border-slate-100'
                }`}>
                  
                  {/* 헤더 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}>
                        {step.paceStr} Pace Step
                      </h3>
                      {isActive && (
                        <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                          도전 중!
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-extrabold uppercase">
                          Cleared
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      목표 페이스: {step.paceStr}/km 이하
                    </span>
                  </div>

                  {/* 세부 4대 시간 퀘스트 체크박스 */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-3">
                    {step.missions.map((m, mIdx) => {
                      const isNextGoal = isActive && !m.completed && (
                        // 아직 달성되지 않은 가장 첫 번째 미션
                        step.missions.findIndex(mis => !mis.completed) === mIdx
                      )

                      return (
                        <div 
                          key={m.label} 
                          className={`p-3.5 rounded-xl border flex flex-row sm:flex-col sm:items-center justify-between sm:justify-center text-center gap-3 transition-all duration-300 ${
                            m.completed 
                              ? 'bg-emerald-50/40 border-emerald-100/70 text-emerald-800 shadow-inner' 
                              : isNextGoal
                                ? 'bg-orange-50/30 border-orange-200 text-slate-900 ring-2 ring-orange-100/50'
                                : 'bg-white border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex sm:flex-col items-center gap-2">
                            <Clock className={`w-4 h-4 ${
                              m.completed ? 'text-emerald-500' : isNextGoal ? 'text-orange-500' : 'text-slate-300'
                            }`} />
                            <span className="text-sm font-extrabold tracking-tight">
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
                                <p className="text-[9px] text-slate-400 font-bold tracking-tight mt-1">
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
                                <p className="text-[9px] text-orange-600 font-bold mt-1">
                                  오늘의 과제
                                </p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-semibold uppercase">
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
      </section>

    </div>
  )
}

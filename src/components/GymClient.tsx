'use client'

import { useState, useEffect } from 'react'
import { WorkoutType, ExerciseHistoryEntry } from '@/lib/types'
import { ExercisePreset } from '@/lib/workouts/exercise-presets'
import { addDbPresetAction, deleteDbPresetAction, resetDbPresetsAction } from '@/app/gym/actions'
import GymAISection from './GymAISection'
import { Dumbbell, Plus, Trash2, ArrowUpDown, ChevronDown, ChevronRight, BarChart3, Settings, Award, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  initialHistory: ExerciseHistoryEntry[]
  initialPresets: Record<string, ExercisePreset[]>
}

// Epley 1RM 계산공식
function calculateEpley1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export default function GymClient({ initialHistory, initialPresets }: Props) {
  const [activeTab, setActiveTab] = useState<'history' | 'presets'>('history')
  const [activePresetType, setActivePresetType] = useState<WorkoutType>('Pull')
  const [presets, setPresets] = useState<Record<string, ExercisePreset[]>>(initialPresets)
  const [newPresetName, setNewPresetName] = useState('')
  const [presetError, setPresetError] = useState<string | null>(null)
  
  // 아코디언 오픈 상태 관리
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // 고유 월 리스트 동적 연산 ( RAG 첨부 필터에 주입 )
  const uniqueMonths = Array.from(
    new Set(initialHistory.map((h) => h.workout_date.substring(0, 7)))
  ).sort().reverse()

  // 프리셋 동기화 (Server Components 재검증 대응)
  useEffect(() => {
    setPresets(initialPresets)
  }, [initialPresets])

  // 1. 데이터 그룹화: exercise_key 기준(없으면 name 기준)
  const exerciseGroups: Record<string, {
    key: string | null
    name: string
    type: WorkoutType
    is_bodyweight: boolean
    entries: ExerciseHistoryEntry[]
  }> = {}

  for (const entry of initialHistory) {
    const groupId = entry.exercise_key || `name_${entry.exercise_name.trim().toLowerCase()}`
    if (!exerciseGroups[groupId]) {
      exerciseGroups[groupId] = {
        key: entry.exercise_key,
        name: entry.exercise_name,
        type: entry.workout_type,
        is_bodyweight: entry.is_bodyweight,
        entries: []
      }
    }
    exerciseGroups[groupId].entries.push(entry)
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // 2. 운동 타입별 그라데이션 및 스타일
  const typeStyles: Record<string, { bg: string, text: string, border: string, gradient: string }> = {
    Pull: { 
      bg: 'bg-emerald-50/50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-100', 
      gradient: 'from-emerald-400 to-teal-500' 
    },
    Push: { 
      bg: 'bg-amber-50/50', 
      text: 'text-amber-700', 
      border: 'border-amber-100', 
      gradient: 'from-amber-400 to-orange-500' 
    },
    Leg: { 
      bg: 'bg-violet-50/50', 
      text: 'text-violet-700', 
      border: 'border-violet-100', 
      gradient: 'from-violet-400 to-purple-500' 
    },
    Full: { 
      bg: 'bg-sky-50/50', 
      text: 'text-sky-700', 
      border: 'border-sky-100', 
      gradient: 'from-sky-400 to-indigo-500' 
    }
  }

  // 3. 프리셋 추가 핸들러 (Supabase Server Action 호출)
  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault()
    setPresetError(null)
    const name = newPresetName.trim()
    if (!name) return

    try {
      await addDbPresetAction(activePresetType, name)
      setNewPresetName('')
    } catch (err: any) {
      console.error(err)
      setPresetError(err.message || '프리셋 추가 중 오류가 발생했습니다.')
    }
  }

  // 4. 프리셋 삭제 핸들러 (Supabase Server Action 호출)
  const handleDeletePreset = async (keyToDelete: string) => {
    try {
      await deleteDbPresetAction(activePresetType, keyToDelete)
    } catch (err: any) {
      alert(err.message || '프리셋 삭제 중 오류가 발생했습니다.')
    }
  }

  // 5. 기본 프리셋 복원 핸들러 (Supabase Server Action 호출)
  const handleResetPresets = async () => {
    if (confirm('모든 운동 프리셋 설정을 초기 상태로 복원하시겠습니까?\n(※ DB에 직접 등록하셨던 커스텀 프리셋 목록이 초기화됩니다.)')) {
      try {
        await resetDbPresetsAction()
        setPresetError(null)
      } catch (err: any) {
        alert(err.message || '프리셋 초기화 중 오류가 발생했습니다.')
      }
    }
  }

  const presetTypes: WorkoutType[] = ['Pull', 'Push', 'Leg', 'Full']

  return (
    <div className="space-y-8 animate-in fade-in pb-28 max-w-4xl mx-auto">
      
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase">
            <Dumbbell className="w-3.5 h-3.5 text-slate-800" />
            GYM DASHBOARD
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            헬스 대시보드
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide">
            근력 운동의 중량 성장 지표를 확인하고 종목 프리셋을 맞춤 관리하세요.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="bg-slate-100/80 p-1 rounded-2xl flex border border-slate-200/50 shadow-inner max-w-xs shrink-0">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-455 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            운동 기록 & 분석
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-455 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            종목 프리셋 관리
          </button>
        </div>
      </header>

      {/* 🤖 AI Coach section - placed at the very top for high accessibility */}
      <GymAISection uniqueMonths={uniqueMonths} />

      {/* ── 탭 1: 📈 무게 히스토리 & 분석 ── */}
      {activeTab === 'history' && (
        <section className="space-y-6">
          {Object.keys(exerciseGroups).length === 0 ? (
            <div className="retro-card p-16 text-center bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center justify-center gap-4">
              <Dumbbell className="w-12 h-12 text-slate-350 opacity-40 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">기록된 근력 운동이 없습니다</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  완료된 헬스 일지(Pull, Push, Leg, Full)를 추가하면 각 종목의 중량 성장 지표와 과거 기록 추이가 이곳에 예쁘게 분석됩니다!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(exerciseGroups).map(([groupId, group]) => {
                const style = typeStyles[group.type] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', gradient: 'from-slate-400 to-slate-500' }
                const isExpanded = !!expandedGroups[groupId]

                // 분석 메트릭 연산
                let peakWeight = 0
                let peakReps = 0
                let maxVolume = 0
                let estimatedMax1RM = 0
                let maxAddedWeight = 0
                let estimatedMaxAdded1RM = 0
                let totalSetsCount = 0

                for (const entry of group.entries) {
                  let sessionVolume = 0
                  for (const set of entry.exercise_sets) {
                    totalSetsCount++
                    
                    // 최대 반복수 확인
                    if (set.reps > peakReps) {
                      peakReps = set.reps
                    }

                    if (group.is_bodyweight) {
                      // 맨몸운동인 경우 (weight_kg = 추가중량)
                      if (set.weight_kg !== null) {
                        if (set.weight_kg > maxAddedWeight) {
                          maxAddedWeight = set.weight_kg
                        }
                        // 가중 1RM 계산
                        const added1RM = calculateEpley1RM(set.weight_kg, set.reps)
                        if (added1RM > estimatedMaxAdded1RM) {
                          estimatedMaxAdded1RM = added1RM
                        }
                      }
                    } else {
                      // 일반 중량운동인 경우
                      if (set.weight_kg !== null) {
                        if (set.weight_kg > peakWeight) {
                          peakWeight = set.weight_kg
                        }
                        
                        // 단일세트 볼륨 합산
                        sessionVolume += set.weight_kg * set.reps
                        
                        // 1RM 계산
                        const oneRepMax = calculateEpley1RM(set.weight_kg, set.reps)
                        if (oneRepMax > estimatedMax1RM) {
                          estimatedMax1RM = oneRepMax
                        }
                      }
                    }
                  }
                  if (sessionVolume > maxVolume) {
                    maxVolume = sessionVolume
                  }
                }

                return (
                  <div 
                    key={groupId}
                    className="retro-card overflow-hidden bg-white border border-slate-100/80 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
                  >
                    {/* Header Trigger */}
                    <button
                      onClick={() => toggleGroup(groupId)}
                      className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
                        {/* Type Tag */}
                        <span className={`text-[10px] px-2.5 py-1 rounded-xl font-black uppercase tracking-wider shrink-0 w-fit ${style.bg} ${style.text} border ${style.border}`}>
                          {group.type}
                        </span>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                              {group.name}
                            </h3>
                            {group.is_bodyweight && (
                              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tracking-wide shrink-0">
                                맨몸 (BW)
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-400 mt-1.5">
                            총 {group.entries.length}회 기록됨 (누적 {totalSetsCount}세트 수행)
                          </p>
                        </div>
                      </div>

                      {/* Chevron Toggle */}
                      <span className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 shrink-0">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-65" /> : <ChevronRight className="w-5 h-5" />}
                      </span>
                    </button>

                    {/* Summary Matrix Cards */}
                    <div className="px-6 pb-6 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-50 bg-slate-50/20">
                      {group.is_bodyweight ? (
                        <>
                          {/* BW Metric 1: Max Reps */}
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3.5">
                            <span className="p-2.5 bg-emerald-50/60 rounded-xl text-emerald-600 flex items-center justify-center">
                              <Award className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1.5">최대 반복수 (PR)</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{peakReps} <span className="text-xs font-bold text-slate-400">회</span></p>
                            </div>
                          </div>
                          
                          {/* BW Metric 2: Max Added Weight */}
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3.5">
                            <span className="p-2.5 bg-violet-50/60 rounded-xl text-violet-600 flex items-center justify-center">
                              <ArrowUpDown className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1.5">최대 추가 중량</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">
                                {maxAddedWeight > 0 ? `+${maxAddedWeight}kg` : 'Pure BW'}
                              </p>
                            </div>
                          </div>

                          {/* BW Metric 3: Estimated Added-weight 1RM */}
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3.5">
                            <span className="p-2.5 bg-sky-50/60 rounded-xl text-sky-700 flex items-center justify-center">
                              <Dumbbell className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1.5">가중 추정 1RM</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">
                                {estimatedMaxAdded1RM > 0 ? `+${estimatedMaxAdded1RM.toFixed(1)}kg` : '-'}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Standard Metric 1: Peak Weight */}
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3.5">
                            <span className="p-2.5 bg-emerald-50/60 rounded-xl text-emerald-600 flex items-center justify-center">
                              <Award className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1.5">최고 중량 (PR)</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{peakWeight > 0 ? `${peakWeight}kg` : '-'} </p>
                            </div>
                          </div>

                          {/* Standard Metric 2: Max Set Volume */}
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3.5">
                            <span className="p-2.5 bg-violet-50/60 rounded-xl text-violet-600 flex items-center justify-center">
                              <ArrowUpDown className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1.5">최고 1세트 볼륨</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{maxVolume > 0 ? `${maxVolume.toFixed(1)}kg` : '-'}</p>
                            </div>
                          </div>

                          {/* Standard Metric 3: Estimated 1RM */}
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3.5">
                            <span className="p-2.5 bg-amber-50/60 rounded-xl text-amber-700 flex items-center justify-center">
                              <Dumbbell className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1.5">추정 1RM</p>
                              <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{estimatedMax1RM > 0 ? `${estimatedMax1RM.toFixed(1)}kg` : '-'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Accordion Detail Log */}
                    {isExpanded && (
                      <div className="p-6 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                        <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 pb-2">
                          연대기 수행 기록 로그 (Chronological Log)
                        </h4>
                        
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {group.entries.map((entry) => (
                            <div 
                              key={entry.id}
                              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                                  {format(new Date(entry.workout_date), 'yyyy년 M월 d일')}
                                </p>
                                {entry.notes && (
                                  <p className="text-[11px] font-semibold text-slate-450 leading-relaxed max-w-md">
                                    📝 {entry.notes}
                                  </p>
                                )}
                              </div>

                              {/* Sets List */}
                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                {entry.exercise_sets.map((set) => {
                                  const weightString = group.is_bodyweight 
                                    ? set.weight_kg == null ? 'BW' : `BW+${set.weight_kg}kg`
                                    : `${set.weight_kg ?? '-'}kg`
                                  
                                  return (
                                    <span 
                                      key={set.id}
                                      className="px-2.5 py-1.5 bg-white border border-slate-150/70 rounded-xl text-[11px] font-bold text-slate-700 flex items-center gap-1 shadow-sm shrink-0"
                                    >
                                      <span className="text-[9px] font-black text-slate-400">{set.set_number}세트:</span>
                                      <strong className="text-slate-800 font-bold">{weightString}</strong>
                                      <span className="text-slate-350">×</span>
                                      <strong className="text-slate-950 font-black">{set.reps}회</strong>
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 탭 2: ⚙️ 운동 프리셋 관리 ── */}
      {activeTab === 'presets' && (
        <section className="retro-card p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-8">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 tracking-tight">종목 프리셋 커스터마이징</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">자주 하는 운동의 자동완성 프리셋 목록을 데이터베이스에 연동하여 설정합니다.</p>
              </div>
            </div>
            
            <button
              onClick={handleResetPresets}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 rounded-2xl text-xs font-bold transition-all active:scale-97 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              기본 프리셋 복원
            </button>
          </div>

          {/* Info Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/50 border border-blue-100/50 text-blue-900 flex gap-3.5 items-start">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm leading-none">⚠️ 프리셋 동기화 및 저장 범위 안내</h4>
              <p className="text-xs font-semibold text-blue-700/80 leading-relaxed">
                • 종목을 삭제하면 앞으로 일지를 작성할 때 입력 자동완성 목록에서만 영구 배제됩니다.<br />
                • **과거에 이미 저장해둔 데이터(무게 히스토리, 세트 횟수, 상세 기록)는 절대로 지워지지 않고 온전히 유지됩니다.**<br />
                • 프리셋 설정은 Supabase 데이터베이스에 안전하게 동기화되어 저장됩니다. 디바이스나 브라우저를 변경하더라도 영구 유지됩니다.
              </p>
            </div>
          </div>

          {/* Workout Type Selector Inside Tab */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {presetTypes.map((t) => {
              const isSelected = activePresetType === t
              const style = typeStyles[t]
              return (
                <button
                  key={t}
                  onClick={() => {
                    setActivePresetType(t)
                    setPresetError(null)
                  }}
                  className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer active:scale-97 ${
                    isSelected
                      ? `bg-slate-900 border-slate-900 text-white shadow-sm font-black`
                      : 'bg-white border-slate-150 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  {t} 루틴 종목
                </button>
              )
            })}
          </div>

          {/* Add Preset Form */}
          <form onSubmit={handleAddPreset} className="space-y-2 max-w-md bg-slate-50/50 border border-slate-100 rounded-3xl p-5 shadow-inner">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">신규 운동 종목 등록</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => {
                  setNewPresetName(e.target.value)
                  setPresetError(null)
                }}
                placeholder="예: 덤벨 숄더프레스"
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-950 placeholder-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold shadow-sm"
              />
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold transition-all disabled:opacity-50 shadow-sm active:scale-97 cursor-pointer text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                등록
              </button>
            </div>
            {presetError && (
              <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1 pl-1">
                ⚠️ {presetError}
              </p>
            )}
          </form>

          {/* Presets List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest">
                현재 등록된 {activePresetType} 종목 자동완성 목록 ({presets[activePresetType]?.length || 0}개)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(presets[activePresetType] || []).map((preset) => {
                const isCustom = preset.key.startsWith('custom_')
                return (
                  <div 
                    key={preset.key}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-extrabold text-slate-900 tracking-tight">
                        {preset.name}
                      </p>
                      <p className="text-[9px] font-mono font-bold text-slate-400">
                        key: {preset.key} {isCustom && <span className="text-emerald-500 font-sans font-black ml-1.5">Custom</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.key)}
                      className="p-2 rounded-xl text-slate-350 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                      title="종목 프리셋 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}

              {(presets[activePresetType] || []).length === 0 && (
                <p className="text-xs text-slate-455 italic py-4 col-span-2 text-center font-semibold">
                  등록된 종목이 없습니다. 신규 종목을 추가해 보세요.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

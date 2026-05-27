'use client'

import { useState, useEffect } from 'react'
import { WorkoutEntry, WorkoutType, WorkoutStatus, ExerciseInput, ExerciseSetInput, ExerciseEntry } from '@/lib/types'
import { addWorkoutAction, editWorkoutAction } from '@/app/workouts/actions'
import { validateWorkoutPayload } from '@/lib/workouts/validation'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Info, Plus, Trash2, Dumbbell } from 'lucide-react'
import { getPresets, STRENGTH_TYPES, ExercisePreset } from '@/lib/workouts/exercise-presets'

interface Props {
  initialData?: WorkoutEntry
  initialDate?: string
  initialExercises?: ExerciseEntry[]
  initialPresets: Record<string, ExercisePreset[]>
}

// Helper: create a blank set
function blankSet(setNumber: number): ExerciseSetInput {
  return { set_number: setNumber, reps: 10, weight_kg: null }
}

// Helper: create a blank exercise
function blankExercise(order: number): ExerciseInput {
  return {
    exercise_key: null,
    exercise_name: '',
    exercise_order: order,
    is_bodyweight: false,
    notes: null,
    sets: [blankSet(1), blankSet(2), blankSet(3)],
  }
}

// Convert ExerciseEntry[] (from DB) to ExerciseInput[] (for form)
function entriesToInputs(entries: ExerciseEntry[]): ExerciseInput[] {
  return entries.map((e) => ({
    exercise_key: e.exercise_key,
    exercise_name: e.exercise_name,
    exercise_order: e.exercise_order,
    is_bodyweight: e.is_bodyweight,
    notes: e.notes,
    sets: e.exercise_sets.map((s) => ({
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
    })),
  }))
}

export default function WorkoutForm({ initialData, initialDate, initialExercises, initialPresets }: Props) {
  const [type, setType] = useState<WorkoutType>(initialData?.type || 'Pull')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Running fields
  const initialDuration = initialData?.running_duration_sec || 0
  const [runningHour, setRunningHour] = useState<string>(
    initialDuration ? Math.floor(initialDuration / 3600).toString() : ''
  )
  const [runningMin, setRunningMin] = useState<string>(
    initialDuration ? Math.floor((initialDuration % 3600) / 60).toString() : ''
  )
  const [runningSec, setRunningSec] = useState<string>(
    initialDuration ? (initialDuration % 60).toString() : ''
  )

  // Exercise fields
  const [exercises, setExercises] = useState<ExerciseInput[]>(
    initialExercises && initialExercises.length > 0
      ? entriesToInputs(initialExercises)
      : []
  )
  const [presets, setPresetsState] = useState<Record<string, ExercisePreset[]>>(initialPresets)

  useEffect(() => {
    setPresetsState(initialPresets)
  }, [initialPresets])

  const isEditing = !!initialData
  const defaultDate = initialData?.workout_date || initialDate || format(new Date(), 'yyyy-MM-dd')
  const isStrengthType = (STRENGTH_TYPES as readonly string[]).includes(type)

  // ── Exercise manipulation helpers ──

  const addExercise = () => {
    setExercises([...exercises, blankExercise(exercises.length + 1)])
  }

  const removeExercise = (idx: number) => {
    const updated = exercises.filter((_, i) => i !== idx).map((ex, i) => ({
      ...ex,
      exercise_order: i + 1,
    }))
    setExercises(updated)
  }

  const updateExercise = (idx: number, field: keyof ExerciseInput, value: any) => {
    const updated = [...exercises]
    if (field === 'exercise_name') {
      const matchedPreset = currentPresets.find((p) => p.name === value)
      updated[idx].exercise_name = value
      updated[idx].exercise_key = matchedPreset ? matchedPreset.key : null
    } else {
      ;(updated[idx] as any)[field] = value
    }
    // If toggling bodyweight, clear weight_kg on all sets
    if (field === 'is_bodyweight' && value === true) {
      updated[idx].sets = updated[idx].sets.map((s) => ({ ...s, weight_kg: null }))
    }
    setExercises(updated)
  }

  const addSet = (exIdx: number) => {
    const updated = [...exercises]
    const newSetNum = updated[exIdx].sets.length + 1
    updated[exIdx].sets = [...updated[exIdx].sets, blankSet(newSetNum)]
    setExercises(updated)
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises]
    updated[exIdx].sets = updated[exIdx].sets
      .filter((_, i) => i !== setIdx)
      .map((s, i) => ({ ...s, set_number: i + 1 }))
    setExercises(updated)
  }

  const updateSet = (exIdx: number, setIdx: number, field: keyof ExerciseSetInput, value: any) => {
    const updated = [...exercises]
    ;(updated[exIdx].sets[setIdx] as any)[field] = value
    setExercises(updated)
  }

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    
    const formData = new FormData(e.currentTarget)
    const workout_date = formData.get('workout_date') as string
    const status = formData.get('status') as WorkoutStatus
    const markdownVal = (formData.get('markdown') as string || '').trim()
    
    const running_distance_km = type === 'Running' && formData.get('running_distance_km')
      ? Number(formData.get('running_distance_km'))
      : null
    const running_duration_sec = type === 'Running'
      ? (Number(runningHour) * 3600 + Number(runningMin) * 60 + Number(runningSec) || null)
      : null

    const validationResult = validateWorkoutPayload({
      workout_date,
      type,
      status,
      markdown: markdownVal || null,
      running_distance_km,
      running_duration_sec,
    })

    if (!validationResult.isValid) {
      setErrorMsg(validationResult.errors.join(' / '))
      setIsSubmitting(false)
      return
    }

    // Inject exercises JSON into FormData
    if (isStrengthType && exercises.length > 0) {
      formData.set('exercises_json', JSON.stringify(exercises))
    }
    
    try {
      if (isEditing) {
        await editWorkoutAction(initialData!.id, formData)
      } else {
        await addWorkoutAction(formData)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || '운동 기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  const types: WorkoutType[] = ['Pull', 'Push', 'Leg', 'Full', 'Running', 'Tennis', 'Rest', 'Other']
  const statuses: WorkoutStatus[] = ['planned', 'completed']

  const typeLabels: Record<WorkoutType, string> = {
    Pull: '✦ 풀 (Pull)',
    Push: '▲ 푸쉬 (Push)',
    Leg: '▼ 레그 (Leg)',
    Running: '⚡ 러닝 (Running)',
    Full: '◆ 전신 (Full)',
    Tennis: '● 테니스 (Tennis)',
    Rest: '◌ 휴식 (Rest)',
    Other: '▫ 기타 (Other)',
  }

  const currentPresets = presets[type] || []

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6 max-w-2xl mx-auto retro-card p-6 sm:p-10 bg-white border border-slate-100/80 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Date Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">날짜 (Date)</label>
          <input
            type="date"
            name="workout_date"
            defaultValue={defaultDate}
            required
            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold shadow-inner"
          />
        </div>

        {/* Status Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">진행 상태 (Status)</label>
          <select
            name="status"
            defaultValue={initialData?.status || 'completed'}
            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold shadow-inner cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="bg-white text-slate-900 font-semibold">
                {s === 'completed' ? 'COMPLETED (완료)' : 'PLANNED (계획)'}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Workout Type Selector */}
      <div className="space-y-2 relative">
        <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">운동 종류 (Workout Type)</label>
        
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between bg-slate-50/50 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-extrabold shadow-inner cursor-pointer hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            {typeLabels[type] || type}
          </span>
          {isDropdownOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {/* Dropdown Options List */}
        {isDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 mt-2 max-h-[280px] overflow-y-auto">
              {types.map((t) => {
                const isSelected = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center px-4.5 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer active:scale-99 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm font-black'
                        : 'bg-white text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {typeLabels[t] || t}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <input type="hidden" name="type" value={type} />
      </div>

      {/* Running specific info box */}
      {type === 'Running' && (
        <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-slate-800">
            <Info className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm tracking-wide">⚡ 러닝 추가 측정 정보</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Running Distance */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">거리 (km)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="running_distance_km"
                placeholder="예: 5.23"
                defaultValue={initialData?.running_distance_km || ''}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold shadow-sm"
              />
            </div>

            {/* Running Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">전체 시간 (시간:분:초)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="시"
                  value={runningHour}
                  onChange={(e) => setRunningHour(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-sm text-center font-bold"
                />
                <span className="text-xs font-bold text-slate-400">시</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="분"
                  value={runningMin}
                  onChange={(e) => setRunningMin(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-sm text-center font-bold"
                />
                <span className="text-xs font-bold text-slate-400">분</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="초"
                  value={runningSec}
                  onChange={(e) => setRunningSec(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-sm text-center font-bold"
                />
                <span className="text-xs font-bold text-slate-400">초</span>
              </div>
              <input type="hidden" name="running_duration_sec" value={(Number(runningHour) * 3600 + Number(runningMin) * 60 + Number(runningSec)) || ''} />
            </div>

          </div>
        </div>
      )}

      {/* ── Strength Exercise Input Section ── */}
      {isStrengthType && (
        <div className="p-5 sm:p-6 rounded-3xl border border-slate-100 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <Dumbbell className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm tracking-wide">💪 세부 종목 기록</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {exercises.length}개 종목
            </span>
          </div>

          {exercises.length === 0 && (
            <p className="text-xs text-slate-400 font-semibold leading-relaxed py-2">
              아래 버튼으로 종목을 추가하면 세트별 중량/횟수를 구조화하여 저장합니다.
            </p>
          )}

          {/* Exercise Cards */}
          <div className="space-y-4">
            {exercises.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in duration-150"
              >
                {/* Exercise Header */}
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-slate-400 bg-slate-50 rounded-lg w-7 h-7 flex items-center justify-center shrink-0 border border-slate-100 mt-1">
                    {exIdx + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    {/* Exercise Name: Preset dropdown + free text */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={ex.exercise_name}
                          onChange={(e) => updateExercise(exIdx, 'exercise_name', e.target.value)}
                          placeholder="종목명 입력 또는 선택"
                          list={`preset-${exIdx}`}
                          className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        />
                        <datalist id={`preset-${exIdx}`}>
                          {currentPresets.map((p) => (
                            <option key={p.key} value={p.name} />
                          ))}
                        </datalist>
                      </div>

                      {/* BW Toggle */}
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors shrink-0 select-none">
                        <input
                          type="checkbox"
                          checked={ex.is_bodyweight}
                          onChange={(e) => updateExercise(exIdx, 'is_bodyweight', e.target.checked)}
                          className="w-3.5 h-3.5 text-slate-900 focus:ring-slate-900 border-slate-300 rounded cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-500">BW</span>
                      </label>

                      {/* Remove Exercise */}
                      <button
                        type="button"
                        onClick={() => removeExercise(exIdx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                        title="종목 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sets */}
                    <div className="space-y-1.5">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-2 group">
                          <span className="text-[10px] font-bold text-slate-400 w-6 text-right shrink-0">
                            {set.set_number}
                          </span>
                          
                          {/* Weight */}
                          {ex.is_bodyweight ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">BW +</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={set.weight_kg ?? ''}
                                placeholder="추가중량"
                                onChange={(e) =>
                                  updateSet(
                                    exIdx,
                                    setIdx,
                                    'weight_kg',
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                              />
                              <span className="text-[10px] font-bold text-slate-400">kg</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={set.weight_kg ?? ''}
                                placeholder="중량"
                                onChange={(e) =>
                                  updateSet(
                                    exIdx,
                                    setIdx,
                                    'weight_kg',
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                                className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                              />
                              <span className="text-[10px] font-bold text-slate-400">kg</span>
                            </div>
                          )}

                          <span className="text-[10px] font-bold text-slate-300">×</span>

                          {/* Reps */}
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={set.reps}
                              onChange={(e) => updateSet(exIdx, setIdx, 'reps', Number(e.target.value) || 1)}
                              className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                            />
                            <span className="text-[10px] font-bold text-slate-400">회</span>
                          </div>

                          {/* Remove Set */}
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(exIdx, setIdx)}
                              className="p-1 rounded-lg text-slate-300 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="세트 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Set */}
                    <button
                      type="button"
                      onClick={() => addSet(exIdx)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer py-1"
                    >
                      <Plus className="w-3 h-3" />
                      세트 추가
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Exercise Button */}
          <button
            type="button"
            onClick={addExercise}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 font-bold text-xs transition-all cursor-pointer hover:bg-white/50 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            종목 추가
          </button>
        </div>
      )}

      {/* Markdown exercise records */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          {isStrengthType ? '추가 메모 (Markdown)' : '세부 운동 기록 (Markdown)'}
        </label>
        <textarea
          name="markdown"
          rows={isStrengthType && exercises.length > 0 ? 3 : 8}
          defaultValue={initialData?.markdown || ''}
          placeholder={isStrengthType ? '추가 메모가 있으면 입력하세요' : `## 풀업\nBW 10 10 10\n\n## 시티드로우\n50kg 12 10 10`}
          className="w-full bg-slate-50/30 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 font-mono text-sm leading-relaxed transition-all shadow-inner placeholder:text-slate-350"
        />
      </div>

      {errorMsg && (
        <p className="p-4 bg-red-50 border border-red-100 text-red-650 text-xs font-semibold text-center rounded-2xl animate-shake">
          {errorMsg}
        </p>
      )}

      {/* Action Buttons */}
      <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 rounded-2xl text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors cursor-pointer"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50 shadow-sm active:scale-97 cursor-pointer text-sm"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '기록 추가'}
        </button>
      </div>
    </form>
  )
}

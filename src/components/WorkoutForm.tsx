'use client'

import { useState } from 'react'
import { WorkoutEntry, WorkoutType, WorkoutStatus } from '@/lib/types'
import { addWorkoutAction, editWorkoutAction } from '@/app/workouts/actions'
import { validateWorkoutPayload } from '@/lib/workouts/validation'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Calendar, Compass, Info } from 'lucide-react'

interface Props {
  initialData?: WorkoutEntry
  initialDate?: string
}

export default function WorkoutForm({ initialData, initialDate }: Props) {
  const [type, setType] = useState<WorkoutType>(initialData?.type || 'Pull')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

  const isEditing = !!initialData
  const defaultDate = initialData?.workout_date || initialDate || format(new Date(), 'yyyy-MM-dd')

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
    
    try {
      if (isEditing) {
        await editWorkoutAction(initialData!.id, formData)
      } else {
        await addWorkoutAction(formData)
      }
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  const types: WorkoutType[] = ['Pull', 'Push', 'Leg', 'Shoulder, Arm', 'Full', 'Running', 'Tennis', 'Rest', 'Other']
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
    'Shoulder, Arm': '❖ 어깨팔 (Shoulder, Arm)'
  }

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

      {/* Markdown exercise records */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          세부 운동 기록 (Markdown)
        </label>
        <textarea
          name="markdown"
          rows={8}
          defaultValue={initialData?.markdown || ''}
          placeholder={`## 풀업\nBW 10 10 10\n\n## 시티드로우\n50kg 12 10 10`}
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

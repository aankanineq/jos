'use client'

import { useState } from 'react'
import { WorkoutEntry, WorkoutType, WorkoutStatus, RunningIntensity } from '@/lib/types'
import { addWorkoutAction, editWorkoutAction } from '@/app/workouts/actions'
import { format } from 'date-fns'

interface Props {
  initialData?: WorkoutEntry
  initialDate?: string
}

export default function WorkoutForm({ initialData, initialDate }: Props) {
  const [type, setType] = useState<WorkoutType>(initialData?.type || 'Pull')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    const markdownVal = (formData.get('markdown') as string || '').trim()
    const status = formData.get('status') as WorkoutStatus
    
    // 1. Validation for Pull/Push/Leg/Full + completed: markdown (memo) required
    const strengthTypes = ['Pull', 'Push', 'Leg', 'Full']
    if (strengthTypes.includes(type) && status === 'completed' && !markdownVal) {
      setErrorMsg(`${type} 완료 기록은 세부 운동 기록(메모)이 필수입니다.`)
      setIsSubmitting(false)
      return
    }
    
    // 2. Validation for Running + completed: distance and duration required
    if (type === 'Running' && status === 'completed') {
      const distance = formData.get('running_distance_km')
      const duration = Number(runningHour) * 3600 + Number(runningMin) * 60 + Number(runningSec)
      if (!distance || Number(distance) <= 0) {
        setErrorMsg('완료된 러닝 기록은 거리(km) 입력이 필수이며 0보다 커야 합니다.')
        setIsSubmitting(false)
        return
      }
      if (!duration || duration <= 0) {
        setErrorMsg('완료된 러닝 기록은 전체 시간(시/분/초) 입력이 필수이며 0보다 커야 합니다.')
        setIsSubmitting(false)
        return
      }
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

  const types: WorkoutType[] = ['Pull', 'Push', 'Leg', 'Running', 'Full', 'Tennis', 'Rest', 'Other']
  const statuses: WorkoutStatus[] = ['planned', 'completed']
  const intensities: RunningIntensity[] = ['easy', 'long', 'tempo', 'interval', 'race', 'unknown']

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto retro-card p-4 min-[390px]:p-6 sm:p-8 bg-white border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 tracking-wide">날짜</label>
          <input
            type="date"
            name="workout_date"
            defaultValue={defaultDate}
            required
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-medium shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 tracking-wide">상태</label>
          <select
            name="status"
            defaultValue={initialData?.status || 'completed'}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-medium shadow-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="bg-white text-slate-900">
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 tracking-wide">운동 종류</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                type === t
                  ? 'bg-slate-900 text-white border-slate-950 shadow-sm scale-102'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Hidden input to submit the selected type */}
        <input type="hidden" name="type" value={type} />
      </div>

      {type === 'Running' && (
        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">🏃 러닝 추가 정보</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">거리 (km)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="running_distance_km"
                defaultValue={initialData?.running_distance_km || ''}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">전체 시간 (시간:분:초)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="시"
                  value={runningHour}
                  onChange={(e) => setRunningHour(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-sm text-center font-bold"
                />
                <span className="text-xs font-bold text-slate-400">시</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="분"
                  value={runningMin}
                  onChange={(e) => setRunningMin(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-sm text-center font-bold"
                />
                <span className="text-xs font-bold text-slate-400">분</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="초"
                  value={runningSec}
                  onChange={(e) => setRunningSec(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-sm text-center font-bold"
                />
                <span className="text-xs font-bold text-slate-400">초</span>
              </div>
              {/* Hidden input to submit the total duration in seconds */}
              <input type="hidden" name="running_duration_sec" value={(Number(runningHour) * 3600 + Number(runningMin) * 60 + Number(runningSec)) || ''} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 tracking-wide">
          운동 기록 (Markdown)
        </label>
        <textarea
          name="markdown"
          rows={8}
          defaultValue={initialData?.markdown || ''}
          placeholder={`## 풀업\nBW 10 10 10\n\n## 시티드로우\n50kg 12 10 10`}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-mono text-sm leading-relaxed transition-all shadow-sm"
        />
      </div>

      {errorMsg && (
        <p className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold text-center rounded-xl animate-shake">
          {errorMsg}
        </p>
      )}

      <div className="pt-4 flex justify-end gap-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 font-semibold transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50 shadow-sm active:scale-97"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '기록 추가'}
        </button>
      </div>
    </form>
  )
}

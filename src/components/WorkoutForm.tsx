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

  const isEditing = !!initialData
  const defaultDate = initialData?.workout_date || initialDate || format(new Date(), 'yyyy-MM-dd')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    
    const formData = new FormData(e.currentTarget)
    const markdownVal = (formData.get('markdown') as string || '').trim()
    
    if (type !== 'Rest' && !markdownVal) {
      setErrorMsg('운동 기록(Markdown)을 입력해주세요. (빈 기록은 저장할 수 없습니다.)')
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

  const types: WorkoutType[] = ['Pull', 'Push', 'Leg', 'Running', 'Full', 'Tennis', 'Rest', 'Other']
  const statuses: WorkoutStatus[] = ['planned', 'completed', 'skipped']
  const intensities: RunningIntensity[] = ['easy', 'long', 'tempo', 'interval', 'race', 'unknown']

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto retro-card p-6 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-300 tracking-wide">날짜</label>
          <input
            type="date"
            name="workout_date"
            defaultValue={defaultDate}
            required
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-300 tracking-wide">상태</label>
          <select
            name="status"
            defaultValue={initialData?.status || 'completed'}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-white">
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-300 tracking-wide">운동 종류</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                type === t
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white border-transparent shadow-[0_2px_10px_rgba(249,115,22,0.4)] scale-102'
                  : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white'
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
        <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4 shadow-inner">
          <h3 className="font-bold text-orange-400 text-sm tracking-wide">🏃 러닝 추가 정보</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">거리 (km)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="running_distance_km"
                defaultValue={initialData?.running_distance_km || ''}
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">시간 (초)</label>
              <input
                type="number"
                min="0"
                name="running_duration_sec"
                defaultValue={initialData?.running_duration_sec || ''}
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">강도</label>
              <select
                name="running_intensity"
                defaultValue={initialData?.running_intensity || 'easy'}
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              >
                {intensities.map((i) => (
                  <option key={i} value={i} className="bg-slate-900 text-white">{i}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-300 tracking-wide">
          운동 기록 (Markdown)
        </label>
        <textarea
          name="markdown"
          rows={8}
          required={type !== 'Rest'}
          defaultValue={initialData?.markdown || ''}
          placeholder={`## 풀업\nBW 10 10 10\n\n## 시티드로우\n50kg 12 10 10`}
          className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 font-mono text-sm leading-relaxed transition-all"
        />
      </div>

      {errorMsg && (
        <p className="p-3.5 bg-red-950/30 border border-red-500/20 text-red-300 text-xs font-semibold text-center rounded-xl animate-shake">
          {errorMsg}
        </p>
      )}

      <div className="pt-4 flex justify-end gap-4 border-t border-white/5">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-bold transition-all disabled:opacity-50 shadow-[0_4px_15px_-5px_rgba(249,115,22,0.4)] active:scale-97"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '기록 추가'}
        </button>
      </div>
    </form>
  )
}

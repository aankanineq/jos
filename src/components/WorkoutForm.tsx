'use client'

import { useState } from 'react'
import { WorkoutEntry, WorkoutType, WorkoutStatus, RunningIntensity } from '@/lib/types'
import { addWorkoutAction, editWorkoutAction } from '@/app/workouts/actions'
import { format } from 'date-fns'

interface Props {
  initialData?: WorkoutEntry
}

export default function WorkoutForm({ initialData }: Props) {
  const [type, setType] = useState<WorkoutType>(initialData?.type || 'Pull')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!initialData
  const defaultDate = initialData?.workout_date || format(new Date(), 'yyyy-MM-dd')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">날짜</label>
          <input
            type="date"
            name="workout_date"
            defaultValue={defaultDate}
            required
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">상태</label>
          <select
            name="status"
            defaultValue={initialData?.status || 'completed'}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">운동 종류</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                type === t
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
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
        <div className="p-4 rounded-xl border border-blue-900/30 bg-blue-900/10 space-y-4">
          <h3 className="font-medium text-blue-400 text-sm">러닝 추가 정보</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">거리 (km)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="running_distance_km"
                defaultValue={initialData?.running_distance_km || ''}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">시간 (초)</label>
              <input
                type="number"
                min="0"
                name="running_duration_sec"
                defaultValue={initialData?.running_duration_sec || ''}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">강도</label>
              <select
                name="running_intensity"
                defaultValue={initialData?.running_intensity || 'easy'}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {intensities.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex justify-between">
          <span>운동 기록 (Markdown)</span>
        </label>
        <textarea
          name="markdown"
          rows={10}
          defaultValue={initialData?.markdown || ''}
          placeholder={`## 풀업\nBW 10 10 10\n\n## 시티드로우\n50kg 12 10 10`}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="pt-4 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 rounded-lg text-zinc-300 hover:text-white font-medium"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '기록 추가'}
        </button>
      </div>
    </form>
  )
}

import { getWorkoutByDate } from '@/lib/workouts/repository'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import WorkoutBadge from '@/components/WorkoutBadge'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { deleteWorkoutAction } from '@/app/workouts/actions'

export default async function DailyWorkoutPage(props: { params: Promise<{ date: string }> }) {
  const params = await props.params
  const workouts = await getWorkoutByDate(params.date)

  const dateStr = format(new Date(params.date), 'yyyy년 M월 d일')

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in pb-24">
      <header className="flex items-center gap-4">
        <Link href="/calendar" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">{dateStr}</h1>
      </header>

      {workouts.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 mb-4">이 날짜에 기록된 운동이 없습니다.</p>
          <Link
            href={`/workouts/new?date=${params.date}`}
            className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            기록 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {workouts.map((workout) => (
            <article key={workout.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <WorkoutBadge type={workout.type} />
                  <span className={`text-sm font-medium ${workout.status === 'completed' ? 'text-green-400' : workout.status === 'planned' ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {workout.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/workouts/${workout.id}/edit`}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <form action={async () => {
                    'use server';
                    await deleteWorkoutAction(workout.id, params.date);
                  }}>
                    <button
                      type="submit"
                      className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors"
                      onClick={(e) => {
                        if (!confirm('정말 삭제하시겠습니까?')) e.preventDefault()
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {workout.type === 'Running' && (
                <div className="px-4 sm:px-6 py-4 bg-zinc-900/30 border-b border-zinc-800 flex flex-wrap gap-6">
                  {workout.running_distance_km !== null && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">거리</p>
                      <p className="font-semibold text-white">{workout.running_distance_km} km</p>
                    </div>
                  )}
                  {workout.running_duration_sec !== null && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">시간</p>
                      <p className="font-semibold text-white">{Math.floor(workout.running_duration_sec / 60)}분 {workout.running_duration_sec % 60}초</p>
                    </div>
                  )}
                  {workout.running_intensity && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">강도</p>
                      <p className="font-semibold text-white capitalize">{workout.running_intensity}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 sm:p-6 prose prose-invert max-w-none prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                {workout.markdown ? (
                  <ReactMarkdown>{workout.markdown}</ReactMarkdown>
                ) : (
                  <p className="text-zinc-500 italic">상세 기록이 없습니다.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

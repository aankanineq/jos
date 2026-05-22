import { getWorkouts } from '@/lib/workouts/repository'
import Link from 'next/link'
import { format } from 'date-fns'
import WorkoutBadge from '@/components/WorkoutBadge'
import { PlusCircle, Search, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkoutsListPage() {
  const workouts = await getWorkouts()

  return (
    <div className="space-y-6 animate-in fade-in pb-24 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
          <p className="text-zinc-400 mt-1">모든 운동 기록을 확인하세요.</p>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          새 기록 추가
        </Link>
      </header>

      {workouts.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 mb-4">아직 기록된 운동이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-zinc-800">
            {workouts.map((w) => (
              <Link
                key={w.id}
                href={`/workouts/${w.workout_date}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-zinc-900/50 transition-colors group gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 flex flex-col items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <span className="text-xs text-zinc-500 font-medium">{format(new Date(w.workout_date), 'MMM')}</span>
                    <span className="text-lg font-bold text-white leading-none">{format(new Date(w.workout_date), 'd')}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <WorkoutBadge type={w.type} />
                      {w.status === 'planned' && <span className="text-xs font-medium text-blue-400 px-1.5 py-0.5 rounded bg-blue-900/20 border border-blue-900/50">예정</span>}
                      {w.status === 'skipped' && <span className="text-xs font-medium text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">스킵</span>}
                    </div>
                    {w.type === 'Running' && w.running_distance_km ? (
                      <p className="text-sm text-zinc-400">
                        {w.running_distance_km}km
                        {w.running_duration_sec && ` • ${Math.floor(w.running_duration_sec / 60)}분`}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500 line-clamp-1 max-w-sm">
                        {w.markdown ? w.markdown.split('\n')[0].replace(/^#+\s/, '') : '상세 기록 없음'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full pl-16 sm:pl-0">
                  <span className="text-xs text-zinc-600 font-medium">
                    {format(new Date(w.created_at), 'yyyy-MM-dd HH:mm')}
                  </span>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

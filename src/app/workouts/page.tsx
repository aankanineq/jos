import { getWorkouts } from '@/lib/workouts/repository'
import Link from 'next/link'
import { format } from 'date-fns'
import { PlusCircle, ChevronRight, Dumbbell } from 'lucide-react'
import WorkoutArtwork from '@/components/WorkoutArtwork'

export const dynamic = 'force-dynamic'

export default async function WorkoutsListPage() {
  const workouts = await getWorkouts()

  return (
    <div className="space-y-6 animate-in fade-in pb-24 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
            Workouts
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium tracking-wide">모든 운동 기록을 시간순으로 확인하세요.</p>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white px-5 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-[0_4px_20px_-5px_rgba(249,115,22,0.4)] hover:scale-102 hover:shadow-[0_6px_25px_-5px_rgba(249,115,22,0.5)] active:scale-98"
        >
          <PlusCircle className="w-5 h-5" />
          새 기록 추가
        </Link>
      </header>

      {workouts.length === 0 ? (
        <div className="retro-card p-12 text-center flex flex-col items-center justify-center">
          <Dumbbell className="w-12 h-12 text-slate-600 mb-4 opacity-30" />
          <p className="text-slate-400 mb-4 font-medium">아직 기록된 운동이 없습니다.</p>
          <Link
            href="/workouts/new"
            className="inline-flex bg-slate-800 hover:bg-slate-700 border border-white/5 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
          >
            첫 기록 작성하기
          </Link>
        </div>
      ) : (
        <div className="retro-card overflow-hidden">
          <div className="divide-y divide-white/5">
            {workouts.map((w) => (
              <Link
                key={w.id}
                href={`/workouts/${w.workout_date}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-all duration-300 group gap-4"
              >
                <div className="flex items-center gap-4">
                  {/* Smartwatch Face Icon */}
                  <WorkoutArtwork type={w.type} status={w.status} size="sm" />
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <h4 className="font-extrabold text-white text-lg tracking-wide group-hover:text-orange-400 transition-colors">
                        {w.type}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        w.status === 'planned' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        'bg-slate-800 text-slate-500 border border-slate-700/50'
                      }`}>
                        {w.status}
                      </span>
                    </div>

                    {w.type === 'Running' && w.running_distance_km ? (
                      <p className="text-sm font-semibold text-slate-400">
                        🏃 {w.running_distance_km}km
                        {w.running_duration_sec && ` • ⏱️ ${Math.floor(w.running_duration_sec / 60)}분 ${w.running_duration_sec % 60}초`}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 line-clamp-1 max-w-md font-medium">
                        {w.markdown ? w.markdown.split('\n')[0].replace(/^#+\s/, '') : '상세 기록 없음'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 sm:w-auto w-full pl-16 sm:pl-0">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-200">
                      {format(new Date(w.workout_date), 'MM월 dd일')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 tracking-wider mt-0.5 uppercase">
                      {format(new Date(w.workout_date), 'EEEE')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

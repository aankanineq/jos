import Link from 'next/link'
import { getMonthlyStats, getRecentWorkouts, getTodayWorkouts } from '@/lib/workouts/stats'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Activity, PlusCircle, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import WorkoutBadge from '@/components/WorkoutBadge'

export default async function Dashboard() {
  const today = new Date()
  const todayStr = format(today, 'yyyy년 M월 d일')
  const currentMonthStr = format(today, 'yyyy년 M월')

  const [stats, recentWorkouts, todayWorkouts] = await Promise.all([
    getMonthlyStats(today),
    getRecentWorkouts(5),
    getTodayWorkouts(),
  ])

  const hasLoggedToday = todayWorkouts.some(w => w.status === 'completed')
  const plannedToday = todayWorkouts.filter(w => w.status === 'planned')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-400 mt-1">{todayStr}</p>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-blue-900/20"
        >
          <PlusCircle className="w-5 h-5" />
          오늘 운동 기록하기
        </Link>
      </header>

      {/* Today Status Alert */}
      <section>
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-4">
          <div className="p-2 rounded-full bg-zinc-800">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-white">오늘의 상태</h3>
            {hasLoggedToday ? (
              <p className="text-zinc-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> 운동 완료! 멋집니다.
              </p>
            ) : (
              <p className="text-zinc-400 mt-1">아직 오늘 운동을 기록하지 않았습니다.</p>
            )}
            
            {plannedToday.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-zinc-300">오늘 예정된 운동:</p>
                <div className="flex flex-wrap gap-2">
                  {plannedToday.map(w => (
                    <WorkoutBadge key={w.id} type={w.type} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Stats */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{currentMonthStr} 요약</h2>
            <Link href="/stats" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center">
              자세히 <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <p className="text-zinc-400 text-sm font-medium mb-1">운동일수</p>
              <p className="text-3xl font-bold text-white">{stats.workoutDays}<span className="text-base font-normal text-zinc-500 ml-1">일</span></p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <p className="text-zinc-400 text-sm font-medium mb-1">러닝 거리</p>
              <p className="text-3xl font-bold text-white">{stats.totalRunningDistance.toFixed(1)}<span className="text-base font-normal text-zinc-500 ml-1">km</span></p>
            </div>
          </div>
        </section>

        {/* Recent Workouts */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">최근 운동</h2>
            <Link href="/workouts" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center">
              모두 보기 <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            {recentWorkouts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                기록이 없습니다.
              </div>
            ) : (
              recentWorkouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/workouts/${w.workout_date}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <WorkoutBadge type={w.type} />
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                      {format(new Date(w.workout_date), 'M/d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {w.status === 'planned' && <Clock className="w-4 h-4 text-zinc-500" />}
                    {w.status === 'skipped' && <span className="text-xs text-zinc-500">Skipped</span>}
                    {w.type === 'Running' && w.running_distance_km ? (
                      <span className="text-sm text-zinc-400 font-medium">{w.running_distance_km}km</span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="pt-4 flex justify-center">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium px-4 py-2"
        >
          <CalendarIcon className="w-5 h-5" />
          캘린더 보기
        </Link>
      </div>
    </div>
  )
}

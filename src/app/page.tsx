import Link from 'next/link'
import { getMonthlyStats, getRecentWorkouts, getTodayWorkouts } from '@/lib/workouts/stats'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Activity, PlusCircle, ChevronRight, CheckCircle2, Dumbbell } from 'lucide-react'
import WorkoutArtwork from '@/components/WorkoutArtwork'

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1.5 font-semibold tracking-wide">{todayStr}</p>
        </div>
        <Link
          href="/workouts/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:scale-102 active:scale-98"
        >
          <PlusCircle className="w-5 h-5" />
          오늘 운동 기록하기
        </Link>
      </header>

      {/* Today Status Alert Card */}
      <section className="retro-card p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
            <Activity className="w-8 h-8 text-slate-800" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-xl text-slate-900 tracking-wide">오늘의 상태</h3>
            {hasLoggedToday ? (
              <p className="text-emerald-600 mt-1 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5" /> 오늘 운동 완료! 아주 훌륭한 하루입니다.
              </p>
            ) : (
              <p className="text-slate-600 mt-1 font-medium">아직 오늘 운동을 기록하지 않았습니다. 기록을 남겨보세요!</p>
            )}
          </div>
        </div>

        {todayWorkouts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">오늘의 운동 리스트</p>
            <div className="flex flex-wrap gap-6">
              {todayWorkouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/workouts/${w.workout_date}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <WorkoutArtwork type={w.type} status={w.status} size="md" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors mt-1">
                    {w.type}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                    w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    w.status === 'planned' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {w.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Stats */}
        <section className="retro-card p-6 lg:col-span-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{currentMonthStr} 요약</h2>
            <Link href="/stats" className="text-slate-800 hover:text-slate-600 text-sm font-bold flex items-center transition-colors">
              자세히 <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4 my-auto py-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner transition-transform hover:scale-102 duration-300">
              <p className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">운동일수</p>
              <p className="text-4xl font-extrabold text-slate-900 flex items-baseline">
                {stats.workoutDays}
                <span className="text-sm font-semibold text-slate-400 ml-1">일</span>
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner transition-transform hover:scale-102 duration-300">
              <p className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">러닝 거리</p>
              <p className="text-4xl font-extrabold text-slate-900 flex items-baseline">
                {stats.totalRunningDistance.toFixed(1)}
                <span className="text-sm font-semibold text-slate-400 ml-1">km</span>
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400 text-center font-medium">
            꾸준히 기록하는 것 자체가 훌륭한 습관입니다.
          </div>
        </section>

        {/* Recent Workouts */}
        <section className="retro-card p-6 lg:col-span-7 relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">최근 운동</h2>
            <Link href="/workouts" className="text-slate-800 hover:text-slate-600 text-sm font-bold flex items-center transition-colors">
              모두 보기 <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {recentWorkouts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm py-12">
                <Dumbbell className="w-8 h-8 mb-2 opacity-30" />
                기록이 없습니다. 첫 운동을 기록해보세요!
              </div>
            ) : (
              recentWorkouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/workouts/${w.workout_date}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <WorkoutArtwork type={w.type} status={w.status} size="sm" />
                    <div>
                      <h4 className="font-bold text-slate-900 tracking-wide group-hover:text-slate-800 transition-colors">
                        {w.type}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold tracking-wider mt-0.5">
                        {format(new Date(w.workout_date), 'yyyy. MM. dd')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {w.type === 'Running' && w.running_distance_km ? (
                      <span className="text-sm font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                        {w.running_distance_km}km
                      </span>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                        w.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        w.status === 'planned' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                        'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {w.status}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
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
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950 transition-colors font-bold px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
        >
          <CalendarIcon className="w-5 h-5 text-slate-700" />
          캘린더 보기
        </Link>
      </div>
    </div>
  )
}

import { getMonthlyStats } from '@/lib/workouts/stats'
import { format } from 'date-fns'
import { Activity, Calendar, Trophy, Zap, Dumbbell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const today = new Date()
  const currentMonth = today
  
  // Get stats for current month
  const stats = await getMonthlyStats(currentMonth)
  
  // Get all workouts for type distribution
  const allWorkouts = stats.workouts
  
  const typeCount = allWorkouts.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const completedWorkouts = allWorkouts.filter(w => w.status === 'completed')
  const runningWorkouts = completedWorkouts.filter(w => w.type === 'Running')

  // Gradient map for each exercise type in stats
  const typeGradientMap: Record<string, string> = {
    Running: 'from-orange-500 to-pink-600',
    Pull: 'from-teal-400 to-teal-700',
    Push: 'from-yellow-400 to-red-600',
    Leg: 'from-amber-400 to-orange-700',
    Full: 'from-emerald-400 to-blue-700',
    Rest: 'from-indigo-500 to-violet-900',
    Tennis: 'from-orange-500 to-amber-600',
    Other: 'from-slate-500 to-slate-800',
    'Shoulder, Arm': 'from-teal-500 to-cyan-600',
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-24 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent">
          Statistics
        </h1>
        <p className="text-slate-500 mt-1.5 font-semibold tracking-wide">
          {format(currentMonth, 'yyyy년 M월')}의 운동 여정을 숫자로 확인해 보세요.
        </p>
      </header>

      {/* Grid containing core indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="retro-card p-5 sm:p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-teal-600 mb-3">
            <Calendar className="w-5 h-5" />
            <h3 className="font-extrabold text-xs tracking-wider uppercase">운동일수</h3>
          </div>
          <p className="text-4xl font-extrabold text-slate-900 flex items-baseline">
            {stats.workoutDays}
            <span className="text-sm font-semibold text-slate-400 ml-1">일</span>
          </p>
        </div>

        <div className="retro-card p-5 sm:p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-red-600 mb-3">
            <Activity className="w-5 h-5" />
            <h3 className="font-extrabold text-xs tracking-wider uppercase">러닝 총 거리</h3>
          </div>
          <p className="text-4xl font-extrabold text-slate-900 flex items-baseline">
            {stats.totalRunningDistance.toFixed(1)}
            <span className="text-sm font-semibold text-slate-400 ml-1">km</span>
          </p>
        </div>

        <div className="retro-card p-5 sm:p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-amber-600 mb-3">
            <Zap className="w-5 h-5" />
            <h3 className="font-extrabold text-xs tracking-wider uppercase">러닝 횟수</h3>
          </div>
          <p className="text-4xl font-extrabold text-slate-900 flex items-baseline">
            {runningWorkouts.length}
            <span className="text-sm font-semibold text-slate-400 ml-1">회</span>
          </p>
        </div>

        <div className="retro-card p-5 sm:p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-purple-600 mb-3">
            <Trophy className="w-5 h-5" />
            <h3 className="font-extrabold text-xs tracking-wider uppercase">총 완료 운동</h3>
          </div>
          <p className="text-4xl font-extrabold text-slate-900 flex items-baseline">
            {completedWorkouts.length}
            <span className="text-sm font-semibold text-slate-400 ml-1">개</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Workout type distribution */}
        <div className="retro-card p-6 relative overflow-hidden flex flex-col">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
          <h3 className="text-xl font-extrabold text-slate-900 mb-6 tracking-wide">운동 타입별 분포</h3>
          <div className="space-y-5 my-auto">
            {Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const percentage = Math.round((count / allWorkouts.length) * 100) || 0
              const barGradient = typeGradientMap[type] || 'from-slate-500 to-slate-800'
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-800">{type}</span>
                    <span className="text-slate-500 font-semibold">{count}회 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200/30 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(typeCount).length === 0 && (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <Dumbbell className="w-10 h-10 mb-2 opacity-25" />
                기록이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Motivational travel-poster styled badge */}
        <div className="retro-card p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/50 border border-slate-100 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[260px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center shadow-md border border-slate-100 mt-2">
            <Trophy className="w-10 h-10 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.15)]" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-slate-900 tracking-wide">꾸준함은 모든 것을 이깁니다</h4>
            <p className="text-xs text-slate-500 max-w-xs font-semibold leading-relaxed">
              산길을 달리고, 절벽을 오르며, 도로를 가로지르는 나만의 여정. 모든 기록은 미래의 튼튼한 이정표가 됩니다.
            </p>
          </div>
          <div className="text-[10px] font-black text-slate-700 tracking-widest uppercase mb-2">
            Keep Moving Forward
          </div>
        </div>
      </div>
    </div>
  )
}

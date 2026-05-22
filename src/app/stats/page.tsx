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
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-24 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
          Statistics
        </h1>
        <p className="text-slate-400 mt-1.5 font-medium tracking-wide">
          {format(currentMonth, 'yyyy년 M월')}의 운동 여정을 숫자로 확인해 보세요.
        </p>
      </header>

      {/* Grid containing core indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="retro-card p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-blue-400 mb-3">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold text-xs tracking-wider uppercase">운동일수</h3>
          </div>
          <p className="text-4xl font-extrabold text-white flex items-baseline">
            {stats.workoutDays}
            <span className="text-sm font-normal text-slate-500 ml-1">일</span>
          </p>
        </div>

        <div className="retro-card p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-orange-400 mb-3">
            <Activity className="w-5 h-5" />
            <h3 className="font-bold text-xs tracking-wider uppercase">러닝 총 거리</h3>
          </div>
          <p className="text-4xl font-extrabold text-white flex items-baseline">
            {stats.totalRunningDistance.toFixed(1)}
            <span className="text-sm font-normal text-slate-500 ml-1">km</span>
          </p>
        </div>

        <div className="retro-card p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-emerald-400 mb-3">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold text-xs tracking-wider uppercase">러닝 횟수</h3>
          </div>
          <p className="text-4xl font-extrabold text-white flex items-baseline">
            {runningWorkouts.length}
            <span className="text-sm font-normal text-slate-500 ml-1">회</span>
          </p>
        </div>

        <div className="retro-card p-6 relative overflow-hidden transition-all duration-300 hover:scale-102">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-pink-400 mb-3">
            <Trophy className="w-5 h-5" />
            <h3 className="font-bold text-xs tracking-wider uppercase">총 완료 운동</h3>
          </div>
          <p className="text-4xl font-extrabold text-white flex items-baseline">
            {completedWorkouts.length}
            <span className="text-sm font-normal text-slate-500 ml-1">개</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Workout type distribution */}
        <div className="retro-card p-6 relative overflow-hidden flex flex-col">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
          <h3 className="text-xl font-bold text-white mb-6 tracking-wide">운동 타입별 분포</h3>
          <div className="space-y-5 my-auto">
            {Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const percentage = Math.round((count / allWorkouts.length) * 100) || 0
              const barGradient = typeGradientMap[type] || 'from-slate-500 to-slate-800'
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-200">{type}</span>
                    <span className="text-slate-400 font-semibold">{count}회 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/60 rounded-full h-3 border border-white/5 overflow-hidden">
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
        <div className="retro-card p-6 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-orange-950/20 border border-white/5 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[260px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -z-10" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-pink-600 flex items-center justify-center shadow-lg border border-white/10 mt-2">
            <Trophy className="w-10 h-10 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-white tracking-wide">꾸준함은 모든 것을 이깁니다</h4>
            <p className="text-xs text-slate-400 max-w-xs font-semibold leading-relaxed">
              산길을 달리고, 절벽을 오르며, 도로를 가로지르는 나만의 여정. 모든 기록은 미래의 튼튼한 이정표가 됩니다.
            </p>
          </div>
          <div className="text-[10px] font-black text-orange-400 tracking-widest uppercase mb-2">
            Keep Moving Forward
          </div>
        </div>
      </div>
    </div>
  )
}

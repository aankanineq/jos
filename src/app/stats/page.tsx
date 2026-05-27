import { getMonthlyStats } from '@/lib/workouts/stats'
import { format } from 'date-fns'
import { Activity, Calendar, Trophy, Zap, Dumbbell, Compass, Award, BarChart3 } from 'lucide-react'

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

  // Sophisticated minimal gradient map for each exercise type in stats
  const typeGradientMap: Record<string, string> = {
    Running: 'from-rose-400 to-pink-500',
    Pull: 'from-emerald-400 to-teal-500',
    Push: 'from-amber-400 to-orange-500',
    Leg: 'from-violet-400 to-purple-500',
    Full: 'from-sky-400 to-indigo-500',
    Rest: 'from-slate-350 to-slate-500',
    Tennis: 'from-lime-400 to-emerald-500',
    Other: 'from-stone-400 to-stone-500',
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28 max-w-4xl mx-auto">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase">
            <BarChart3 className="w-3.5 h-3.5 text-slate-800" />
            Stats & Analysis
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Statistics
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide">
            {format(currentMonth, 'yyyy년 M월')}의 운동 여정을 정밀한 분석 데이터로 확인하세요.
          </p>
        </div>
      </header>

      {/* Grid containing core indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Workout Days */}
        <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden transition-all duration-350 hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase">운동일수</h3>
          </div>
          <p className="text-4xl font-black text-slate-950 flex items-baseline tracking-tight">
            {stats.workoutDays}
            <span className="text-sm font-bold text-slate-400 ml-1">일</span>
          </p>
        </div>

        {/* Card 2: Total Running Distance */}
        <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden transition-all duration-350 hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase">러닝 총 거리</h3>
          </div>
          <p className="text-4xl font-black text-slate-950 flex items-baseline tracking-tight">
            {stats.totalRunningDistance.toFixed(1)}
            <span className="text-sm font-bold text-slate-400 ml-1">km</span>
          </p>
        </div>

        {/* Card 3: Running Count */}
        <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden transition-all duration-350 hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase">러닝 횟수</h3>
          </div>
          <p className="text-4xl font-black text-slate-950 flex items-baseline tracking-tight">
            {runningWorkouts.length}
            <span className="text-sm font-bold text-slate-400 ml-1">회</span>
          </p>
        </div>

        {/* Card 4: Total Completed */}
        <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden transition-all duration-350 hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-xs text-slate-400 tracking-wider uppercase">총 완료 운동</h3>
          </div>
          <p className="text-4xl font-black text-slate-950 flex items-baseline tracking-tight">
            {completedWorkouts.length}
            <span className="text-sm font-bold text-slate-400 ml-1">개</span>
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        
        {/* Workout type distribution */}
        <div className="retro-card p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col md:col-span-7">
          <div className="flex items-center gap-2 mb-6">
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-800 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">운동 타입별 분포</h3>
          </div>
          <div className="space-y-5 my-auto">
            {Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const percentage = Math.round((count / allWorkouts.length) * 100) || 0
              const barGradient = typeGradientMap[type] || 'from-slate-400 to-slate-500'
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800 font-extrabold">{type}</span>
                    <span className="text-slate-400">{count}회 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3.5 border border-slate-100 overflow-hidden shadow-inner p-0.5">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 shadow-sm`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(typeCount).length === 0 && (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3">
                <Dumbbell className="w-10 h-10 opacity-20 animate-pulse" />
                <p className="text-sm font-semibold">아직 기록된 운동 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Motivational premium card */}
        <div className="retro-card p-6 sm:p-8 bg-gradient-to-tr from-slate-50 to-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[300px] md:col-span-5 border-l-4 border-l-slate-900">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-slate-900/[0.02] rounded-full blur-3xl -z-10" />
          
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-[0_4px_15px_-4px_rgba(0,0,0,0.06)] border border-slate-100 mt-2">
            <Award className="w-8 h-8 text-slate-800" />
          </div>
          
          <div className="space-y-2 mt-4">
            <h4 className="text-lg font-black text-slate-950 tracking-tight">꾸준함은 모든 것을 이깁니다</h4>
            <p className="text-xs text-slate-500 max-w-xs font-semibold leading-relaxed">
              산길을 달리고, 절벽을 오르며, 도로를 가로지르는 나만의 여정. 모든 기록은 미래의 튼튼한 이정표가 됩니다.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[9px] font-black tracking-widest uppercase mt-6 mb-2">
            <Compass className="w-3 h-3 text-slate-900" />
            Keep Moving Forward
          </div>
        </div>

      </div>
    </div>
  )
}


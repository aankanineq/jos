import { getMonthlyStats, getRecentWorkouts } from '@/lib/workouts/stats'
import { format, subMonths } from 'date-fns'
import { Activity, Calendar, Trophy, Zap } from 'lucide-react'

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

  return (
    <div className="space-y-6 animate-in fade-in pb-24 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-zinc-400 mt-1">{format(currentMonth, 'yyyy년 M월')}의 운동 통계입니다.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-medium text-sm">운동일수</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.workoutDays}<span className="text-base font-normal text-zinc-500 ml-1">일</span></p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-yellow-400 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-medium text-sm">러닝 총 거리</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalRunningDistance.toFixed(1)}<span className="text-base font-normal text-zinc-500 ml-1">km</span></p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <Zap className="w-5 h-5" />
            <h3 className="font-medium text-sm">러닝 횟수</h3>
          </div>
          <p className="text-3xl font-bold text-white">{runningWorkouts.length}<span className="text-base font-normal text-zinc-500 ml-1">회</span></p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <Trophy className="w-5 h-5" />
            <h3 className="font-medium text-sm">총 완료 운동</h3>
          </div>
          <p className="text-3xl font-bold text-white">{completedWorkouts.length}<span className="text-base font-normal text-zinc-500 ml-1">개</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-6">운동 타입별 분포</h3>
          <div className="space-y-4">
            {Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const percentage = Math.round((count / allWorkouts.length) * 100) || 0
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-300">{type}</span>
                    <span className="text-zinc-500">{count}회 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        type === 'Pull' ? 'bg-blue-500' : 
                        type === 'Push' ? 'bg-red-500' : 
                        type === 'Leg' ? 'bg-green-500' : 
                        type === 'Running' ? 'bg-yellow-500' : 'bg-zinc-500'
                      }`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
            {Object.keys(typeCount).length === 0 && (
              <p className="text-zinc-500 text-sm">기록이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

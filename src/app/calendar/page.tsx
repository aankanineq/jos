import { getWorkouts } from '@/lib/workouts/repository'
import CalendarGrid from '@/components/CalendarGrid'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const workouts = await getWorkouts()

  return (
    <div className="space-y-6 animate-in fade-in pb-24">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
          Calendar
        </h1>
        <p className="text-slate-400 mt-1.5 font-medium tracking-wide">월별 운동 흐름을 한눈에 확인하세요.</p>
      </header>
      
      <CalendarGrid workouts={workouts} />
    </div>
  )
}

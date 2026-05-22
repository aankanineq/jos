import { getWorkouts } from '@/lib/workouts/repository'
import CalendarGrid from '@/components/CalendarGrid'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const workouts = await getWorkouts()

  return (
    <div className="space-y-6 animate-in fade-in pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-zinc-400 mt-1">월별 운동 흐름을 한눈에 확인하세요.</p>
      </header>
      
      <CalendarGrid workouts={workouts} />
    </div>
  )
}

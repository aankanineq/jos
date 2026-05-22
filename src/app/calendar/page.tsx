import { getWorkouts } from '@/lib/workouts/repository'
import CalendarGrid from '@/components/CalendarGrid'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const workouts = await getWorkouts()

  return (
    <div className="space-y-6 animate-in fade-in pb-24">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Calendar
        </h1>
        <p className="text-slate-500 mt-1.5 font-semibold tracking-wide">월별 운동 흐름을 한눈에 확인하세요.</p>
      </header>
      
      <CalendarGrid workouts={workouts} />
    </div>
  )
}

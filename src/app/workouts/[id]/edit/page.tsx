import WorkoutForm from '@/components/WorkoutForm'
import { getWorkoutById } from '@/lib/workouts/repository'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditWorkoutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const workout = await getWorkoutById(params.id)

  if (!workout) {
    notFound()
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-24">
      <header className="flex items-center gap-4">
        <Link 
          href={`/workouts/${workout.workout_date}`} 
          className="p-3 -ml-3 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">기록 수정</h1>
          <p className="text-slate-400 text-xs font-semibold tracking-wider mt-0.5 uppercase">
            {workout.workout_date} 기록 수정
          </p>
        </div>
      </header>

      <WorkoutForm initialData={workout} />
    </div>
  )
}

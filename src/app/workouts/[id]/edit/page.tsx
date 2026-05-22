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
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      <header className="flex items-center gap-4">
        <Link href={`/workouts/${workout.workout_date}`} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">기록 수정</h1>
      </header>

      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <WorkoutForm initialData={workout} />
      </section>
    </div>
  )
}

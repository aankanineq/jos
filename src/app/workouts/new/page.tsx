import WorkoutForm from '@/components/WorkoutForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewWorkoutPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">새 운동 기록</h1>
      </header>

      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <WorkoutForm />
      </section>
    </div>
  )
}

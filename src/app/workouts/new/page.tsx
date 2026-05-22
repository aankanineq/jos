import WorkoutForm from '@/components/WorkoutForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function NewWorkoutPage(props: Props) {
  const searchParams = await props.searchParams
  const date = searchParams.date

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-24">
      <header className="flex items-center gap-4">
        <Link 
          href={date ? `/workouts/${date}` : "/"} 
          className="p-3 -ml-3 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">새 운동 기록</h1>
          <p className="text-slate-400 text-xs font-semibold tracking-wider mt-0.5 uppercase">
            {date ? `${date} 기록 작성` : '오늘의 운동 기록 추가'}
          </p>
        </div>
      </header>

      <WorkoutForm initialDate={date} />
    </div>
  )
}


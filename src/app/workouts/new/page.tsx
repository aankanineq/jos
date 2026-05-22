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
          className="p-3 -ml-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors text-slate-500 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">새 운동 기록</h1>
          <p className="text-slate-500 text-xs font-bold tracking-wider mt-0.5 uppercase">
            {date ? `${date} 기록 작성` : '오늘의 운동 기록 추가'}
          </p>
        </div>
      </header>

      <WorkoutForm initialDate={date} />
    </div>
  )
}

import { getWorkoutByDate } from '@/lib/workouts/repository'
import { ArrowLeft, Edit2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import DeleteWorkoutButton from '@/components/DeleteWorkoutButton'
import WorkoutArtwork from '@/components/WorkoutArtwork'

export default async function DailyWorkoutPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const dateStrParam = params.id
  const workouts = await getWorkoutByDate(dateStrParam)

  const dateStr = format(new Date(dateStrParam), 'yyyy년 M월 d일')

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in pb-24">
      <header className="flex items-center gap-4">
        <Link href="/calendar" className="p-3 -ml-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dateStr}</h1>
          <p className="text-slate-500 text-xs font-bold tracking-wider mt-0.5 uppercase">
            {format(new Date(dateStrParam), 'EEEE')} 운동 기록
          </p>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="retro-card p-12 text-center bg-white border border-slate-100">
          <p className="text-slate-600 mb-6 font-semibold">이 날짜에 기록된 운동이 없습니다.</p>
          <Link
            href={`/workouts/new?date=${dateStrParam}`}
            className="inline-flex bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-sm"
          >
            기록 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {workouts.map((workout) => (
            <article
              key={workout.id}
              className="retro-card overflow-hidden bg-white border border-slate-100"
            >
              {/* Card Header with Smartwatch Artwork */}
              <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                <div className="flex items-center gap-5">
                  <WorkoutArtwork type={workout.type} status={workout.status} size="md" />
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{workout.type}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                        workout.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        workout.status === 'planned' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                        'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {workout.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <Link
                    href={`/workouts/${workout.id}/edit`}
                    className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-all shadow-sm"
                    title="수정"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <DeleteWorkoutButton id={workout.id} date={dateStrParam} />
                </div>
              </div>

              {/* Running specific info */}
              {workout.type === 'Running' && (
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-50/30 border-b border-slate-100 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 text-center">
                  {workout.running_distance_km !== null && (
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">거리</p>
                      <p className="text-base min-[375px]:text-lg sm:text-xl font-extrabold text-slate-900">
                        {workout.running_distance_km} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">km</span>
                      </p>
                    </div>
                  )}
                  {workout.running_duration_sec !== null && (
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">시간</p>
                      <p className="text-base min-[375px]:text-lg sm:text-xl font-extrabold text-slate-900 whitespace-nowrap">
                        {Math.floor(workout.running_duration_sec / 60)}<span className="text-[10px] sm:text-xs font-semibold text-slate-400">분</span> {workout.running_duration_sec % 60}<span className="text-[10px] sm:text-xs font-semibold text-slate-400">초</span>
                      </p>
                    </div>
                  )}
                  {workout.running_intensity && (
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">강도</p>
                      <p className="text-sm min-[375px]:text-base font-black text-orange-600 capitalize pt-0.5">{workout.running_intensity}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Markdown Content */}
              <div className="p-6 sm:p-8 prose max-w-none prose-headings:font-extrabold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-100 prose-pre:rounded-2xl">
                {workout.markdown ? (
                  <ReactMarkdown>{workout.markdown}</ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic">상세 기록이 작성되지 않았습니다.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

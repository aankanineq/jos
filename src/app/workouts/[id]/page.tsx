import { getWorkoutByDate } from '@/lib/workouts/repository'
import { ArrowLeft, Edit2, Calendar } from 'lucide-react'
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
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in pb-28">
      <header className="flex items-center gap-4">
        <Link 
          href="/calendar" 
          className="p-3 -ml-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-150 transition-all hover:scale-102 text-slate-500 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="inline-flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase">
            <Calendar className="w-3 h-3" />
            WORKOUT DETAILS
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">{dateStr}</h1>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="retro-card p-12 text-center bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <p className="text-slate-500 mb-6 font-semibold">이 날짜에 기록된 운동이 없습니다.</p>
          <Link
            href={`/workouts/new?date=${dateStrParam}`}
            className="inline-flex bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-98"
          >
            기록 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {workouts.map((workout) => (
            <article
              key={workout.id}
              className="retro-card overflow-hidden bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
            >
              {/* Card Header with Smartwatch Artwork */}
              <div className="border-b border-slate-100 bg-slate-50/20 p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                <div className="flex items-center gap-5">
                  <WorkoutArtwork type={workout.type} status={workout.status} size="md" />
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">{workout.type}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wider ${
                        workout.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border border-slate-200 font-extrabold'
                      }`}>
                        {workout.status === 'completed' ? '완료' : '계획'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <Link
                    href={`/workouts/${workout.id}/edit`}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 transition-all hover:scale-102 shadow-sm"
                    title="수정"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <DeleteWorkoutButton id={workout.id} date={dateStrParam} />
                </div>
              </div>

              {/* Running specific info */}
              {workout.type === 'Running' && (
                <div className="px-4 sm:px-8 py-5 bg-slate-50/10 border-b border-slate-100 grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-center">
                  {workout.running_distance_km !== null && (
                    <div className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100/80 shadow-inner flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">거리</p>
                      <p className="text-base min-[375px]:text-lg sm:text-2xl font-black text-slate-950">
                        {workout.running_distance_km} <span className="text-xs font-bold text-slate-400">km</span>
                      </p>
                    </div>
                  )}
                  {workout.running_duration_sec !== null && (
                    <div className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100/80 shadow-inner flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">시간</p>
                      <p className="text-base min-[375px]:text-lg sm:text-2xl font-black text-slate-950 whitespace-nowrap">
                        {(() => {
                          const h = Math.floor(workout.running_duration_sec / 3600)
                          const m = Math.floor((workout.running_duration_sec % 3600) / 60).toString().padStart(2, '0')
                          const s = (workout.running_duration_sec % 60).toString().padStart(2, '0')
                          return `${h}:${m}:${s}`
                        })()}
                      </p>
                    </div>
                  )}
                  {workout.running_pace_sec_per_km !== null && (
                    <div className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100/80 shadow-inner flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">페이스</p>
                      <p className="text-base min-[375px]:text-lg sm:text-2xl font-black text-slate-950 whitespace-nowrap">
                        {(() => {
                          const mins = Math.floor(workout.running_pace_sec_per_km / 60)
                          const secs = (workout.running_pace_sec_per_km % 60).toString().padStart(2, '0')
                          return `${mins}'${secs}"/km`
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Markdown Content */}
              <div className="p-6 sm:p-8 prose max-w-none prose-headings:font-extrabold prose-headings:text-slate-950 prose-p:text-slate-600 prose-p:font-semibold prose-p:leading-relaxed prose-li:text-slate-600 prose-li:font-semibold prose-pre:bg-slate-50/60 prose-pre:border prose-pre:border-slate-100 prose-pre:rounded-2xl">
                {workout.markdown ? (
                  <ReactMarkdown>{workout.markdown}</ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic font-medium">상세 기록이 작성되지 않았습니다.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}


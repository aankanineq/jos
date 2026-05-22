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
        <Link href="/calendar" className="p-3 -ml-3 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 border border-white/5 transition-colors text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{dateStr}</h1>
          <p className="text-slate-400 text-xs font-semibold tracking-wider mt-0.5 uppercase">
            {format(new Date(dateStrParam), 'EEEE')} 운동 기록
          </p>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="retro-card p-12 text-center">
          <p className="text-slate-400 mb-6 font-medium">이 날짜에 기록된 운동이 없습니다.</p>
          <Link
            href={`/workouts/new?date=${dateStrParam}`}
            className="inline-flex bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-[0_4px_20px_-5px_rgba(249,115,22,0.4)]"
          >
            기록 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {workouts.map((workout) => (
            <article
              key={workout.id}
              className={`retro-card overflow-hidden relative ${
                workout.type === 'Running' ? 'retro-card-glow-running' :
                workout.type === 'Pull' ? 'retro-card-glow-pull' :
                workout.type === 'Push' ? 'retro-card-glow-push' :
                workout.type === 'Leg' ? 'retro-card-glow-leg' :
                workout.type === 'Full' ? 'retro-card-glow-full' :
                workout.type === 'Rest' ? 'retro-card-glow-rest' : ''
              }`}
            >
              {/* Card Header with Smartwatch Artwork */}
              <div className="border-b border-white/5 bg-slate-900/40 p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                <div className="flex items-center gap-5">
                  <WorkoutArtwork type={workout.type} status={workout.status} size="md" />
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-wide">{workout.type}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        workout.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        workout.status === 'planned' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        'bg-slate-800 text-slate-500 border border-slate-700/50'
                      }`}>
                        {workout.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <Link
                    href={`/workouts/${workout.id}/edit`}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/5 transition-all"
                    title="수정"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <DeleteWorkoutButton id={workout.id} date={dateStrParam} />
                </div>
              </div>

              {/* Running specific info */}
              {workout.type === 'Running' && (
                <div className="px-5 sm:px-6 py-4 bg-slate-950/40 border-b border-white/5 grid grid-cols-3 gap-6 text-center">
                  {workout.running_distance_km !== null && (
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 shadow-inner">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">거리</p>
                      <p className="text-xl font-extrabold text-white">{workout.running_distance_km} <span className="text-xs font-normal text-slate-500">km</span></p>
                    </div>
                  )}
                  {workout.running_duration_sec !== null && (
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 shadow-inner">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">시간</p>
                      <p className="text-xl font-extrabold text-white">
                        {Math.floor(workout.running_duration_sec / 60)}<span className="text-xs font-normal text-slate-500">분</span> {workout.running_duration_sec % 60}<span className="text-xs font-normal text-slate-500">초</span>
                      </p>
                    </div>
                  )}
                  {workout.running_intensity && (
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 shadow-inner">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">강도</p>
                      <p className="text-base font-black text-orange-400 capitalize pt-0.5">{workout.running_intensity}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Markdown Content */}
              <div className="p-6 sm:p-8 prose prose-invert max-w-none prose-headings:font-black prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl">
                {workout.markdown ? (
                  <ReactMarkdown>{workout.markdown}</ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic">상세 기록이 작성되지 않았습니다.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

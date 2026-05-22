'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { WorkoutEntry } from '@/lib/types'
import WorkoutArtwork from './WorkoutArtwork'

interface Props {
  workouts: WorkoutEntry[]
}

export default function CalendarGrid({ workouts }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateFormat = "d"
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="retro-card overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-slate-900/40">
        <h2 className="text-2xl font-black tracking-wide text-white capitalize">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-white/5 transition-colors text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white transition-all shadow-[0_2px_10px_rgba(249,115,22,0.3)] active:scale-95"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-white/5 transition-colors text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-white/5 bg-slate-950/20">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-950/10">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayWorkouts = workouts.filter(w => w.workout_date === dateStr)
          
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isTodayDate = isToday(day)

          return (
            <Link
              key={day.toString()}
              href={`/workouts/${dateStr}`}
              className={`min-h-[90px] sm:min-h-[110px] p-3 rounded-2xl transition-all duration-300 relative group flex flex-col justify-between m-1 overflow-hidden border isolate ${
                dayWorkouts.length > 0 
                  ? 'border-white/10 shadow-lg hover:scale-102 hover:shadow-[0_8px_20px_-5px_rgba(0,0,0,0.8)]' 
                  : 'border-white/5 hover:border-white/10 bg-slate-900/30'
              } ${
                !isCurrentMonth ? 'opacity-20 pointer-events-none' : ''
              } ${isTodayDate ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              {/* Split Workout Gradients Background */}
              {dayWorkouts.length > 0 && (
                <div className="absolute inset-1.5 flex gap-1 -z-10 overflow-hidden">
                  {dayWorkouts.map((w) => {
                    const grad = gradientMap[w.type] || gradientMap['Other']
                    const isCompleted = w.status === 'completed'
                    const isPlanned = w.status === 'planned'
                    return (
                      <div
                        key={w.id}
                        className={`flex-1 h-full bg-gradient-to-br ${grad} rounded-xl relative flex items-center justify-center overflow-hidden border border-white/5 transition-all ${
                          isCompleted ? 'opacity-90 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]' : isPlanned ? 'opacity-40 animate-pulse' : 'opacity-25'
                        }`}
                        title={`${w.type} (${w.status})`}
                      >
                        <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-widest text-white/90 [writing-mode:vertical-lr] rotate-180 select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] whitespace-nowrap">
                          {w.type}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Day number */}
              <div className="flex justify-between items-start z-10">
                <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all ${
                  isTodayDate
                    ? 'bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.4)]'
                    : dayWorkouts.length > 0
                      ? 'bg-slate-950/80 text-white border border-white/10 backdrop-blur-sm shadow'
                      : 'text-slate-400 group-hover:text-white'
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>

              {/* Running Distance or other stat overlay at bottom right */}
              {dayWorkouts.some(w => w.type === 'Running' && w.running_distance_km) && (
                <span className="absolute bottom-2 right-2 text-[9px] font-black px-1.5 py-0.5 bg-slate-950/85 text-orange-400 border border-white/10 rounded-md shadow backdrop-blur-sm z-10">
                  🏃 {dayWorkouts.filter(w => w.type === 'Running').reduce((acc, curr) => acc + (curr.running_distance_km || 0), 0).toFixed(1)}k
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const gradientMap: Record<string, string> = {
  Running: 'from-orange-500 via-pink-500 to-indigo-500',
  Pull: 'from-teal-400 via-teal-600 to-teal-900',
  Push: 'from-yellow-400 via-orange-500 to-red-600',
  Leg: 'from-amber-500 via-orange-600 to-orange-950',
  Full: 'from-emerald-400 via-emerald-600 to-blue-600',
  Rest: 'from-indigo-900 via-purple-950 to-slate-950',
  Tennis: 'from-orange-500 via-amber-500 to-amber-700',
  Other: 'from-slate-600 via-slate-700 to-slate-900',
}



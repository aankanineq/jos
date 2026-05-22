'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { WorkoutEntry } from '@/lib/types'

interface Props {
  workouts: WorkoutEntry[]
}

const workoutThemes: Record<string, { bg: string; border: string; text: string }> = {
  Running: { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-900' },
  Pull: { bg: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-900' },
  Push: { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-900' },
  Leg: { bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-900' },
  Full: { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-900' },
  Rest: { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-900' },
  Tennis: { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-900' },
  Other: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-900' },
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
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 capitalize">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors text-slate-500 hover:text-slate-900"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/20">
        {weekDays.map((day) => (
          <div key={day} className="py-2 sm:py-3 text-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight sm:tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-50/30">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayWorkouts = workouts.filter(w => w.workout_date === dateStr)
          
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isTodayDate = isToday(day)

          return (
            <Link
              key={day.toString()}
              href={`/workouts/${dateStr}`}
              className={`min-h-[72px] min-[375px]:min-h-[85px] sm:min-h-[110px] p-1 min-[375px]:p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 relative group flex flex-col justify-between m-0.5 min-[375px]:m-1 overflow-hidden border isolate ${
                dayWorkouts.length > 0 
                  ? 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/70 hover:shadow-sm' 
                  : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
              } ${
                !isCurrentMonth ? 'opacity-20 pointer-events-none' : ''
              } ${isTodayDate ? 'ring-2 ring-slate-900/30' : ''}`}
            >
              {/* Split Workout Gradients Background */}
              {dayWorkouts.length > 0 && (
                <div className="absolute inset-0.5 min-[375px]:inset-1 sm:inset-1.5 flex flex-col gap-0.5 min-[375px]:gap-1 -z-10 overflow-hidden">
                  {dayWorkouts.map((w) => {
                    const normType = w.type.charAt(0).toUpperCase() + w.type.slice(1).toLowerCase()
                    const theme = workoutThemes[normType] || workoutThemes['Other']
                    const isCompleted = w.status === 'completed'
                    const isPlanned = w.status === 'planned'
                    const displayLabel = w.type.toUpperCase() === 'RUNNING' ? 'RUN' : w.type
                    return (
                      <div
                        key={w.id}
                        className={`flex-1 flex items-center justify-center rounded min-[375px]:rounded-lg border ${theme.bg} ${theme.border} ${theme.text} px-0.5 min-[375px]:px-1.5 transition-all ${
                          isCompleted ? 'opacity-100 shadow-sm' : isPlanned ? 'opacity-60 animate-pulse' : 'opacity-40'
                        }`}
                        title={`${w.type} (${w.status})`}
                      >
                        <span className="text-[7.5px] min-[375px]:text-[8.5px] min-[400px]:text-[9.5px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-wider select-none truncate whitespace-nowrap">
                          {displayLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Day number */}
              <div className="flex justify-between items-start z-10">
                <span className={`text-[8.5px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded transition-all ${
                  isTodayDate
                    ? 'bg-slate-900 text-white shadow-sm'
                    : dayWorkouts.length > 0
                      ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                      : 'text-slate-400 group-hover:text-slate-900 font-bold'
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

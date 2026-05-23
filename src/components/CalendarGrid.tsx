'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { WorkoutEntry } from '@/lib/types'

interface Props {
  workouts: WorkoutEntry[]
}

const workoutThemes: Record<string, { bg: string; border: string; text: string }> = {
  Running: { bg: 'bg-rose-50/60', border: 'border-rose-100/70', text: 'text-rose-700 font-extrabold' },
  Pull: { bg: 'bg-emerald-50/60', border: 'border-emerald-100/70', text: 'text-emerald-700 font-extrabold' },
  Push: { bg: 'bg-amber-50/60', border: 'border-amber-100/70', text: 'text-amber-700 font-extrabold' },
  Leg: { bg: 'bg-violet-50/60', border: 'border-violet-100/70', text: 'text-violet-700 font-extrabold' },
  Full: { bg: 'bg-sky-50/60', border: 'border-sky-100/70', text: 'text-sky-700 font-extrabold' },
  Rest: { bg: 'bg-slate-50/60', border: 'border-slate-100/80', text: 'text-slate-500 font-bold' },
  Tennis: { bg: 'bg-lime-50/60', border: 'border-lime-100/70', text: 'text-lime-700 font-extrabold' },
  Other: { bg: 'bg-stone-50/60', border: 'border-stone-100/70', text: 'text-stone-600 font-bold' },
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
    <div className="retro-card overflow-hidden bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] pb-2">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/30">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 capitalize flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-800" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2.5">
          <button
            onClick={prevMonth}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition-all text-slate-500 hover:text-slate-900 shadow-sm active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4.5 py-2 text-xs font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition-all text-slate-500 hover:text-slate-900 shadow-sm active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/10">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-50/20 p-2 sm:p-3 gap-1 sm:gap-2">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayWorkouts = workouts.filter(w => w.workout_date === dateStr)
          
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isTodayDate = isToday(day)

          return (
            <Link
              key={day.toString()}
              href={`/workouts/${dateStr}`}
              className={`min-h-[76px] min-[375px]:min-h-[88px] sm:min-h-[115px] p-2 rounded-2xl transition-all duration-300 relative group flex flex-col justify-between overflow-hidden border isolate ${
                dayWorkouts.length > 0 
                  ? 'border-slate-200/60 bg-slate-50/20 hover:bg-slate-50/60 hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)]' 
                  : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)]'
              } ${
                !isCurrentMonth ? 'opacity-15 pointer-events-none' : ''
              } ${isTodayDate ? 'ring-2 ring-slate-900/5 shadow-sm' : ''}`}
            >
              {/* Split Workout Gradients Background */}
              {dayWorkouts.length > 0 && (
                <div className="absolute inset-1.5 sm:inset-2 top-7 sm:top-8 flex flex-col gap-1 -z-10 overflow-hidden">
                  {dayWorkouts.map((w) => {
                    const normType = w.type.charAt(0).toUpperCase() + w.type.slice(1).toLowerCase()
                    const theme = workoutThemes[normType] || workoutThemes['Other']
                    const isCompleted = w.status === 'completed'
                    const isPlanned = w.status === 'planned'
                    const displayLabel = w.type.toUpperCase() === 'RUNNING' ? 'RUN' : w.type
                    return (
                      <div
                        key={w.id}
                        className={`flex-1 flex items-center justify-center rounded-xl border ${theme.bg} ${theme.border} ${theme.text} px-1 sm:px-1.5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                          isCompleted ? 'opacity-100' : isPlanned ? 'opacity-65 animate-pulse' : 'opacity-40'
                        }`}
                        title={`${w.type} (${w.status})`}
                      >
                        <span className="text-[8px] min-[375px]:text-[9px] sm:text-[10px] font-black uppercase tracking-wider select-none truncate whitespace-nowrap">
                          {displayLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Day number */}
              <div className="flex justify-between items-start z-10">
                <span className={`text-[9px] sm:text-[10px] font-black w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-lg transition-all ${
                  isTodayDate
                    ? 'bg-slate-950 text-white shadow-sm font-black'
                    : dayWorkouts.length > 0
                      ? 'bg-slate-900 text-white shadow-sm font-black'
                      : 'text-slate-400 group-hover:text-slate-900 font-extrabold'
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


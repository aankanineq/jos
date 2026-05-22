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
  Running: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
  Pull: { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-700' },
  Push: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  Leg: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
  Full: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  Rest: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
  Tennis: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
  Other: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700' },
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
          <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
              className={`min-h-[90px] sm:min-h-[110px] p-3 rounded-2xl transition-all duration-200 relative group flex flex-col justify-between m-1 overflow-hidden border isolate ${
                dayWorkouts.length > 0 
                  ? 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/70 hover:shadow-sm' 
                  : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
              } ${
                !isCurrentMonth ? 'opacity-20 pointer-events-none' : ''
              } ${isTodayDate ? 'ring-2 ring-slate-900/30' : ''}`}
            >
              {/* Split Workout Gradients Background */}
              {dayWorkouts.length > 0 && (
                <div className="absolute inset-1.5 flex flex-col gap-1 -z-10 overflow-hidden">
                  {dayWorkouts.map((w) => {
                    const normType = w.type.charAt(0).toUpperCase() + w.type.slice(1).toLowerCase()
                    const theme = workoutThemes[normType] || workoutThemes['Other']
                    const isCompleted = w.status === 'completed'
                    const isPlanned = w.status === 'planned'
                    const displayLabel = w.type.toUpperCase() === 'RUNNING' ? 'RUN' : w.type
                    return (
                      <div
                        key={w.id}
                        className={`flex-1 flex items-center justify-center rounded-lg border ${theme.bg} ${theme.border} ${theme.text} px-2 transition-all ${
                          isCompleted ? 'opacity-100 shadow-sm' : isPlanned ? 'opacity-60 animate-pulse' : 'opacity-40'
                        }`}
                        title={`${w.type} (${w.status})`}
                      >
                        <span className="text-[8px] sm:text-[9.5px] font-extrabold uppercase tracking-wider select-none truncate whitespace-nowrap">
                          {displayLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Day number */}
              <div className="flex justify-between items-start z-10">
                <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md transition-all ${
                  isTodayDate
                    ? 'bg-slate-900 text-white shadow-sm'
                    : dayWorkouts.length > 0
                      ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                      : 'text-slate-400 group-hover:text-slate-900 font-bold'
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>

              {/* Running Distance or other stat overlay at bottom right */}
              {dayWorkouts.some(w => w.type === 'Running' && w.running_distance_km) && (
                <span className="absolute bottom-2 right-2 text-[9px] font-black px-1.5 py-0.5 bg-slate-900 text-white border border-slate-800 rounded-md shadow-sm z-10">
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

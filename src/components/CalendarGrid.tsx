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
              className={`min-h-[90px] sm:min-h-[110px] p-2 border-b border-r border-white/5 hover:bg-white/[0.02] transition-all relative group flex flex-col justify-between ${
                !isCurrentMonth ? 'bg-slate-950/40 opacity-30 pointer-events-none' : ''
              } ${isTodayDate ? 'bg-orange-500/5' : ''}`}
            >
              {/* Day number */}
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all ${
                  isTodayDate
                    ? 'bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.4)]'
                    : 'text-slate-400 group-hover:text-white'
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>

              {/* Workouts rendered as micro smartwatch-face vector app icons */}
              <div className="mt-2 flex flex-wrap gap-1.5 overflow-hidden">
                {dayWorkouts.map((w) => (
                  <div
                    key={w.id}
                    title={`${w.type} (${w.status})`}
                    className="relative"
                  >
                    <WorkoutArtwork type={w.type} status={w.status} size="xs" />
                    {w.type === 'Running' && w.running_distance_km ? (
                      <span className="absolute -bottom-1 -right-1 text-[8px] font-black px-0.5 bg-slate-950 text-orange-400 border border-white/5 rounded">
                        {Math.round(w.running_distance_km)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

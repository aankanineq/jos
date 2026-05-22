'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { WorkoutEntry } from '@/lib/types'
import WorkoutBadge from './WorkoutBadge'

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
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/50">
        <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-800">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayWorkouts = workouts.filter(w => w.workout_date === dateStr)
          
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isTodayDate = isToday(day)

          return (
            <Link
              key={day.toString()}
              href={`/workouts/${dateStr}`}
              className={`min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-zinc-800/50 hover:bg-zinc-800/30 transition-colors relative group ${
                !isCurrentMonth ? 'bg-zinc-950/50 opacity-50' : ''
              } ${isTodayDate ? 'bg-blue-900/10' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm sm:text-base font-medium p-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isTodayDate ? 'bg-blue-600 text-white' : 'text-zinc-400 group-hover:text-white'
                }`}>
                  {format(day, dateFormat)}
                </span>
              </div>

              <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar">
                {dayWorkouts.map(w => (
                  <div key={w.id} className="flex flex-col gap-0.5">
                    <WorkoutBadge type={w.type} className="text-[10px] sm:text-xs py-0 sm:py-0.5 inline-block w-fit opacity-90" />
                    {w.type === 'Running' && w.running_distance_km && (
                      <span className="text-[10px] text-zinc-500 font-medium pl-1">
                        {w.running_distance_km}km
                      </span>
                    )}
                    {w.status === 'planned' && (
                      <span className="text-[9px] text-blue-400/80 uppercase pl-1 block">예정</span>
                    )}
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

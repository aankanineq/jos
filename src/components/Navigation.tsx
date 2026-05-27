'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Activity, List, Settings, PlusCircle, Sparkles, Dumbbell } from 'lucide-react'
import clsx from 'clsx'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Gym', href: '/gym', icon: Dumbbell },
    { name: 'Running', href: '/running', icon: Activity },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Workouts', href: '/workouts', icon: List },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden sm:flex border-b border-slate-100 bg-white/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/running"
              className="font-extrabold text-xl tracking-wider text-slate-900 transition-transform duration-300 hover:scale-102"
            >
              JOS
            </Link>
            <nav className="flex items-center gap-6 ml-6">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2 text-sm font-semibold transition-all hover:text-slate-900',
                      isActive
                        ? 'text-slate-900 font-extrabold'
                        : 'text-slate-400'
                    )}
                  >
                    <Icon className={clsx('w-4 h-4 transition-colors', isActive ? 'text-slate-900' : 'text-slate-400')} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-lg border-t border-slate-100 z-50 pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all',
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-400'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile FAB for Add Workout */}
      <div className="sm:hidden fixed bottom-[calc(76px+env(safe-area-inset-bottom,16px))] right-4 z-50">
        <Link
          href="/workouts/new"
          className="flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-md hover:bg-slate-800 active:scale-95 transition-all duration-300"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>
      </div>
    </>
  )
}

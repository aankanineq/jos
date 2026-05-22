'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Home, List, Settings, PlusCircle } from 'lucide-react'
import clsx from 'clsx'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Workouts', href: '/workouts', icon: List },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden sm:flex border-b border-zinc-800 bg-zinc-950/50 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl tracking-tight text-white">
              Log
            </Link>
            <nav className="flex items-center gap-4 ml-6">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-2 text-sm font-medium transition-colors hover:text-white',
                      isActive ? 'text-white' : 'text-zinc-400'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <Link
            href="/workouts/new"
            className="flex items-center gap-2 text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-full transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Workout
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800 z-50 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center w-full h-full space-y-1',
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile FAB for Add Workout */}
      <div className="sm:hidden fixed bottom-20 right-4 z-50">
        <Link
          href="/workouts/new"
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-colors"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>
      </div>
    </>
  )
}

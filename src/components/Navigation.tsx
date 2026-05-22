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
      <header className="hidden sm:flex border-b border-white/5 bg-slate-950/30 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent hover:scale-102 transition-transform duration-300"
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
                      'flex items-center gap-2 text-sm font-semibold transition-all hover:text-white',
                      isActive
                        ? 'text-white drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                        : 'text-slate-400'
                    )}
                  >
                    <Icon className={clsx('w-4 h-4 transition-colors', isActive ? 'text-orange-400' : 'text-slate-400')} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <Link
            href="/workouts/new"
            className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white px-5 py-2 rounded-xl transition-all duration-300 shadow-[0_2px_12px_rgba(249,115,22,0.3)] hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            기록 추가
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-slate-950/70 backdrop-blur-lg border-t border-white/5 z-50 pb-safe">
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
                  isActive ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.2)]' : 'text-slate-400'
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
      <div className="sm:hidden fixed bottom-20 right-4 z-50">
        <Link
          href="/workouts/new"
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(249,115,22,0.5)] hover:from-orange-400 hover:to-pink-500 active:scale-95 transition-all duration-300"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>
      </div>
    </>
  )
}

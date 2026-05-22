'use client'

import { useState } from 'react'
import { Download, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { format } from 'date-fns'
import { logout } from '@/app/login/actions'

export default function SettingsPage() {
  const currentMonth = format(new Date(), 'yyyy-MM')
  const [exportMonth, setExportMonth] = useState(currentMonth)

  const handleExport = (type: 'json' | 'markdown') => {
    window.location.href = `/api/export/${type}?month=${exportMonth}`
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-24 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-400 mt-1">데이터 관리 및 계정 설정</p>
      </header>

      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <SettingsIcon className="w-5 h-5 text-zinc-400" />
          <h2 className="text-xl font-semibold">데이터 내보내기 (Export)</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            특정 월의 데이터를 JSON 또는 Markdown 형식으로 다운로드합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="space-y-1.5 w-full sm:w-auto">
              <label className="text-xs font-medium text-zinc-500">월 선택</label>
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto sm:mt-5">
              <button
                onClick={() => handleExport('json')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors border border-zinc-700"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('markdown')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors border border-zinc-700"
              >
                <Download className="w-4 h-4" />
                Markdown
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 mt-8">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <LogOut className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-red-400">세션 관리</h2>
        </div>

        <div>
          <form action={logout}>
            <button
              type="submit"
              className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

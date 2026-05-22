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
    <div className="space-y-8 animate-in fade-in pb-24 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-400 mt-1.5 font-medium tracking-wide">데이터 관리 및 계정 관련 설정입니다.</p>
      </header>

      {/* Data Export section */}
      <section className="retro-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <SettingsIcon className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-black text-white tracking-wide">데이터 내보내기 (Export)</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-400 font-medium">
            기록해두신 운동 로그 데이터를 백업할 수 있습니다. 특정 월의 데이터를 가공하여 JSON 또는 Markdown 파일로 다운로드합니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
            <div className="space-y-1.5 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">월 선택</label>
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-semibold"
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto sm:mt-5 shrink-0">
              <button
                onClick={() => handleExport('json')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all border border-white/5 active:scale-97"
              >
                <Download className="w-4 h-4 text-orange-400" />
                JSON
              </button>
              <button
                onClick={() => handleExport('markdown')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 px-5 py-2.5 rounded-xl font-bold transition-all border border-white/5 active:scale-97"
              >
                <Download className="w-4 h-4 text-pink-500" />
                Markdown
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Session Management section */}
      <section className="retro-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <LogOut className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-black text-red-400 tracking-wide">세션 관리</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-400 font-medium">
            현재 로그인되어 있는 Supabase 인증 세션을 종료하고 안전하게 로그아웃합니다.
          </p>
          
          <form action={logout}>
            <button
              type="submit"
              className="bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/20 hover:border-red-500/40 px-6 py-3 rounded-xl font-bold transition-all active:scale-97"
            >
              로그아웃
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

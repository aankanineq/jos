'use client'

import { useState } from 'react'
import { Download, LogOut, Settings as SettingsIcon, Calendar, Activity, Check, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { logout } from '@/app/login/actions'

interface SettingsClientProps {
  uniqueMonths: string[]
}

const WORKOUT_TYPES = [
  { id: 'Pull', label: '💪 풀 (Pull)', color: 'border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/50' },
  { id: 'Push', label: '🔥 푸쉬 (Push)', color: 'border-orange-200 bg-orange-50/80 text-orange-700 hover:bg-orange-100/50' },
  { id: 'Leg', label: '🦵 레그 (Leg)', color: 'border-amber-200 bg-amber-50/80 text-amber-700 hover:bg-amber-100/50' },
  { id: 'Running', label: '🏃 러닝 (Running)', color: 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100/50' },
  { id: 'Tennis', label: '🎾 테니스 (Tennis)', color: 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/50' },
  { id: 'Full', label: '🏋️ 전신 (Full)', color: 'border-purple-200 bg-purple-50/80 text-purple-700 hover:bg-purple-100/50' },
  { id: 'Rest', label: '🛌 휴식 (Rest)', color: 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200/50' },
  { id: 'Other', label: '📝 기타 (Other)', color: 'border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100/50' },
]

export default function SettingsClient({ uniqueMonths }: SettingsClientProps) {
  // Periods state
  const [isAllMonths, setIsAllMonths] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])

  // Workout types state
  const [isAllTypes, setIsAllTypes] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // Convert YYYY-MM to Korean Date (e.g. 2026년 05월)
  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-')
    return `${year}년 ${month}월`
  }

  // Handle Month selection
  const handleToggleMonth = (month: string) => {
    if (isAllMonths) {
      setIsAllMonths(false)
      setSelectedMonths([month])
    } else {
      let updated: string[]
      if (selectedMonths.includes(month)) {
        updated = selectedMonths.filter(m => m !== month)
      } else {
        updated = [...selectedMonths, month]
      }
      
      // If all months are selected manually, or if no months are selected, fall back to "All"
      if (updated.length === uniqueMonths.length || updated.length === 0) {
        setIsAllMonths(true)
        setSelectedMonths([])
      } else {
        setSelectedMonths(updated)
      }
    }
  }

  const handleToggleAllMonths = () => {
    setIsAllMonths(true)
    setSelectedMonths([])
  }

  // Handle Type selection
  const handleToggleType = (typeId: string) => {
    if (isAllTypes) {
      setIsAllTypes(false)
      setSelectedTypes([typeId])
    } else {
      let updated: string[]
      if (selectedTypes.includes(typeId)) {
        updated = selectedTypes.filter(t => t !== typeId)
      } else {
        updated = [...selectedTypes, typeId]
      }
      
      // If all types are selected manually, or if no types are selected, fall back to "All"
      if (updated.length === WORKOUT_TYPES.length || updated.length === 0) {
        setIsAllTypes(true)
        setSelectedTypes([])
      } else {
        setSelectedTypes(updated)
      }
    }
  }

  const handleToggleAllTypes = () => {
    setIsAllTypes(true)
    setSelectedTypes([])
  }

  // Export to Markdown
  const handleExportMarkdown = () => {
    const monthsQuery = isAllMonths ? 'all' : selectedMonths.join(',')
    const typesQuery = isAllTypes ? 'all' : selectedTypes.join(',')
    
    window.location.href = `/api/export/markdown?months=${monthsQuery}&types=${typesQuery}`
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-24 max-w-2xl mx-auto px-4 md:px-0">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <SettingsIcon className="w-9 h-9 text-slate-800" />
          Settings
        </h1>
        <p className="text-slate-500 mt-1.5 font-semibold tracking-wide">데이터 백업 및 계정 관련 설정입니다.</p>
      </header>

      {/* Selective Data Export Section */}
      <section className="retro-card p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Download className="w-6 h-6 text-slate-800" />
          <h2 className="text-xl font-bold text-slate-900 tracking-wide">데이터 마크다운 내보내기 (Export)</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            기록해두신 운동 로그를 Notion이나 Obsidian 등에서 바로 활용할 수 있는 **마크다운 (.md)** 형식으로 백업합니다. 원하는 기간과 운동 종류를 체크해보세요.
          </p>

          {/* 1. Period Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              1. 기간 필터 선택
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {/* All Months Chip */}
              <button
                type="button"
                onClick={handleToggleAllMonths}
                className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
                  isAllMonths
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                }`}
              >
                {isAllMonths && <Check className="w-4 h-4" />}
                전체 기간 (All)
              </button>

              {/* Unique Months */}
              {uniqueMonths.length === 0 ? (
                <div className="text-xs font-semibold text-slate-400 py-2.5">기록된 운동 기간이 없습니다.</div>
              ) : (
                uniqueMonths.map((m) => {
                  const isChecked = !isAllMonths && selectedMonths.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleToggleMonth(m)}
                      className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
                        isChecked
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4" />}
                      {formatMonthLabel(m)}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* 2. Workout Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              2. 운동 종류 필터 선택
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
              {/* All Types Chip */}
              <button
                type="button"
                onClick={handleToggleAllTypes}
                className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
                  isAllTypes
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                }`}
              >
                {isAllTypes && <Check className="w-4 h-4" />}
                전체 운동 (All)
              </button>

              {/* Workout Type Chips */}
              {WORKOUT_TYPES.map((t) => {
                const isChecked = !isAllTypes && selectedTypes.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToggleType(t.id)}
                    className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
                      isChecked
                        ? `${t.color} border-2 shadow-sm scale-102`
                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {isChecked && <Check className="w-4 h-4" />}
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Export Action Trigger */}
          <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs font-bold text-slate-400 space-y-0.5">
              <p>📍 현재 선택 필터 요약</p>
              <p className="text-slate-600">
                기간: {isAllMonths ? '전체' : selectedMonths.map(m => formatMonthLabel(m)).join(', ')} | 운동: {isAllTypes ? '전체' : selectedTypes.map(tId => WORKOUT_TYPES.find(w => w.id === tId)?.label.split(' ')[1] || tId).join(', ')}
              </p>
            </div>
            
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3.5 rounded-2xl font-bold transition-all shadow-sm hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              마크다운 파일 다운로드
            </button>
          </div>
        </div>
      </section>

      {/* Session Management Section */}
      <section className="retro-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold text-slate-900 tracking-wide">세션 관리 (Account)</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-500 font-semibold">
            Supabase 보안 인증 세션을 즉시 파기하고 대시보드와 설정 화면에서 안전하게 로그아웃합니다.
          </p>
          
          <form action={logout} className="pt-2">
            <button
              type="submit"
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 px-6 py-3 rounded-2xl font-bold transition-all active:scale-97 cursor-pointer"
            >
              로그아웃 (Logout)
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

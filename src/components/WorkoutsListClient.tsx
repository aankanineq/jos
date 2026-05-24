'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  PlusCircle, ChevronRight, Dumbbell, Calendar, Activity, 
  Search, Flame, Clock, TrendingUp, X, Sparkles, AlertCircle, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react'
import { WorkoutEntry, WorkoutType } from '@/lib/types'
import WorkoutArtwork from '@/components/WorkoutArtwork'
import { deleteWorkoutsBulkAction } from '@/app/workouts/actions'

interface WorkoutsListClientProps {
  initialWorkouts: WorkoutEntry[]
}

const WORKOUT_TYPES: { id: WorkoutType; label: string; icon: string; color: string; activeColor: string }[] = [
  { id: 'Pull', label: '풀 (Pull)', icon: '✦', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Push', label: '푸쉬 (Push)', icon: '▲', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Leg', label: '레그 (Leg)', icon: '▼', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Shoulder, Arm', label: '어깨팔 (Shoulder, Arm)', icon: '❖', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Full', label: '전신 (Full)', icon: '◆', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Running', label: '러닝 (Running)', icon: '⚡', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Tennis', label: '테니스 (Tennis)', icon: '●', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Rest', label: '휴식 (Rest)', icon: '◌', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
  { id: 'Other', label: '기타 (Other)', icon: '▫', color: 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
]

const TYPE_LABELS: Record<string, string> = {
  all: '전체 운동',
  Pull: '풀 (Pull)',
  Push: '푸쉬 (Push)',
  Leg: '레그 (Leg)',
  Running: '러닝 (Running)',
  Tennis: '테니스 (Tennis)',
  Full: '전신 (Full)',
  Rest: '휴식 (Rest)',
  Other: '기타 (Other)',
  'Shoulder, Arm': '어깨팔 (Shoulder, Arm)'
}

export default function WorkoutsListClient({ initialWorkouts }: WorkoutsListClientProps) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false)
  const [isPeriodFilterOpen, setIsPeriodFilterOpen] = useState(false)

  // Multi-delete states
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  // 1. Extract all unique months in YYYY-MM format from workouts
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>()
    initialWorkouts.forEach((w) => {
      if (w.workout_date) {
        monthsSet.add(w.workout_date.slice(0, 7)) // YYYY-MM
      }
    })
    return Array.from(monthsSet).sort().reverse() // Reverse chronological order
  }, [initialWorkouts])

  // Convert YYYY-MM to Korean Date (e.g. 2026년 05월)
  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-')
    return `${year}년 ${month}월`
  }

  // 2. Filter Workouts based on selection states
  const filteredWorkouts = useMemo(() => {
    return initialWorkouts.filter((w) => {
      if (selectedMonth !== 'all') {
        const month = w.workout_date.slice(0, 7)
        if (month !== selectedMonth) return false
      }

      if (selectedType !== 'all') {
        if (w.type !== selectedType) return false
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchType = w.type.toLowerCase().includes(query)
        const matchNotes = w.notes?.toLowerCase().includes(query) || false
        const matchMarkdown = w.markdown?.toLowerCase().includes(query) || false
        const matchDate = w.workout_date.includes(query)
        if (!matchType && !matchNotes && !matchMarkdown && !matchDate) return false
      }

      return true
    })
  }, [initialWorkouts, selectedMonth, selectedType, searchQuery])

  // 3. Compute dynamic statistics based on currently filtered workouts
  const stats = useMemo(() => {
    const total = filteredWorkouts.length
    const completed = filteredWorkouts.filter(w => w.status === 'completed').length
    const planned = filteredWorkouts.filter(w => w.status === 'planned').length
    
    let runningDistSum = 0
    let runningDurationSumSec = 0
    let runningCount = 0

    filteredWorkouts.forEach((w) => {
      if (w.type === 'Running' && w.status === 'completed') {
        runningCount++
        if (w.running_distance_km) runningDistSum += w.running_distance_km
        if (w.running_duration_sec) runningDurationSumSec += w.running_duration_sec
      }
    })

    let avgPaceStr = ''
    if (runningDistSum > 0 && runningDurationSumSec > 0) {
      const avgPaceSec = runningDurationSumSec / runningDistSum
      const mins = Math.floor(avgPaceSec / 60)
      const secs = Math.floor(avgPaceSec % 60)
      avgPaceStr = `${mins}'${secs.toString().padStart(2, '0')}"/km`
    }

    return {
      total,
      completed,
      planned,
      runningCount,
      runningDistSum: parseFloat(runningDistSum.toFixed(2)),
      runningDurationSumSec,
      avgPaceStr
    }
  }, [filteredWorkouts])

  // Format second duration into readable string (H시간 M분 S초 or M분 S초)
  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60

    if (hrs > 0) {
      return `${hrs}시간 ${mins}분`
    }
    if (mins > 0) {
      return `${mins}분 ${secs}초`
    }
    return `${secs}초`
  }

  const handleClearFilters = () => {
    setSelectedMonth('all')
    setSelectedType('all')
    setSearchQuery('')
  }

  const toggleDeleteSelection = (id: string) => {
    if (selectedDeleteIds.includes(id)) {
      setSelectedDeleteIds(selectedDeleteIds.filter((item) => item !== id))
    } else {
      setSelectedDeleteIds([...selectedDeleteIds, id])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDeleteIds.length === 0) return
    
    const confirmMessage = `선택하신 ${selectedDeleteIds.length}개의 운동 기록을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    if (!window.confirm(confirmMessage)) return

    setDeleting(true)
    try {
      await deleteWorkoutsBulkAction(selectedDeleteIds)
      setSelectedDeleteIds([])
      setIsDeleteMode(false)
      router.refresh()
    } catch (e) {
      alert('일괄 삭제 작업 도중 에러가 발생했습니다.')
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in pb-28 max-w-4xl mx-auto px-4 md:px-0">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase">
            <Dumbbell className="w-3.5 h-3.5 text-slate-800" />
            WORKOUT JOURNAL
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Workouts
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide">
            모든 운동 기록을 편리하게 관리하고 분석해 보세요.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Select & Delete Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsDeleteMode(!isDeleteMode)
              setSelectedDeleteIds([])
            }}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:scale-101 active:scale-99 cursor-pointer text-sm border ${
              isDeleteMode 
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4.5 h-4.5" />
            {isDeleteMode ? '선택 취소' : '기록 선택 삭제'}
          </button>

          {!isDeleteMode && (
            <Link
              href="/workouts/new"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              새 기록 추가
            </Link>
          )}
        </div>
      </header>

      {/* Bulk Delete Bar */}
      {isDeleteMode && selectedDeleteIds.length > 0 && (
        <div className="retro-card p-5 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-350">
          <p className="text-sm font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            선택한 **{selectedDeleteIds.length}개**의 운동 기록을 완전히 삭제하시겠습니까?
          </p>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={() => setSelectedDeleteIds([])}
              className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-100 active:scale-97 cursor-pointer"
            >
              선택 해제
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-xs shadow-sm active:scale-97 cursor-pointer"
            >
              {deleting ? '지우는 중...' : '선택 삭제 실행'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="retro-card p-6 sm:p-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
        
        {/* Row 1: Period Selection */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              기간 선택 (Period)
            </label>
            
            <button
              type="button"
              onClick={() => setIsPeriodFilterOpen(!isPeriodFilterOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-97 shadow-sm"
            >
              <span>현재 선택: <strong>{selectedMonth === 'all' ? '전체 기간' : formatMonthLabel(selectedMonth)}</strong></span>
              {isPeriodFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
 
          {isPeriodFilterOpen && (
            <div className="flex flex-wrap gap-2.5 pr-1 py-1 animate-in fade-in slide-in-from-top-1.5 duration-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth('all')
                  setIsPeriodFilterOpen(false)
                }}
                className={`px-4.5 py-3 rounded-2xl border text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm active:scale-95 ${
                  selectedMonth === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:text-slate-800'
                }`}
              >
                전체 기간
              </button>
              {uniqueMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(m)
                    setIsPeriodFilterOpen(false)
                  }}
                  className={`px-4.5 py-3 rounded-2xl border text-xs font-bold transition-all duration-300 cursor-pointer active:scale-95 ${
                    selectedMonth === m
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:text-slate-800'
                  }`}
                >
                  {formatMonthLabel(m)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: Workout Type Selection */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              운동 종류별 보기 (Workout Type)
            </label>
            
            <button
              type="button"
              onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-97 shadow-sm"
            >
              <span>현재 선택: <strong>{TYPE_LABELS[selectedType] || selectedType}</strong></span>
              {isTypeFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          {isTypeFilterOpen && (
            <div className="flex flex-wrap gap-2.5 pr-1 py-1 animate-in fade-in slide-in-from-top-1.5 duration-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedType('all')
                  setIsTypeFilterOpen(false)
                }}
                className={`px-4.5 py-3 rounded-2xl border text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm active:scale-95 ${
                  selectedType === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:text-slate-800'
                }`}
              >
                전체 운동
              </button>
              {WORKOUT_TYPES.map((t) => {
                const isSelected = selectedType === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(t.id)
                      setIsTypeFilterOpen(false)
                    }}
                    className={`px-4.5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                      isSelected
                        ? `${t.activeColor} border font-black scale-102 shadow-md shadow-slate-100`
                        : `${t.color} border`
                    }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Row 3: Live Search */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="날짜, 메모, 운동 내용 실시간 검색..."
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-11 pr-10 py-3.5 text-sm focus:outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 font-semibold shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-150 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Filter Indicators */}
          {(selectedMonth !== 'all' || selectedType !== 'all' || searchQuery !== '') && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 py-2 px-3 border border-slate-150 rounded-xl bg-slate-50/50 cursor-pointer active:scale-97"
            >
              <X className="w-3.5 h-3.5" />
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        
        {/* Card 1: Total count */}
        <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">필터링된 기록</span>
              <Sparkles className="w-4.5 h-4.5 text-slate-350" />
            </div>
            <p className="text-3xl font-black text-slate-950 mt-2">{stats.total}건</p>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-4">
            완료: {stats.completed}건 | 계획: {stats.planned}건
          </p>
        </div>

        {/* Running Cumulative Stats Cards */}
        {selectedType === 'Running' || (selectedType === 'all' && stats.runningCount > 0) ? (
          <>
            {/* Card 2: Running Cumulative Distance */}
            <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-rose-500">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">러닝 누적 거리</span>
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <p className="text-3xl font-black text-slate-950 mt-2">{stats.runningDistSum} km</p>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-4">
                총 {stats.runningCount}회 러닝 완주
              </p>
            </div>

            {/* Card 3: Running Cumulative Duration */}
            <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-orange-500">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">러닝 누적 시간</span>
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <p className="text-3xl font-black text-slate-950 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {stats.runningDurationSumSec > 0 ? formatDuration(stats.runningDurationSumSec) : '0분'}
                </p>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-4">
                기록 누계 기준
              </p>
            </div>

            {/* Card 4: Average Running Pace */}
            <div className="retro-card p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-emerald-500">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">러닝 평균 페이스</span>
                  <Flame className="w-4.5 h-4.5" />
                </div>
                <p className="text-3xl font-black text-slate-950 mt-2">{stats.avgPaceStr || "N/A"}</p>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-4">
                전체 기록 평균
              </p>
            </div>
          </>
        ) : (
          /* Show simple counts of other types for balance */
          <div className="col-span-3 retro-card p-6 bg-slate-50/40 border border-slate-100 rounded-3xl flex items-center justify-center text-center">
            <div className="space-y-1 max-w-md">
              <p className="text-xs font-bold text-slate-400 tracking-wider">💡 TIP</p>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                운동 종류를 <strong>러닝 (Running)</strong>으로 필터링하시면 누적 거리, 누적 시간, 평균 페이스 등 풍부한 달리기 전용 유산소 데이터 분석 보드를 추가로 제공합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Workouts List */}
      {filteredWorkouts.length === 0 ? (
        <div className="retro-card p-12 text-center flex flex-col items-center justify-center bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <AlertCircle className="w-12 h-12 text-slate-350 mb-4 opacity-40 animate-pulse" />
          <p className="text-slate-600 mb-2 font-extrabold text-lg">일치하는 운동 기록이 없습니다.</p>
          <p className="text-slate-450 text-xs font-semibold mb-6">선택하신 기간이나 종류 필터를 조정하거나, 실시간 검색어를 지워보세요.</p>
          <button
            onClick={handleClearFilters}
            className="inline-flex bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-sm active:scale-97 cursor-pointer text-xs"
          >
            모든 필터 지우기
          </button>
        </div>
      ) : (
        <div className="retro-card overflow-hidden bg-white border border-slate-100/80 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <div className="divide-y divide-slate-100/70 animate-in fade-in duration-250">
            {filteredWorkouts.map((w) => {
              const isSelected = selectedDeleteIds.includes(w.id)
              
              return (
                <Link
                  key={w.id}
                  href={`/workouts/${w.workout_date}`}
                  onClick={(e) => {
                    if (isDeleteMode) {
                      e.preventDefault()
                      toggleDeleteSelection(w.id)
                    }
                  }}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-all duration-300 group gap-4 cursor-pointer ${
                    isDeleteMode 
                      ? isSelected 
                        ? 'bg-rose-50/40 hover:bg-rose-50/60' 
                        : 'hover:bg-slate-50/40'
                      : 'hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Delete Mode Checkbox Container */}
                    {isDeleteMode && (
                      <div className="shrink-0 animate-in slide-in-from-left-2 duration-200">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-5 h-5 text-rose-600 focus:ring-rose-500 border-slate-350 rounded cursor-pointer transition-all"
                        />
                      </div>
                    )}

                    {/* Smartwatch Face Icon */}
                    <WorkoutArtwork type={w.type} status={w.status} size="sm" />
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <h4 className="font-extrabold text-slate-900 text-lg tracking-wide group-hover:text-slate-800 transition-colors">
                          {w.type}
                        </h4>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wider ${
                          w.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border border-slate-200 font-extrabold'
                        }`}>
                          {w.status === 'completed' ? '완료' : '계획'}
                        </span>
                      </div>

                      {w.type === 'Running' && w.running_distance_km ? (
                        <p className="text-sm font-bold text-slate-500 leading-normal">
                          {w.running_distance_km}km
                          {w.running_duration_sec && (() => {
                            const h = Math.floor(w.running_duration_sec / 3600)
                            const m = Math.floor((w.running_duration_sec % 3600) / 60).toString().padStart(2, '0')
                            const s = (w.running_duration_sec % 60).toString().padStart(2, '0')
                            return ` • ${h}:${m}:${s}`
                          })()}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500 line-clamp-1 max-w-md font-bold leading-normal">
                          {w.markdown ? w.markdown.split('\n')[0].replace(/^#+\s/, '') : '상세 기록 없음'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 sm:w-auto w-full pl-16 sm:pl-0">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-800">
                        {format(new Date(w.workout_date), 'MM월 dd일')}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5 uppercase">
                        {format(new Date(w.workout_date), 'EEEE')}
                      </p>
                    </div>
                    {isDeleteMode ? (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          isSelected ? 'bg-rose-500 border-rose-600 scale-110 shadow-sm' : 'border-slate-350 bg-white'
                        }`} />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-650 transition-all hover:scale-102" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

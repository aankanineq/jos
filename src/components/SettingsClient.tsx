'use client'

import { useState, useRef } from 'react'
import { 
  Download, LogOut, Settings as SettingsIcon, Calendar, Activity, 
  Check, ShieldAlert, Upload, FileText, CheckCircle, AlertCircle, 
  Loader2, ChevronDown, ChevronUp 
} from 'lucide-react'
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
  // --- Export States ---
  const [isAllMonths, setIsAllMonths] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [isAllTypes, setIsAllTypes] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // --- Import States ---
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file')
  const [pasteText, setPasteText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    totalParsed: number
    upsertedCount: number
    errors: string[]
  } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert YYYY-MM to Korean Date (e.g. 2026년 05월)
  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-')
    return `${year}년 ${month}월`
  }

  // --- Export Handlers ---
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

  const handleExportMarkdown = () => {
    const monthsQuery = isAllMonths ? 'all' : selectedMonths.join(',')
    const typesQuery = isAllTypes ? 'all' : selectedTypes.join(',')
    window.location.href = `/api/export/markdown?months=${monthsQuery}&types=${typesQuery}`
  }

  // --- Import Handlers ---
  const executeImport = async (text: string) => {
    if (!text.trim()) {
      alert('가져올 마크다운 내용이 비어있습니다.')
      return
    }
    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/import/markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown: text }),
      })

      const data = await res.json()
      
      setImportResult({
        success: data.success ?? false,
        totalParsed: data.totalParsed ?? 0,
        upsertedCount: data.upsertedCount ?? 0,
        errors: data.errors ?? [],
      })
      
      if (data.success && data.upsertedCount > 0) {
        // Clear pasted text on successful import
        setPasteText('')
      }
    } catch (e) {
      setImportResult({
        success: false,
        totalParsed: 0,
        upsertedCount: 0,
        errors: ['서버와 통신하는 중 시스템 네트워크 오류가 발생했습니다.'],
      })
    } finally {
      setImporting(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      alert('마크다운 파일(.md) 또는 텍스트 파일(.txt)만 업로드할 수 있습니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        await executeImport(text)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-24 max-w-2xl mx-auto px-4 md:px-0">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <SettingsIcon className="w-9 h-9 text-slate-800" />
          Settings
        </h1>
        <p className="text-slate-500 mt-1.5 font-semibold tracking-wide">데이터 관리 및 계정 관련 설정입니다.</p>
      </header>

      {/* 1. Selective Data Export Section */}
      <section className="retro-card p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Download className="w-6 h-6 text-slate-800" />
          <h2 className="text-xl font-bold text-slate-900 tracking-wide">데이터 마크다운 내보내기 (Export)</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            기록해두신 운동 로그를 Notion이나 Obsidian 등에서 바로 활용할 수 있는 **마크다운 (.md)** 형식으로 백업합니다. 원하는 기간과 운동 종류를 체크해보세요.
          </p>

          {/* Period Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              1. 기간 필터 선택
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
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

          {/* Workout Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              2. 운동 종류 필터 선택
            </h3>
            
            <div className="flex flex-wrap gap-2.5">
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

          {/* Export Action trigger */}
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

      {/* 2. Selective Data Import Section [NEW] */}
      <section className="retro-card p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Upload className="w-6 h-6 text-slate-800" />
          <h2 className="text-xl font-bold text-slate-900 tracking-wide">데이터 가져오기 (Import)</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            백업해두었거나 수동으로 작성한 마크다운 파일(`.md`) 또는 텍스트를 불러와 운동 기록을 복원합니다. 동일한 날짜와 운동 종류가 이미 존재하면 새 내용으로 안전하게 **덮어쓰기(Upsert)**합니다.
          </p>

          {/* Import Tabs */}
          <div className="flex border-b border-slate-100 gap-6">
            <button
              type="button"
              onClick={() => { setImportTab('file'); setImportResult(null); }}
              className={`pb-2.5 text-sm font-extrabold tracking-wide transition-all border-b-2 cursor-pointer ${
                importTab === 'file'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              파일 업로드 (.md)
            </button>
            <button
              type="button"
              onClick={() => { setImportTab('paste'); setImportResult(null); }}
              className={`pb-2.5 text-sm font-extrabold tracking-wide transition-all border-b-2 cursor-pointer ${
                importTab === 'paste'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              텍스트 붙여넣기
            </button>
          </div>

          {/* Tab 1: Drag & Drop File Upload Area */}
          {importTab === 'file' && (
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".md,.txt" 
                className="hidden" 
              />
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 gap-3 group text-center min-h-[180px] ${
                  dragActive
                    ? 'border-slate-800 bg-slate-50 scale-99'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    여기에 마크다운 백업 파일을 끌어다 놓으세요
                  </p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    또는 마우스로 클릭하여 내 컴퓨터에서 파일 찾기 (.md, .txt)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Text Area */}
          {importTab === 'paste' && (
            <div className="space-y-4">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="---&#10;## 2026-05-21 Running&#10;status: completed&#10;running_distance_km: 6.0&#10;duration: 0:36:00&#10;&#10;여기에 운동 일지 본문 마크다운 내용을 붙여넣으세요...&#10;---"
                className="w-full min-h-[220px] bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-2xl p-4 font-mono text-sm focus:outline-none transition-all placeholder:text-slate-300"
              />
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => executeImport(pasteText)}
                  disabled={importing || !pasteText.trim()}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      가져오는 중...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      기록 가져오기 실행
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator for File Upload */}
          {importing && importTab === 'file' && (
            <div className="flex items-center justify-center gap-2 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 font-bold text-sm animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
              파일 분석 및 데이터 복원 진행 중...
            </div>
          )}

          {/* Import Result Notification Banners */}
          {importResult && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {importResult.upsertedCount > 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-800 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm">성공적으로 복원되었습니다!</h4>
                    <p className="text-xs font-semibold text-emerald-700 leading-relaxed">
                      총 {importResult.totalParsed}개의 운동 정보 중 **{importResult.upsertedCount}개**의 기록이 캘린더 데이터베이스에 안전하게 복원 및 동기화(Upsert)되었습니다.
                    </p>
                  </div>
                </div>
              ) : (
                !importing && importResult.errors.length === 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-slate-500" />
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm">가져올 신규 기록이 없습니다.</h4>
                      <p className="text-xs font-semibold text-slate-500">
                        파일 형식이 알맞게 맞추어져 있는지 아래 양식 가이드를 다시 확인해 보세요.
                      </p>
                    </div>
                  </div>
                )
              )}

              {importResult.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
                  <div className="space-y-1.5 w-full">
                    <h4 className="font-extrabold text-sm">일부 데이터를 가져오지 못했습니다.</h4>
                    <p className="text-xs font-semibold text-rose-700">
                      파싱 또는 데이터 벨리데이션 검사 중 오류가 발견되었습니다. 다음 {importResult.errors.length}건은 무시되었습니다:
                    </p>
                    <div className="bg-white/80 border border-rose-100 rounded-xl p-3 text-[11px] font-mono leading-relaxed space-y-1 max-h-[140px] overflow-y-auto w-full text-rose-800">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx}>⚠️ {err}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Help / Formatting Rules Accordion */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/40">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full px-4 py-3 flex.items-center justify-between flex items-center font-bold text-xs text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                💡 마크다운 가져오기(Import) 약속 양식 보기
              </span>
              {showHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHelp && (
              <div className="px-4 pb-4.pt-1 border-t border-slate-100 space-y-3.5 text-xs text-slate-500 font-semibold leading-relaxed p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                <p>
                  가져올 마크다운 백업은 반드시 아래 규격을 엄격히 지켜야 파싱 엔진이 해석할 수 있습니다:
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 font-mono text-[10.5px] leading-relaxed text-slate-700 whitespace-pre">
{`## 2026-05-21 Running
status: completed
running_distance_km: 6.0
duration: 0:36:00

오늘 야외 6km 러닝! 기분 좋게 마무리했습니다.

---

## 2026-05-22 Pull
status: completed

턱걸이 10회 5세트 진행 완료.`}
                </div>
                <div className="space-y-1 text-slate-400">
                  <p>✔ **헤더 형식**: `## YYYY-MM-DD 운동명` 형식으로 시작해야 합니다.</p>
                  <p>✔ **지원 운동명**: `Pull(풀)`, `Push(푸쉬)`, `Leg(레그)`, `Running(러닝)`, `Tennis(테니스)`, `Full(전신)`, `Rest(휴식)`, `Other(기타)`</p>
                  <p>✔ **속성값들**: 헤더 바로 아랫줄에 `key: value` 형태로 기입합니다.</p>
                  <p>✔ **구분선**: 개별 운동 구분선(`---`)은 필수는 아니나, 여러 개를 연속해서 기입할 때는 가독성을 위해 사용하는 것이 좋습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Session Management Section */}
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

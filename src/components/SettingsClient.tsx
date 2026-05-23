'use client'

import { useState, useRef } from 'react'
import { 
  Download, LogOut, Settings as SettingsIcon, Calendar, Activity, 
  Check, ShieldAlert, Upload, FileText, CheckCircle, AlertCircle, 
  Loader2, ChevronDown, ChevronUp, Copy 
} from 'lucide-react'
import { format } from 'date-fns'
import { logout } from '@/app/login/actions'

const FULL_IMPORT_TEMPLATE = `# JOS 마크다운 가져오기 최종 규격 및 예시 (JOS v1 Spec)

본 예시 파일은 JOS(Journey of Strength) 운동로그 백업 최종 스펙을 완벽히 충족하는 통합 문서입니다.
우측 상단의 "전체 예시 복사" 버튼을 눌러 가져오기 입력창에 붙여넣으면 유효성 검증 테스트를 즉시 수행할 수 있습니다.
(※ 첫 설명 영역은 규격 헤더가 없으므로 '저장 불가' 처리가 되며, 아래의 10개 실제 운동 기록 블록은 전부 '저장 가능'으로 정상 분석됩니다.)

📌 [최종 검증 규칙 요약]
1. 헤더 규격: ## YYYY-MM-DD WorkoutType (영어 전용, 대괄호/이모지/한글 금지)
   - 지원 운동종류: Running, Pull, Push, Leg, Full, Tennis, Rest, Other
2. 진행 상태: status: planned 또는 status: completed 만 허용 (자동 치환 및 보정 없음)
3. 상세 기록(메모) 필수 규칙:
   - 근력 운동군(Pull/Push/Leg/Full) 완료(completed) 기록은 'memo: ...' 메타데이터 기입 필수
   - 모든 상세 기록은 본문 텍스트가 아닌 'memo: ...' 속성에 작성해야 함 (자유 본문 기입 시 invalid)
4. 수치 제약:
   - Running completed: 거리(running_distance_km) 및 시간(duration: H:MM:SS) 필수
   - Running planned: 거리 및 시간 선택
   - 비-러닝 운동: 러닝 거리/시간/페이스 기입 시 에러 (강도 intensity 속성은 삭제됨)
5. 페이스(pace): 직접 입력이 불가하며 거리와 시간이 모두 있을 시 자동으로 산출
6. 가져오기 방식: 기존 데이터를 덮어쓰지 않고 항상 새로운 행으로 추가(Insert)

---

## 2026-05-21 Running
status: completed
running_distance_km: 6.0
duration: 0:36:00
memo: 야외 6km 러닝. 호흡 편하게 진행 완료.

---

## 2026-05-21 Running
status: planned
running_distance_km: 5.0
memo: 5km 회복 이지런 예정.

---

## 2026-05-22 Pull
status: completed
memo: 턱걸이 10회 5세트, 시티드로우 50kg 12회 3세트 완료.

---

## 2026-05-22 Pull
status: planned
memo: 등 운동 루틴 (턱걸이, 시티드로우) 예정.

---

## 2026-05-23 Push
status: completed
memo: 벤치프레스 60kg 10회 5세트 완료.

---

## 2026-05-24 Leg
status: completed
memo: 스쿼트 80kg 8회 5세트 완료.

---

## 2026-05-25 Full
status: completed
memo: 데드리프트 100kg 5회 5세트 완료.

---

## 2026-05-26 Tennis
status: completed
memo: 코치님과 랠리 연습 1시간 완료.

---

## 2026-05-27 Rest
status: completed
memo: 근육통 회복을 위한 스트레칭 및 휴식.

---

## 2026-05-28 Other
status: completed
memo: 실내 자전거 40분 완료.`

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
  const [importTab, setImportTab] = useState<'file' | 'paste'>('paste')
  const [pasteText, setPasteText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // --- Preview & Commit States ---
  const [previewStats, setPreviewStats] = useState<{
    totalCount: number
    validCount: number
    warningCount: number
    invalidCount: number
  } | null>(null)
  const [previewBlocks, setPreviewBlocks] = useState<any[] | null>(null)
  const [selectedBlockIndexes, setSelectedBlockIndexes] = useState<number[]>([])
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitSuccessCount, setCommitSuccessCount] = useState<number | null>(null)
  const [commitError, setCommitError] = useState<string[] | null>(null)

  const [showHelp, setShowHelp] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(FULL_IMPORT_TEMPLATE)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }
  
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
    setPreviewStats(null)
    setPreviewBlocks(null)
    setSelectedBlockIndexes([])
    setCommitSuccessCount(null)
    setCommitError(null)

    try {
      const res = await fetch('/api/import/markdown/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown: text }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setPreviewStats(data.stats)
        setPreviewBlocks(data.blocks)
        
        // Auto-select valid and warning blocks by default
        const initialSelected = data.blocks
          .filter((b: any) => b.type === 'valid' || b.type === 'warning')
          .map((b: any) => b.blockIndex)
        setSelectedBlockIndexes(initialSelected)
      } else {
        alert(data.message || '마크다운 분석 도중 오류가 발생했습니다.')
      }
    } catch (e) {
      alert('서버와 통신하는 중 네트워크 오류가 발생했습니다.')
    } finally {
      setImporting(false)
    }
  }

  const handleCommit = async () => {
    if (!previewBlocks) return

    const workoutsToSave = previewBlocks
      .filter(b => selectedBlockIndexes.includes(b.blockIndex))
      .map(b => b.workout)

    if (workoutsToSave.length === 0) {
      alert('저장할 운동 기록이 선택되지 않았습니다.')
      return
    }

    setIsCommitting(true)
    setCommitError(null)
    setCommitSuccessCount(null)

    try {
      const res = await fetch('/api/import/markdown/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workouts: workoutsToSave }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setCommitSuccessCount(data.count)
        // Clear preview states on successful storage
        setPreviewStats(null)
        setPreviewBlocks(null)
        setSelectedBlockIndexes([])
        setPasteText('')
      } else {
        setCommitError(data.errors || [data.message || '데이터베이스 저장 중 오류가 발생했습니다.'])
      }
    } catch (e) {
      setCommitError(['저장 처리하는 중 네트워크 오류가 발생했습니다.'])
    } finally {
      setIsCommitting(false)
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
            백업해두었거나 수동으로 작성한 마크다운 파일(`.md`) 또는 텍스트를 불러와 운동 기록을 복원합니다. 동일한 날짜와 운동 종류의 기록이 이미 존재하더라도 덮어쓰지 않고 <strong>신규 기록으로 각각 안전하게 추가(Insert)</strong>됩니다.
          </p>

          {/* Import Tabs */}
          <div className="flex border-b border-slate-100 gap-6">
            <button
              type="button"
              onClick={() => { 
                setImportTab('file'); 
                setPreviewStats(null);
                setPreviewBlocks(null);
                setSelectedBlockIndexes([]);
                setCommitSuccessCount(null);
                setCommitError(null);
              }}
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
              onClick={() => { 
                setImportTab('paste'); 
                setPreviewStats(null);
                setPreviewBlocks(null);
                setSelectedBlockIndexes([]);
                setCommitSuccessCount(null);
                setCommitError(null);
              }}
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
                placeholder="---&#10;## 2026-05-21 Running&#10;status: completed&#10;running_distance_km: 6.0&#10;duration: 0:36:00&#10;memo: 오늘 야외 6km 러닝! 기분 좋게 마무리했습니다.&#10;---"
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
              파일 분석 및 데이터 프리뷰 생성 중...
            </div>
          )}

          {/* Commit Success Notification Banner */}
          {commitSuccessCount !== null && (
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-900 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-6 h-6 mt-0.5 shrink-0 text-emerald-600" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-base">🎉 데이터 저장 성공!</h4>
                <p className="text-sm font-semibold text-emerald-700 leading-relaxed">
                  선택하신 **총 {commitSuccessCount}개**의 운동 기록이 JOS 데이터베이스에 성공적으로 추가(Insert)되었습니다. 캘린더에서 바로 확인할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Commit Errors Notification Banner */}
          {commitError && commitError.length > 0 && (
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 text-rose-900 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-6 h-6 mt-0.5 shrink-0 text-rose-600" />
              <div className="space-y-2 w-full">
                <h4 className="font-extrabold text-base">⚠️ 데이터 저장 실패</h4>
                <p className="text-sm font-semibold text-rose-700">
                  최종 저장 도중 다음과 같은 유효성 검사 에러가 발생하여 처리가 차단되었습니다:
                </p>
                <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 text-xs font-mono leading-relaxed space-y-1.5 max-h-[150px] overflow-y-auto w-full text-rose-800">
                  {commitError.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Import Preview Dashboard */}
          {previewBlocks && previewStats && (
            <div className="space-y-6 bg-slate-50/50 border border-slate-100 rounded-3xl p-5 sm:p-6 animate-in fade-in duration-300">
              {/* Summary Stats Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    🔎 마크다운 가져오기 프리뷰 (Preview)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 font-extrabold rounded-full uppercase">
                    JOS v1 SPEC
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  가져온 마크다운 파일 내의 운동 블록별 상태 분석 결과입니다. <strong>Valid(정상)</strong> 및 체크된 <strong>Warning(경고)</strong> 블록만 데이터베이스에 신규 추가(Insert)됩니다.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2.5 pt-2 text-center">
                  <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">총 블록</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{previewStats.totalCount}</p>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">저장 가능</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">{previewStats.validCount}</p>
                  </div>
                  <div className="p-3 bg-white border border-amber-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">경고 있음</p>
                    <p className="text-xl font-black text-amber-600 mt-1">{previewStats.warningCount}</p>
                  </div>
                  <div className="p-3 bg-white border border-rose-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">저장 불가</p>
                    <p className="text-xl font-black text-rose-600 mt-1">{previewStats.invalidCount}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Preview Blocks List */}
              <div className="max-h-[360px] overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-white/60 space-y-3.5 divide-y divide-slate-100/50">
                {previewBlocks.map((b) => {
                  const isValid = b.type === 'valid'
                  const isWarning = b.type === 'warning'
                  const isInvalid = b.type === 'invalid'
                  
                  const isChecked = selectedBlockIndexes.includes(b.blockIndex)

                  return (
                    <div 
                      key={b.blockIndex} 
                      className={`pt-3.5 first:pt-0 flex flex-col gap-3 rounded-2xl p-3 border-l-4 transition-all ${
                        isValid ? 'border-l-emerald-500 bg-emerald-50/10 border border-slate-100' :
                        isWarning ? 'border-l-amber-500 bg-amber-50/10 border border-slate-100' :
                        'border-l-rose-500 bg-rose-50/10 border border-slate-100'
                      }`}
                    >
                      {/* Block Header Area */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-slate-800 tracking-wide font-mono">
                            {b.workout ? `## ${b.workout.workout_date} ${b.workout.type}` : `## 라인 ${b.lineNum} 블록`}
                          </h4>
                          {b.workout && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                b.workout.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {b.workout.status}
                              </span>
                              {b.workout.running_distance_km && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold font-mono">
                                  🏃 {b.workout.running_distance_km}km
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Controls (Checkbox for Valid/Warning, cross for Invalid) */}
                        <div className="shrink-0 pt-0.5">
                          {isInvalid ? (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-100/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> 저장 불가
                            </span>
                          ) : (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBlockIndexes([...selectedBlockIndexes, b.blockIndex])
                                  } else {
                                    setSelectedBlockIndexes(selectedBlockIndexes.filter(idx => idx !== b.blockIndex))
                                  }
                                }}
                                className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded cursor-pointer"
                              />
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                isChecked 
                                  ? isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {isChecked ? '저장 예정' : '저장 안 함'}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Errors and Warnings lists */}
                      {b.errors.length > 0 && (
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-[11px] font-semibold text-rose-700 space-y-1">
                          {b.errors.map((err: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="shrink-0 mt-0.5 text-rose-600">❌</span>
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {b.warnings.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px] font-semibold text-amber-700 space-y-1">
                          {b.warnings.map((warn: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="shrink-0 mt-0.5 text-amber-600">⚠️</span>
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Workout markdown snippet preview */}
                      {b.workout && b.workout.markdown && (
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs leading-relaxed font-semibold text-slate-500 whitespace-pre-wrap max-h-[80px] overflow-y-auto font-mono">
                          {b.workout.markdown}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Commit Action controls */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs font-bold text-slate-400 leading-normal">
                  📍 선택 요약: 저장 대상 **총 {selectedBlockIndexes.length}건**의 운동 기록
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewBlocks(null);
                      setPreviewStats(null);
                      setSelectedBlockIndexes([]);
                    }}
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={isCommitting || selectedBlockIndexes.length === 0}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed text-sm"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        데이터베이스 저장 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4.h-4" />
                        데이터베이스 최종 저장
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Form Help / Formatting Rules Accordion */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/40">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full px-4 py-3 justify-between flex items-center font-bold text-xs text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                💡 마크다운 가져오기(Import) 약속 양식 보기
              </span>
              {showHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHelp && (
              <div className="px-4 pb-4 pt-4 border-t border-slate-100 space-y-4 text-xs text-slate-500 font-semibold leading-relaxed p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-sm">
                    📋 통합 백업 데이터 구성 예시
                  </p>
                  <p className="text-[11px] text-slate-400">
                    아래는 8종 운동 전체의 계획/완료 양식이 포함된 전체 백업 파일 내용입니다. 오른쪽의 <strong>전체 예시 복사</strong> 버튼을 누르면 한 번에 클립보드로 복사됩니다!
                  </p>
                </div>

                {/* Unified Code Preview Block with Copy Button */}
                <div className="relative border border-slate-200 rounded-3xl bg-slate-900 overflow-hidden shadow-md">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      FULL WORKOUT BACKUP EXAMPLE (JOS v1 Spec)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTemplate}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border cursor-pointer active:scale-97 ${
                        copied
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          복사 완료!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          전체 예시 복사
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-y-auto text-[11px] leading-relaxed text-slate-200 font-mono select-all bg-slate-900/90 whitespace-pre max-h-[300px]">
                    {FULL_IMPORT_TEMPLATE}
                  </pre>
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

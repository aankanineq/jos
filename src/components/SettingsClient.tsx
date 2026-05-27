'use client'

import { useState } from 'react'
import { 
  Download, Settings as SettingsIcon, Calendar, Activity, 
  Check, Upload, FileText, CheckCircle, AlertCircle, 
  Loader2, ChevronDown, ChevronUp, Copy 
} from 'lucide-react'
import { format } from 'date-fns'
import { logout } from '@/app/login/actions'

const FULL_IMPORT_TEMPLATE = `# [JOS 마크다운 백업 가져오기 가이드 & 최종 검증 스펙 (JOS v1 Spec)]

본 예시 파일은 JOS(Journey of Strength) 운동로그 백업 최종 스펙을 완벽하게 만족하는 통합 문서입니다.
우측 상단의 "전체 예시 복사" 버튼을 누른 뒤 가져오기 입력창에 붙여넣으면 즉시 유효성 분석 테스트를 수행할 수 있습니다.
(※ 첫 설명 영역은 규격 헤더가 없으므로 '저장 불가' 처리가 되며, 아래의 10개 실제 운동 기록 블록은 전부 '저장 가능'으로 정상 분석됩니다.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ [예외 방지용 정밀 검증 규칙 & 작성 약속 - 필독!]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 헤더 규격 (Header Standards)
   • 정식 정규식 포맷: ## YYYY-MM-DD WorkoutType
   • 허용되는 날짜: 반드시 '년(4자리)-월(2자리)-일(2자리)' 형태를 유지해야 합니다. (예: 2026-05-21)
   • 허용되는 운동 종류 (WorkoutType - 영어 대소문자 정확히 일치):
      - Running (러닝)
      - Pull (풀 - 등/이두)
      - Push (푸쉬 - 가슴/삼두)
      - Leg (레그 - 하체)
      - Full (전신)
      - Tennis (테니스)
      - Rest (휴식)
      - Other (기타)
   • 🚨 절대 허용하지 않는 예외 대상 (Invalid Header Cases):
     - 대괄호나 특수 기호가 날짜에 붙는 경우 (예: ## [2026-05-21] Running ❌)
     - 한글 운동 종류명이 섞인 경우 (예: ## 2026-05-21 러닝 ❌)
     - 이모지나 아이콘이 붙는 경우 (예: ## 🗓️ 2026-05-21 Rest ❌)
     - 축약어를 사용한 경우 (예: ## 2026-05-21 Run ❌)

2️⃣ 진행 상태 (Workout Status Constraints)
   • status 키에는 오직 아래의 두 단어만 입력할 수 있습니다:
     - status: completed (운동 완료됨)
     - status: planned (운동 예정됨 / 계획)
   • 🚨 절대 허용하지 않는 예외 대상:
     - complete (completed가 아닌 축약어 기입 시 invalid ❌)
     - skipped / done / active / cancelled 등 정의되지 않은 임의 단어 ❌
     - JOS v1 엔진은 오타나 유사 단어의 자동 보정(Auto-correction)을 지원하지 않고 차단합니다.

3️⃣ 상세 기록 기입 규칙 (Memo & Markdown Rules)
   • 상세한 운동 일지 및 수행 내역은 반드시 'memo: ...' 메타데이터 키를 사용하여 한 줄로 정교하게 작성해야 합니다.
   • JOS v1 Spec은 메타데이터 블록 아래 빈 줄 뒤의 자유 형식 본문 기입을 지원하지 않습니다.
   • 🚨 근력 운동군 필수 규칙:
      - Pull, Push, Leg, Full 종류의 completed(완료됨) 운동은 'memo' 필드가 필수입니다.
      - memo 속성이 누락되거나 내용이 공백인 경우 invalid 오류가 발생합니다.
      - planned(예정됨)일 때는 memo 필드가 선택사항입니다.
    • 🚨 기타 운동군 규칙:
      - Running, Tennis, Rest, Other 종류는 status에 상관없이 memo가 항상 선택사항입니다.

4️⃣ 수치 데이터 및 비-러닝 운동 제약 규칙 (Numerical Field & Non-Running Protections)
   • 거리(Distance)와 시간(Duration)은 오직 Running(러닝) 운동 종류에만 입력 가능합니다.
   • 🚨 러닝 완료(Running + completed) 표준 규격 및 필수 요건:
     - 반드시 아래와 같은 포맷 구조와 데이터 형식을 준수해야 오차 없는 정밀 분석이 가능합니다:

       ## YYYY-MM-DD Running
       status: completed
       running_distance_km: 숫자
       duration: H:MM:SS
       memo: 기준앱: Nike / 유형: 이지런 / 위치: 한강공원 ...

     - running_distance_km: 0보다 큰 숫자 형태여야 합니다 (소수점 지원).
     - duration: 시간(Hour), 분(Minute), 초(Second)가 콜론으로 구분된 'H:MM:SS' 규격을 엄격히 지켜야 합니다.
     - memo: 슬래시(/)를 구분 기호로 기입하여 모든 디테일 정보를 누락 없이 한 줄로 보존할 수 있습니다.
   • 🚨 러닝 계획(Running + planned) 요건:
     - running_distance_km 및 duration 속성은 자유로운 선택 사항입니다.
   • 🚨 러닝 이외 운동군(비-러닝 운동) 엄격 보호:
      - Pull, Push, Leg, Full, Tennis, Rest, Other 세션에는 거리(running_distance_km), 시간(duration), 페이스 필드를 절대 입력할 수 없습니다.
     - 기입 시 유효성 검사에서 invalid 오류가 발생합니다.
     - 강도(running_intensity) 필드는 시스템 전체에서 전면 소거되어, 기입 시 무시 혹은 invalid 처리됩니다.

5️⃣ 페이스(Pace) 자동 연산 규칙
   • 마크다운 백업 양식에 페이스를 뜻하는 'running_pace_sec_per_km' 필드는 직접 입력이 절대 불가능합니다.
   • direct pace 기입 시 invalid로 거절되며, 거리와 시간이 입력되면 백엔드 엔진이 초 단위 페이스를 정밀하게 자동 계산 및 DB 바인딩을 전담합니다.

6️⃣ 가져오기 처리 방식 (Transaction Import Policies)
   • 가져오기(Import)는 기존 데이터를 덮어쓰거나 갱신하지 않고, 복사된 모든 블록을 데이터베이스에 항상 신규 추가(Insert)합니다.
   • 동일 날짜에 같은 운동 종류가 여러 개 존재하더라도 정상적으로 여러 개의 캡슐로 보존됩니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 아래 템플릿 전체를 복사하여 테스트해보세요. (설명 영역은 헤더 미준수 'invalid'로 감지되며 실전 데이터는 전부 'valid'로 판정됩니다.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 2026-05-21 Running
status: completed
running_distance_km: 6.0
duration: 0:36:00
memo: 기준앱: Nike / 유형: 이지런 / 위치: 한강공원 / 평균 페이스: 6'00" / 칼로리: 420kcal / 고도 상승: 15m / 평균 심박수: 145bpm / 케이던스: 172spm / 신발: 페가수스 40 / 구간: 1km 6'12", 2km 6'05", 3km 5'58", 4km 6'01", 5km 5'55", 6km 5'49" / 해석: 전반적으로 호흡이 매우 편안했고 중후반 빌드업이 매끄럽게 진행됨.

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
memo: 실내 자전거 40분 완료.

---`

interface SettingsClientProps {
  uniqueMonths: string[]
}

const WORKOUT_TYPES = [
  { id: 'Pull', label: '💪 풀 (Pull)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
  { id: 'Push', label: '🔥 푸쉬 (Push)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
  { id: 'Leg', label: '🦵 레그 (Leg)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },

  { id: 'Full', label: '🏋️ 전신 (Full)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
  { id: 'Running', label: '🏃 러닝 (Running)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
  { id: 'Tennis', label: '🎾 테니스 (Tennis)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
  { id: 'Rest', label: '🛌 휴식 (Rest)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
  { id: 'Other', label: '📝 기타 (Other)', color: 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50' },
]

export default function SettingsClient({ uniqueMonths }: SettingsClientProps) {
  // --- Export States ---
  const [isAllMonths, setIsAllMonths] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [isAllTypes, setIsAllTypes] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [isPeriodExportOpen, setIsPeriodExportOpen] = useState(false)
  const [isTypeExportOpen, setIsTypeExportOpen] = useState(false)

  // --- Import States ---
  const [pasteText, setPasteText] = useState('')
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

  return (
    <div className="space-y-10 animate-in fade-in pb-28 max-w-2xl mx-auto px-4 md:px-0">
      
      {/* Header */}
      <header className="mb-8 space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase">
          <SettingsIcon className="w-3.5 h-3.5 text-slate-800" />
          SYSTEM SETTINGS
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
          Settings
        </h1>
        <p className="text-slate-500 font-semibold tracking-wide">데이터 백업 관리 및 계정 관련 설정입니다.</p>
      </header>

      {/* 1. Selective Data Import Section */}
      <section className="retro-card p-6 sm:p-8 space-y-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="p-2 rounded-2xl bg-slate-50 border border-slate-100 text-slate-850 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">데이터 가져오기 (Import)</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            백업해두었거나 수동으로 작성한 마크다운 파일(`.md`) 또는 텍스트를 불러와 운동 기록을 복원합니다. 동일한 날짜와 운동 종류의 기록이 이미 존재하더라도 덮어쓰지 않고 <strong>신규 기록으로 각각 안전하게 추가(Insert)</strong>됩니다.
          </p>

          {/* Paste Text Area */}
          <div className="space-y-4">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="---&#10;## 2026-05-21 Running&#10;status: completed&#10;running_distance_km: 6.0&#10;duration: 0:36:00&#10;memo: 오늘 야외 6km 러닝! 기분 좋게 마무리했습니다.&#10;---"
              className="w-full min-h-[220px] bg-slate-50/50 border border-slate-200/80 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 rounded-2xl p-4 font-mono text-sm focus:outline-none transition-all placeholder:text-slate-350 shadow-inner leading-relaxed"
            />
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => executeImport(pasteText)}
                disabled={importing || !pasteText.trim()}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-450 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    분석 분석 중...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    기록 가져오기 실행
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Commit Success Notification Banner */}
          {commitSuccessCount !== null && (
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-950 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-black text-base">🎉 데이터 저장 성공!</h4>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700 leading-relaxed">
                  선택하신 **총 {commitSuccessCount}개**의 운동 기록이 JOS 데이터베이스에 성공적으로 추가(Insert)되었습니다. 캘린더에서 바로 확인할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Commit Errors Notification Banner */}
          {commitError && commitError.length > 0 && (
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 text-rose-950 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-2 w-full">
                <h4 className="font-black text-base">⚠️ 데이터 저장 실패</h4>
                <p className="text-xs sm:text-sm font-semibold text-rose-700">
                  최종 저장 도중 다음과 같은 유효성 검사 에러가 발생하여 처리가 차단되었습니다:
                </p>
                <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 text-xs font-mono leading-relaxed space-y-1.5 max-h-[150px] overflow-y-auto w-full text-rose-800 font-semibold shadow-inner">
                  {commitError.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Import Preview Dashboard */}
          {previewBlocks && previewStats && (
            <div className="space-y-6 bg-slate-50/30 border border-slate-100/80 rounded-3xl p-5 sm:p-7 animate-in fade-in duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    🔎 마크다운 가져오기 프리뷰 (Preview)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 font-extrabold rounded-full uppercase tracking-wider">
                    JOS v1 SPEC
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-450 leading-relaxed">
                  가져온 마크다운 파일 내의 운동 블록별 상태 분석 결과입니다. <strong>Valid(정상)</strong> 및 체크된 <strong>Warning(경고)</strong> 블록만 데이터베이스에 신규 추가(Insert)됩니다.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 pt-2 text-center">
                  <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">총 블록</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{previewStats.totalCount}</p>
                  </div>
                  <div className="p-3 bg-white border border-emerald-100 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">저장 가능</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">{previewStats.validCount}</p>
                  </div>
                  <div className="p-3 bg-white border border-amber-100 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">경고 있음</p>
                    <p className="text-xl font-black text-amber-600 mt-1">{previewStats.warningCount}</p>
                  </div>
                  <div className="p-3 bg-white border border-rose-100 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider">저장 불가</p>
                    <p className="text-xl font-black text-rose-600 mt-1">{previewStats.invalidCount}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Preview Blocks List */}
              <div className="max-h-[360px] overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-white/70 space-y-3.5 divide-y divide-slate-100/50">
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-slate-800 tracking-wide font-mono">
                            {b.workout ? `## ${b.workout.workout_date} ${b.workout.type}` : `## 라인 ${b.lineNum} 블록`}
                          </h4>
                          {b.workout && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                b.workout.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
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

                        <div className="shrink-0 pt-0.5">
                          {isInvalid ? (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-100/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> 저장 불가
                            </span>
                          ) : (
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
                                className="w-4.5 h-4.5 text-slate-900 focus:ring-slate-900 border-slate-300 rounded cursor-pointer"
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

                      {b.errors.length > 0 && (
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-[11px] font-semibold text-rose-700 space-y-1 shadow-inner">
                          {b.errors.map((err: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="shrink-0 mt-0.5 text-rose-600">❌</span>
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {b.warnings.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px] font-semibold text-amber-700 space-y-1 shadow-inner">
                          {b.warnings.map((warn: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="shrink-0 mt-0.5 text-amber-600">⚠️</span>
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {b.workout && b.workout.markdown && (
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs leading-relaxed font-semibold text-slate-500 whitespace-pre-wrap max-h-[80px] overflow-y-auto font-mono shadow-inner">
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
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={isCommitting || selectedBlockIndexes.length === 0}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-450 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed text-sm"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        데이터베이스 저장 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        데이터베이스 최종 저장
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Help / Accordion */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/40">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full px-4.5 py-3.5 justify-between flex items-center font-bold text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                💡 마크다운 가져오기(Import) 약속 양식 보기
              </span>
              {showHelp ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
            </button>

            {showHelp && (
              <div className="px-4.5 pb-5 pt-4 border-t border-slate-100 space-y-4 text-xs text-slate-500 font-semibold leading-relaxed bg-white animate-in slide-in-from-top-2 duration-200 p-4">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-800 text-sm">
                    📋 통합 백업 데이터 구성 예시
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold">
                    아래는 8종 운동 전체의 계획/완료 양식이 포함된 전체 백업 파일 내용입니다. 오른쪽의 <strong>전체 예시 복사</strong> 버튼을 누르면 한 번에 클립보드로 복사됩니다!
                  </p>
                </div>

                <div className="relative border border-slate-200 rounded-3xl bg-slate-900 overflow-hidden shadow-md">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest font-mono">
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

      {/* 2. Selective Data Export Section */}
      <section className="retro-card p-6 sm:p-8 space-y-8 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="p-2 rounded-2xl bg-slate-50 border border-slate-100 text-slate-850 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">데이터 마크다운 내보내기 (Export)</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            기록해두신 운동 로그를 Notion이나 Obsidian 등에서 바로 활용할 수 있는 **마크다운 (.md)** 형식으로 백업합니다. 원하는 기간과 운동 종류를 체크해보세요.
          </p>

          {/* Period Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                1. 기간 필터 선택
              </h3>
              
              <button
                type="button"
                onClick={() => setIsPeriodExportOpen(!isPeriodExportOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-97 shadow-sm"
              >
                <span>현재 선택: <strong>{isAllMonths ? '전체 기간' : `${selectedMonths.length}개 월 선택됨`}</strong></span>
                {isPeriodExportOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            {isPeriodExportOpen && (
              <div className="flex flex-wrap gap-2.5 pr-1 py-1 animate-in fade-in slide-in-from-top-1.5 duration-200">
                <button
                  type="button"
                  onClick={handleToggleAllMonths}
                  className={`px-4.5 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
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
                        className={`px-4.5 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
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
            )}
          </div>

          {/* Workout Type Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                2. 운동 종류 필터 선택
              </h3>
              
              <button
                type="button"
                onClick={() => setIsTypeExportOpen(!isTypeExportOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-97 shadow-sm"
              >
                <span>현재 선택: <strong>{isAllTypes ? '전체 운동' : `${selectedTypes.length}개 종류 선택됨`}</strong></span>
                {isTypeExportOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            {isTypeExportOpen && (
              <div className="flex flex-wrap gap-2.5 pr-1 py-1 animate-in fade-in slide-in-from-top-1.5 duration-200">
                <button
                  type="button"
                  onClick={handleToggleAllTypes}
                  className={`px-4.5 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
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
                      className={`px-4.5 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer ${
                        isChecked
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-700'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4" />}
                      {t.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Export Action Trigger */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-98 cursor-pointer text-sm"
            >
              <Download className="w-4.5 h-4.5" />
              마크다운 파일 다운로드
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  Compass,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CalendarPlus,
  Check,
  Loader2,
  Settings2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { addPlannedRunningAction } from './actions'
import { format, addDays } from 'date-fns'

// ── Types ──

interface UserProfile {
  runningGoal: string
  shoes: string
  trainingDays: string
  physicalNotes: string
}

interface QuestData {
  longTrackNext: number | null
  fastTrackActiveStep: string | null
  fastTrackActivePaceLimit: number | null
  fastTrackNextMission: { label: string; paceStr: string; durationSec: number } | null
}

interface AnalyzeResult {
  content: string
  reasoning_content: string | null
  questData: QuestData
}

type AIMode = 'fast' | 'pro'

const STORAGE_KEY = 'jos-ai-profile'
const defaultProfile: UserProfile = { runningGoal: '', shoes: '', trainingDays: '', physicalNotes: '' }

// ── Component ──

export default function AIToolsClient() {
  // Profile
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [profileOpen, setProfileOpen] = useState(false)

  // Tool states
  const [runningMode, setRunningMode] = useState<AIMode>('fast')
  const [questMode, setQuestMode] = useState<AIMode>('fast')
  const [runningLoading, setRunningLoading] = useState(false)
  const [questLoading, setQuestLoading] = useState(false)

  // Results
  const [activeResult, setActiveResult] = useState<{ type: 'running' | 'quest'; data: AnalyzeResult; mode: AIMode } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calendar add
  const [calendarDate, setCalendarDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [calendarAdding, setCalendarAdding] = useState(false)
  const [calendarAdded, setCalendarAdded] = useState(false)

  // Load profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setProfile(JSON.parse(saved))
    } catch {}
  }, [])

  // Save profile to localStorage
  const updateProfile = (key: keyof UserProfile, value: string) => {
    const next = { ...profile, [key]: value }
    setProfile(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  // Call analyze API
  const runAnalysis = async (action: 'running_analysis' | 'quest_strategy', mode: AIMode) => {
    const isRunning = action === 'running_analysis'
    if (isRunning) setRunningLoading(true)
    else setQuestLoading(true)

    setError(null)
    setActiveResult(null)
    setCalendarAdded(false)

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mode, profile }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setActiveResult({ type: isRunning ? 'running' : 'quest', data, mode })
      } else {
        setError(data.error || '분석 요청에 실패했습니다.')
      }
    } catch (e: any) {
      setError('서버와의 네트워크 통신에 실패했습니다.')
      console.error(e)
    } finally {
      if (isRunning) setRunningLoading(false)
      else setQuestLoading(false)
    }
  }

  // Add to calendar
  const handleAddToCalendar = async () => {
    if (!activeResult?.data.questData) return
    const quest = activeResult.data.questData

    let title = ''
    let markdown = ''

    if (quest.fastTrackNextMission) {
      const m = quest.fastTrackNextMission
      title = `${m.paceStr} 페이스 ${m.label} 러닝`
      markdown = `## Fast Track 미션\n\n목표: ${m.paceStr}/km 이하 페이스로 ${m.label} 유지\n\nAI 코치 추천 훈련`
    } else if (quest.longTrackNext) {
      title = `${quest.longTrackNext}km 완주 도전`
      markdown = `## Long Track 미션\n\n목표: 6:30~7:00/km 페이스로 ${quest.longTrackNext}km 완주\n\nAI 코치 추천 훈련`
    } else {
      title = '자유 러닝'
      markdown = '## 자유 러닝\n\nAI 코치 추천 훈련'
    }

    setCalendarAdding(true)
    try {
      await addPlannedRunningAction({
        workout_date: calendarDate,
        title,
        markdown,
      })
      setCalendarAdded(true)
    } catch (e) {
      setError('캘린더 추가에 실패했습니다.')
    } finally {
      setCalendarAdding(false)
    }
  }

  const anyLoading = runningLoading || questLoading

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">

      {/* ── Header ── */}
      <header className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-slate-800" />
          AI COACH
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
          AI Coach
        </h1>
        <p className="text-slate-500 font-semibold tracking-wide">
          내 데이터를 기반으로 자동 분석 및 전략 처방
        </p>
      </header>

      {/* ── Profile Settings (Collapsible) ── */}
      <section className="retro-card overflow-hidden">
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center justify-between p-5 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200/60">
              <Settings2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-left">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">내 러닝 프로필</span>
              <span className="text-xs text-slate-400 font-bold ml-2">AI RAG Context</span>
            </div>
          </div>
          {profileOpen
            ? <ChevronUp className="w-5 h-5 text-slate-400" />
            : <ChevronDown className="w-5 h-5 text-slate-400" />
          }
        </button>

        {profileOpen && (
          <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-slate-100 pt-5 animate-in fade-in duration-200">
            <p className="text-[11px] font-bold text-slate-400 tracking-wide leading-relaxed">
              아래 정보를 입력하면 AI가 나의 상황에 맞는 맞춤형 분석을 제공합니다. 브라우저에만 저장되어 서버로 전송되지 않습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="러닝 목표" placeholder="예: 10km 50분 이내" value={profile.runningGoal} onChange={(v) => updateProfile('runningGoal', v)} />
              <ProfileField label="러닝화" placeholder="예: 나이키 페가수스 41" value={profile.shoes} onChange={(v) => updateProfile('shoes', v)} />
              <ProfileField label="훈련 가능 요일" placeholder="예: 화, 목, 토" value={profile.trainingDays} onChange={(v) => updateProfile('trainingDays', v)} />
              <ProfileField label="특이사항" placeholder="예: 왼쪽 무릎 가끔 시림" value={profile.physicalNotes} onChange={(v) => updateProfile('physicalNotes', v)} />
            </div>
          </div>
        )}
      </section>

      {/* ── Tool Cards Grid ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Card 1: Running Analysis */}
        <ToolCard
          icon={<Activity className="w-5 h-5" />}
          iconBg="bg-rose-50 border-rose-100 text-rose-600"
          accentBorder="border-l-rose-500"
          label="RUNNING ANALYSIS"
          title="러닝 분석"
          description="최근 러닝 기록의 페이스 추이, 거리 변화, 회복 패턴을 자동 분석합니다."
          mode={runningMode}
          onModeChange={setRunningMode}
          loading={runningLoading}
          disabled={anyLoading}
          onRun={() => runAnalysis('running_analysis', runningMode)}
        />

        {/* Card 2: Quest Strategy */}
        <ToolCard
          icon={<Compass className="w-5 h-5" />}
          iconBg="bg-orange-50 border-orange-100 text-orange-600"
          accentBorder="border-l-orange-500"
          label="QUEST STRATEGY"
          title="퀘스트 공략"
          description="Long/Fast Track 퀘스트 진행도를 읽고, 다음 미션 클리어 전략을 처방합니다."
          mode={questMode}
          onModeChange={setQuestMode}
          loading={questLoading}
          disabled={anyLoading}
          onRun={() => runAnalysis('quest_strategy', questMode)}
        />
      </section>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-sm">에러 발생</h4>
            <p className="font-semibold leading-relaxed text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {/* ── Result Display ── */}
      {activeResult && (
        <section className="retro-card p-6 sm:p-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Result Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeResult.type === 'running'
                ? <Activity className="w-4.5 h-4.5 text-rose-500" />
                : <Compass className="w-4.5 h-4.5 text-orange-500" />
              }
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {activeResult.type === 'running' ? '러닝 분석 결과' : '퀘스트 공략 결과'}
              </span>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              {activeResult.mode === 'pro'
                ? <><Sparkles className="w-2.5 h-2.5 text-violet-400 fill-violet-400" /> Pro ✦</>
                : <><Zap className="w-2.5 h-2.5 text-orange-400 fill-orange-400" /> Fast ⚡</>
              }
            </span>
          </div>

          {/* Pro Thinking Accordion */}
          {activeResult.data.reasoning_content && (
            <details className="text-[11px] bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-slate-400 font-semibold cursor-pointer select-none">
              <summary className="font-bold text-slate-500 uppercase tracking-widest text-[9px] list-none flex items-center gap-1.5 focus:outline-none">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>◌ Thinking Process (사고 추론 과정)</span>
              </summary>
              <p className="mt-2 font-mono whitespace-pre-wrap leading-relaxed text-[10px] text-slate-500/80 bg-white/50 p-2 rounded-lg border border-slate-50 shadow-inner">
                {activeResult.data.reasoning_content}
              </p>
            </details>
          )}

          {/* Markdown Content */}
          <div className="prose max-w-none text-sm prose-headings:font-extrabold prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:p-3 prose-pre:rounded-xl prose-li:marker:text-slate-400 prose-strong:text-slate-900">
            <ReactMarkdown>{activeResult.data.content}</ReactMarkdown>
          </div>

          {/* Calendar Add Section */}
          {activeResult.type === 'quest' && activeResult.data.questData && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                ▲ 다음 훈련을 캘린더에 추가
              </h4>

              {calendarAdded ? (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold animate-in fade-in duration-200">
                  <Check className="w-5 h-5 text-emerald-500" />
                  {calendarDate}에 훈련 계획이 추가되었습니다!
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    disabled={calendarAdding}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {calendarAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CalendarPlus className="w-4 h-4" />
                    )}
                    {calendarAdding ? '추가 중...' : '캘린더에 계획 추가'}
                  </button>
                </div>
              )}

              {/* Preview of what will be added */}
              {!calendarAdded && activeResult.data.questData.fastTrackNextMission && (
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  추가 내용: <span className="text-slate-600">
                    {activeResult.data.questData.fastTrackNextMission.paceStr} 페이스 {activeResult.data.questData.fastTrackNextMission.label} 러닝
                  </span> (계획 상태)
                </p>
              )}
              {!calendarAdded && !activeResult.data.questData.fastTrackNextMission && activeResult.data.questData.longTrackNext && (
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  추가 내용: <span className="text-slate-600">
                    {activeResult.data.questData.longTrackNext}km 완주 도전
                  </span> (계획 상태)
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ── Sub-components ──

function ProfileField({
  label, placeholder, value, onChange,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-inner"
      />
    </div>
  )
}

function ToolCard({
  icon, iconBg, accentBorder, label, title, description,
  mode, onModeChange, loading, disabled, onRun,
}: {
  icon: React.ReactNode
  iconBg: string
  accentBorder: string
  label: string
  title: string
  description: string
  mode: AIMode
  onModeChange: (m: AIMode) => void
  loading: boolean
  disabled: boolean
  onRun: () => void
}) {
  return (
    <div className={`retro-card p-6 bg-gradient-to-tr from-slate-50/50 to-white flex flex-col justify-between ${accentBorder} border-l-4`}>
      <div>
        {/* Top: icon + label */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`p-1.5 rounded-lg border ${iconBg}`}>
            {icon}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>

        {/* Title & description */}
        <h3 className="text-xl font-extrabold text-slate-950 tracking-tight mb-1.5">{title}</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{description}</p>
      </div>

      {/* Bottom: mode toggle + run button */}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
        {/* Mode Toggle */}
        <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/40">
          <button
            type="button"
            onClick={() => onModeChange('fast')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              mode === 'fast'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Zap className={`w-3 h-3 ${mode === 'fast' ? 'text-orange-400 fill-orange-400' : 'text-slate-400'}`} />
            Fast ⚡
          </button>
          <button
            type="button"
            onClick={() => onModeChange('pro')}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              mode === 'pro'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className={`w-3 h-3 ${mode === 'pro' ? 'text-violet-400 fill-violet-400' : 'text-slate-400'}`} />
            Pro ✦
          </button>
        </div>

        {/* Run Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={loading || disabled}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-40 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              분석 중...
            </>
          ) : (
            '실행'
          )}
        </button>
      </div>
    </div>
  )
}

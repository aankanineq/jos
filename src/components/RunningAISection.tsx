'use client'

import { useState, useEffect, useRef } from 'react'
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
  Trash2,
  Plus,
  Save,
  Database,
  Info,
  Send,
  MessageSquare,
  Bot,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { addPlannedRunningAction } from '@/app/running/actions'
import { getAiProfile, saveAiProfile } from '@/app/actions/ai-profile'
import { ProfileItem, DEFAULT_RUNNING_PROFILE } from '@/app/actions/ai-profile-defaults'
import { format, addDays } from 'date-fns'

interface Props {
  uniqueMonths: string[]
}

interface QuestData {
  longTrackNext: number | null
  fastTrackActiveStep: string | null
  fastTrackActivePaceLimit: number | null
  fastTrackNextMission: { label: string; paceStr: string; durationSec: number } | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string | null
  questData?: QuestData | null
  suggestedUpdates?: { item_id: string; item_label: string; item_value: string }[] | null
  suggestedApplied?: boolean
  timestamp: Date
}

type AIMode = 'fast' | 'pro'
type StorageMode = 'db' | 'local' | 'loading';

const STORAGE_KEY = 'jos_ai_profile_running'

const ALL_WORKOUT_TYPES = [
  { id: 'Pull', label: '💪 Pull' },
  { id: 'Push', label: '🔥 Push' },
  { id: 'Leg', label: '🦵 Leg' },
  { id: 'Full', label: '🏋️ Full' },
  { id: 'Running', label: '🏃 Running' },
  { id: 'Tennis', label: '🎾 Tennis' },
  { id: 'Rest', label: '🛌 Rest' },
  { id: 'Other', label: '📝 Other' },
]

export default function RunningAISection({ uniqueMonths }: Props) {
  // Profile Items
  const [items, setItems] = useState<ProfileItem[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [storageMode, setStorageMode] = useState<StorageMode>('loading')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters & Attach History
  const [attachHistory, setAttachHistory] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isAllMonths, setIsAllMonths] = useState(false) // Default is latest month to avoid context bloating
  const [selectedMonths, setSelectedMonths] = useState<string[]>(uniqueMonths.slice(0, 1))
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Running']) // Default Running only

  // Tool states
  const [runningMode, setRunningMode] = useState<AIMode>('fast')
  const [questMode, setQuestMode] = useState<AIMode>('fast')
  const [runningLoading, setRunningLoading] = useState(false)
  const [questLoading, setQuestLoading] = useState(false)

  // Results
  const [error, setError] = useState<string | null>(null)

  // Calendar add
  const [calendarDate, setCalendarDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))

  // 1. Load profile from DB or Fallback to localStorage
  useEffect(() => {
    async function loadProfile() {
      setStorageMode('loading')
      const result = await getAiProfile('running')

      if (result.isFallback) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            setItems(JSON.parse(saved))
          } else {
            setItems(DEFAULT_RUNNING_PROFILE)
          }
        } catch {
          setItems(DEFAULT_RUNNING_PROFILE)
        }
        setStorageMode('local')
        return
      }

      setItems(result.items)
      setStorageMode('db')
    }

    loadProfile()
  }, [])

  // Clear messages after 3 seconds
  useEffect(() => {
    if (profileMessage) {
      const timer = setTimeout(() => setProfileMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [profileMessage])

  // 2. Save profile
  const handleSaveProfile = async (nextItems: ProfileItem[]) => {
    setProfileSaving(true)
    setProfileMessage(null)

    // filter blank items
    const filtered = nextItems.filter(item => item.item_label.trim() && item.item_value.trim())

    const result = await saveAiProfile('running', filtered)

    if (result.isFallback || !result.ok) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        setItems(filtered)
        setStorageMode('local')
        setProfileMessage({ type: 'success', text: '브라우저 로컬 저장소에 저장 완료!' })
      } catch {
        setProfileMessage({ type: 'error', text: '저장에 실패했습니다.' })
      }
    } else {
      setItems(filtered)
      setStorageMode('db')
      setProfileMessage({ type: 'success', text: 'Supabase DB 동기화 완료!' })
    }
    setProfileSaving(false)
  }

  // Profile Edit Helpers
  const handleItemChange = (index: number, field: 'item_label' | 'item_value', val: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: val }
    setItems(next)
  }

  const handleAddItem = () => {
    const nextId = `running_custom_${Date.now()}`
    const newItem: ProfileItem = {
      item_id: nextId,
      item_label: '',
      item_value: '',
      item_order: items.length + 1,
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, item_order: idx + 1 }))
    setItems(next)
  }

  // Month filters helpers
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

  // Type filters helpers
  const handleToggleType = (typeId: string) => {
    let updated: string[]
    if (selectedTypes.includes(typeId)) {
      updated = selectedTypes.filter(t => t !== typeId)
    } else {
      updated = [...selectedTypes, typeId]
    }
    setSelectedTypes(updated)
  }

  const handleToggleAllTypes = () => {
    if (selectedTypes.length === ALL_WORKOUT_TYPES.length) {
      setSelectedTypes(['Running']) // Reset to default running only
    } else {
      setSelectedTypes(ALL_WORKOUT_TYPES.map(t => t.id))
    }
  }

  // Conversational Chat States & Refs
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [calendarMessageIdAdding, setCalendarMessageIdAdding] = useState<string | null>(null)
  const [calendarMessageIdAdded, setCalendarMessageIdAdded] = useState<string[]>([])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  // Initial welcome message loading
  useEffect(() => {
    setChatMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '안녕하세요! 당신의 **JOS AI 러닝 코치**입니다. 🏃\n\n현재 세팅된 내 러닝 프로필과 운동 로그 데이터를 기반으로 맞춤형 분석을 지시하거나 질문을 남겨보세요!\n- 아래의 **[최근 러닝 심층 분석 실행]** 이나 **[다음 퀘스트 돌파 공략 실행]** 단축 지시어를 눌러 정밀 RAG 피드백을 즉시 받아보실 수도 있습니다.',
        timestamp: new Date(),
      }
    ])
  }, [])

  // Call RAG analyze API
  const handleSendMessage = async (text: string, action?: 'running_analysis' | 'quest_strategy') => {
    const trimmedText = text.trim()
    if (!trimmedText || chatLoading) return

    const userMsgId = `user_${Date.now()}`
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmedText,
      timestamp: new Date(),
    }

    const nextMessages = [...chatMessages, newUserMsg]
    setChatMessages(nextMessages)
    setInputText('')
    setChatLoading(true)
    setError(null)

    // Normalize messages history for DeepSeek (role & content only)
    const apiMessages = nextMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    const payload = {
      action: action || 'running_analysis',
      coachType: 'running',
      mode: action === 'quest_strategy' ? questMode : runningMode,
      profileItems: items.filter(item => item.item_label.trim() && item.item_value.trim()),
      attachHistory,
      filters: attachHistory ? {
        months: isAllMonths ? ['all'] : selectedMonths,
        types: selectedTypes,
      } : undefined,
      chatMessages: apiMessages,
    }

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Detect profile updates in content
        let parsedUpdates = null
        try {
          const match = data.content.match(/```profile_updates\s*([\s\S]*?)\s*```/)
          if (match && match[1]) {
            parsedUpdates = JSON.parse(match[1])
          }
        } catch (e) {
          console.error('Failed to parse inline updates:', e)
        }

        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.content,
          reasoning_content: data.reasoning_content || null,
          questData: data.questData || null,
          suggestedUpdates: parsedUpdates,
          suggestedApplied: false,
          timestamp: new Date(),
        }

        setChatMessages(prev => [...prev, assistantMsg])
      } else {
        setError(data.error || '답변을 가져오는데 실패했습니다.')
      }
    } catch (e: any) {
      setError('서버와의 네트워크 통신에 실패했습니다.')
      console.error(e)
    } finally {
      setChatLoading(false)
    }
  }

  // Apply suggested updates for a specific message
  const handleApplySuggestionsForMessage = async (messageId: string, suggestedUpdates: any[]) => {
    if (!suggestedUpdates || suggestedUpdates.length === 0) return

    const nextItems = [...items]

    for (const sugg of suggestedUpdates) {
      const idx = nextItems.findIndex(item => item.item_id === sugg.item_id)
      if (idx !== -1) {
        nextItems[idx] = { ...nextItems[idx], item_label: sugg.item_label, item_value: sugg.item_value }
      } else {
        nextItems.push({
          item_id: sugg.item_id,
          item_label: sugg.item_label,
          item_value: sugg.item_value,
          item_order: nextItems.length + 1,
        })
      }
    }

    await handleSaveProfile(nextItems)

    // Mark as applied in state for this specific message
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, suggestedApplied: true }
      }
      return msg
    }))
  }

  // Add a recommended workout to the planned calendar
  const handleAddToCalendarForMessage = async (messageId: string, quest: QuestData, dateStr: string) => {
    if (!quest) return

    let title = ''
    let markdown = ''

    if (quest.fastTrackNextMission) {
      const m = quest.fastTrackNextMission
      title = `${m.paceStr} 페이스 ${m.label} 러닝`
      markdown = `## Fast Track 미션\n\n목표: ${m.paceStr}/km 이하 페이스로 ${m.label} 유지\n\nAI 러닝 코치 추천 훈련`
    } else if (quest.longTrackNext) {
      title = `${quest.longTrackNext}km 완주 도전`
      markdown = `## Long Track 미션\n\n목표: 6:30~7:00/km 페이스로 ${quest.longTrackNext}km 완주\n\nAI 러닝 코치 추천 훈련`
    } else {
      title = '자유 러닝'
      markdown = '## 자유 러닝\n\nAI 러닝 코치 추천 훈련'
    }

    setCalendarMessageIdAdding(messageId)
    try {
      await addPlannedRunningAction({
        workout_date: dateStr,
        title,
        markdown,
      })
      setCalendarMessageIdAdded(prev => [...prev, messageId])
    } catch (e) {
      setError('캘린더 추가에 실패했습니다.')
    } finally {
      setCalendarMessageIdAdding(null)
    }
  }

  // Remove JSON blocks from Markdown render
  const getCleanMarkdown = (content: string) => {
    return content.replace(/```profile_updates[\s\S]*?```/g, '').trim()
  }

  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-')
    return `${year}년 ${month}월`
  }

  const anyLoading = runningLoading || questLoading

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-650 text-xs font-extrabold tracking-wider uppercase border border-rose-100/50">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            RUNNING AI COACH
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            AI 러닝 코치
          </h2>
        </div>

        {/* Storage status badge */}
        {storageMode !== 'loading' && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide border shadow-sm ${
            storageMode === 'db'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-100'
          }`}>
            <Database className="w-3 h-3 shrink-0" />
            {storageMode === 'db' ? 'Supabase DB 동기화 완료' : '브라우저 로컬 저장 모드'}
          </span>
        )}
      </div>

      {/* ── Profile settings (Collapsible dynamic list) ── */}
      <div className="retro-card overflow-hidden bg-slate-50/20 border border-slate-150 shadow-sm">
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <Settings2 className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-800 tracking-tight block leading-tight">내 러닝 프로필 세팅</span>
              <span className="text-[10px] text-slate-400 font-bold">자유롭게 항목을 추가/수정하여 AI RAG에 제공</span>
            </div>
          </div>
          {profileOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {profileOpen && (
          <div className="px-4 pb-5 space-y-4 border-t border-slate-100 pt-4 bg-white animate-in fade-in duration-200">
            {storageMode === 'loading' ? (
              <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-bold gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                프로필 데이터를 로딩 중...
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed flex items-start gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                  <span>
                    나만의 커스텀 항목을 마음껏 추가해 보세요. 운동 강도, 선호 러닝화, 관절 상황 등을 입력하면 AI가 완벽히 숙지합니다. 
                    (※ 빈 필드는 자동으로 저장 목록에서 제외됩니다.)
                  </span>
                </p>

                {/* Profile Items Dynamic List */}
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.item_id} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100 group animate-in slide-in-from-left-2 duration-150">
                      <input
                        type="text"
                        value={item.item_label}
                        onChange={(e) => handleItemChange(idx, 'item_label', e.target.value)}
                        placeholder="항목명 (예: 러닝화)"
                        className="w-1/3 min-w-[90px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 placeholder-slate-350 focus:outline-none focus:border-slate-800 transition-colors shadow-sm"
                      />
                      <input
                        type="text"
                        value={item.item_value}
                        onChange={(e) => handleItemChange(idx, 'item_value', e.target.value)}
                        placeholder="세부 내용 (예: 나이키 베이퍼플라이)"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-350 focus:outline-none focus:border-slate-800 transition-colors shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                        title="항목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4 font-semibold">
                      등록된 프로필 항목이 없습니다. 새로운 항목을 추가해보세요.
                    </p>
                  )}
                </div>

                {/* Edit Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all active:scale-97 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    새 항목 추가
                  </button>

                  <div className="flex items-center gap-2">
                    {profileMessage && (
                      <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg animate-fade-in ${
                        profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {profileMessage.text}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSaveProfile(items)}
                      disabled={profileSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all shadow-md active:scale-97 cursor-pointer disabled:opacity-40"
                    >
                      {profileSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      설정 저장
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Tool Options & Advanced Filters (Attach History) ── */}
      <div className="retro-card p-4 sm:p-5 bg-gradient-to-tr from-slate-50/20 to-white border border-slate-150 shadow-sm space-y-4">
        
        {/* Toggle Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={attachHistory}
              onChange={(e) => {
                setAttachHistory(e.target.checked)
                if (!e.target.checked) setFiltersOpen(false)
              }}
              className="w-4.5 h-4.5 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 focus:ring-offset-0 shrink-0 cursor-pointer"
            />
            <div>
              <span className="text-xs font-black text-slate-800 tracking-tight">내 운동 기록 첨부하기</span>
              <span className="text-[10px] text-slate-400 font-bold block">분석 시 이전 러닝 히스토리를 데이터에 결합시킵니다</span>
            </div>
          </label>

          {attachHistory && (
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-[10px] font-black tracking-wide cursor-pointer transition-colors"
            >
              고급 필터 옵션
              {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Dynamic Filters Panel */}
        {attachHistory && filtersOpen && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* Period Filters */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                기간 선택
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleAllMonths}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isAllMonths
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                  }`}
                >
                  전체 기간
                </button>
                {uniqueMonths.map((m) => {
                  const isSelected = selectedMonths.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleToggleMonth(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        !isAllMonths && isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-450 hover:border-slate-350'
                      }`}
                    >
                      {formatMonthLabel(m)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Type Filters */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  운동 종류
                </h4>
                <button
                  type="button"
                  onClick={handleToggleAllTypes}
                  className="text-[9px] font-black text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {selectedTypes.length === ALL_WORKOUT_TYPES.length ? '러닝만 선택' : '전체 선택'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_WORKOUT_TYPES.map((t) => {
                  const isSelected = selectedTypes.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleType(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-450 hover:border-slate-350'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tool Cards inside the panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* Card 1: Running Analysis */}
          <div className="flex flex-col justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-150">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">최근 러닝 심층 분석</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                페이스 편차, 거리 패턴을 검토하여 성장을 방해하는 병목지점을 찾습니다.
              </p>
            </div>
            <div className="mt-4 flex bg-white p-0.5 rounded-lg border border-slate-200 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setRunningMode('fast')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  runningMode === 'fast' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Zap className={`w-3 h-3 ${runningMode === 'fast' ? 'text-orange-400 fill-orange-400' : 'text-slate-400'}`} />
                Fast ⚡
              </button>
              <button
                type="button"
                onClick={() => setRunningMode('pro')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  runningMode === 'pro' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sparkles className={`w-3 h-3 ${runningMode === 'pro' ? 'text-violet-400 fill-violet-400' : 'text-slate-400'}`} />
                Pro ✦
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('🏃 [최근 러닝 심층 분석 실행] 최근 내 러닝 기록과 개인 프로필을 토대로 심층 RAG 피드백을 제공해줘.', 'running_analysis')}
                disabled={chatLoading}
                className="px-4 py-1.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black transition-colors shadow-sm active:scale-97 cursor-pointer shrink-0 disabled:opacity-40"
              >
                {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '실행'}
              </button>
            </div>
          </div>
 
          {/* Card 2: Quest Strategy */}
          <div className="flex flex-col justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-150">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">다음 퀘스트 돌파 공략</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                현재 롱/패스트 퀘스트 보드를 파악해 다음 과제 돌파 페이스를 처방합니다.
              </p>
            </div>
            <div className="mt-4 flex bg-white p-0.5 rounded-lg border border-slate-200 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuestMode('fast')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  questMode === 'fast' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Zap className={`w-3 h-3 ${questMode === 'fast' ? 'text-orange-400 fill-orange-400' : 'text-slate-400'}`} />
                Fast ⚡
              </button>
              <button
                type="button"
                onClick={() => setQuestMode('pro')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  questMode === 'pro' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sparkles className={`w-3 h-3 ${questMode === 'pro' ? 'text-violet-400 fill-violet-400' : 'text-slate-400'}`} />
                Pro ✦
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('🧭 [퀘스트 돌파 전략 수립] 현재 퀘스트 진행 상황을 확인하고 다음 목표 정복을 위한 전략을 세부 수립해줘.', 'quest_strategy')}
                disabled={chatLoading}
                className="px-4 py-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black transition-colors shadow-sm active:scale-97 cursor-pointer shrink-0 disabled:opacity-40"
              >
                {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '실행'}
              </button>
            </div>
          </div>
        </div>
      </div>
 
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

      {/* ── Conversational Chat Session Card ── */}
      <div className="retro-card overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 tracking-tight block">AI 러닝 코치와 대화</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase">AI Coach Online</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
            RAG ACTIVE
          </span>
        </div>

        {/* Message Log scrollarea */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto bg-slate-50/20 shadow-inner scrollbar-thin flex-1 min-h-[300px]">
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className="space-y-2">
                {/* Bubble Wrapper */}
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                  <div className={`rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-sm max-w-[85%] ${
                    isUser 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-150 text-slate-800 rounded-tl-none'
                  }`}>
                    {/* User Title or Bot Info */}
                    {!isUser && (
                      <div className="flex items-center gap-1.5 text-rose-650 font-extrabold tracking-wide uppercase text-[9px] mb-2 border-b border-rose-50 pb-1.5">
                        <Sparkles className="w-3 h-3 text-rose-500 animate-pulse" />
                        AI RUNNING COACH
                      </div>
                    )}

                    {/* Pro reasoning process accordion inside AI bubble */}
                    {!isUser && msg.reasoning_content && (
                      <details className="mb-3 text-[10px] bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-slate-400 font-semibold cursor-pointer select-none">
                        <summary className="font-bold text-slate-500 uppercase tracking-widest text-[8px] list-none flex items-center gap-1 focus:outline-none">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>사고 추론 과정 (DeepSeek Reasoning)</span>
                        </summary>
                        <p className="mt-1.5 font-mono whitespace-pre-wrap leading-relaxed text-[9px] text-slate-500/80 bg-white/50 p-2 rounded-lg border border-slate-50 shadow-inner">
                          {msg.reasoning_content}
                        </p>
                      </details>
                    )}

                    {/* Main content */}
                    <div className="prose max-w-none text-slate-800 text-xs leading-relaxed prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-slate-950 prose-headings:text-sm prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:p-2.5 prose-pre:rounded-lg prose-li:marker:text-slate-400 prose-strong:text-slate-950 prose-strong:font-black">
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <ReactMarkdown>{getCleanMarkdown(msg.content)}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Suggested Updates (if present for this message) */}
                {!isUser && msg.suggestedUpdates && (
                  <div className={`mx-4 p-4 rounded-2xl border flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
                    msg.suggestedApplied 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-indigo-50 border-indigo-100 text-indigo-900'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${msg.suggestedApplied ? 'text-emerald-500' : 'text-indigo-500'}`} />
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs flex items-center gap-1.5">
                          {msg.suggestedApplied ? '🎉 AI 제언 프로필 업데이트가 완벽하게 반영되었습니다!' : '🤖 AI 코치 추천 프로필 업데이트'}
                        </h4>
                        <p className="text-[10px] text-indigo-750 font-medium leading-relaxed">
                          {msg.suggestedApplied 
                            ? '업데이트된 RAG 프로필이 데이터베이스에 실시간으로 기록되었습니다.' 
                            : 'AI RAG 피드백을 기반으로 아래 변경사항 적용을 제안합니다. 검토 후 아래 버튼을 클릭하세요:'}
                        </p>
                      </div>
                    </div>

                    {!msg.suggestedApplied && (
                      <div className="space-y-2 bg-white/60 p-2.5 rounded-xl border border-indigo-100/50">
                        {msg.suggestedUpdates.map((sugg) => {
                          const existing = items.find(item => item.item_id === sugg.item_id)
                          return (
                            <div key={sugg.item_id} className="text-[11px] leading-normal font-semibold">
                              <span className="font-extrabold text-slate-800">• {sugg.item_label}</span>: 
                              {existing ? (
                                <span className="text-slate-400 font-semibold line-through ml-1.5">{existing.item_value}</span>
                              ) : (
                                <span className="text-emerald-600 font-black ml-1 px-1 py-0.2 rounded bg-emerald-50 border border-emerald-100/30 text-[8px] uppercase tracking-wide">신규</span>
                              )}
                              <span className="text-slate-400 px-1 font-bold">→</span>
                              <span className="text-indigo-900 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/30">{sugg.item_value}</span>
                            </div>
                          )
                        })}

                        <div className="pt-1.5 border-t border-indigo-100/20 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleApplySuggestionsForMessage(msg.id, msg.suggestedUpdates!)}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-[10px] transition-all shadow active:scale-97 cursor-pointer"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            내 프로필에 반영하기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Calendar add gadget (if questData present for this message) */}
                {!isUser && msg.questData && (
                  <div className="mx-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarPlus className="w-3.5 h-3.5 text-rose-500" />
                      추천된 처방 훈련을 내 캘린더에 등재하기
                    </h4>

                    {calendarMessageIdAdded.includes(msg.id) ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                        예약 날짜에 미션 훈련 일정이 성공적으로 추가되었습니다!
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={calendarDate}
                          onChange={(e) => setCalendarDate(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-850 transition-colors shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddToCalendarForMessage(msg.id, msg.questData!, calendarDate)}
                          disabled={calendarMessageIdAdding === msg.id}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] transition-all shadow active:scale-97 cursor-pointer disabled:opacity-40"
                        >
                          {calendarMessageIdAdding === msg.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CalendarPlus className="w-3 h-3" />
                          )}
                          캘린더에 훈련 예약 등록
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Typing Loading Indicator bubble */}
          {chatLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="rounded-2xl p-4 bg-white border border-slate-150 shadow-sm rounded-tl-none max-w-[85%]">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500 shrink-0" />
                  <span>코치님이 데이터를 분석하여 RAG 처방을 조율하고 있습니다...</span>
                </div>
                {/* 리드미컬하게 바운싱되는 3개의 점 애니메이션 */}
                <div className="flex gap-1 mt-2.5 pl-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce duration-300 delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce duration-300 delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce duration-300 delay-225" />
                </div>
              </div>
            </div>
          )}

          {/* Ref element to auto scroll to bottom */}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-150/60 bg-slate-50/30 flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(inputText)
            }}
            className="flex items-center gap-2.5 relative"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(inputText)
                }
              }}
              placeholder={chatLoading ? '코치의 답변을 대기 중입니다...' : '코치님에게 질문을 입력하거나 분석 명령을 내리세요... (Enter 전송)'}
              disabled={chatLoading}
              rows={1}
              className="flex-1 bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-xs font-semibold focus:outline-none focus:border-slate-800 transition-colors shadow-sm resize-none scrollbar-none disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputText.trim()}
              className="absolute right-2 top-2 p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow transition-all active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
          
          <div className="text-[10px] text-slate-400 font-bold text-center">
            * Shift + Enter를 누르면 줄바꿈(개행)이 가능합니다.
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Sparkles, 
  Send, 
  Zap, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  Info, 
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string
  mode?: 'fast' | 'pro'
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [mode, setMode] = useState<'fast' | 'pro'>('fast')
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 대화 추가 시 하단 스크롤 자동 고정
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // 전송 처리 핸들러
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    setErrorMsg(null)
    const userMessage: Message = {
      role: 'user',
      content: text
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    // 대화 내역 전체 포함 (서버로 전달)
    const chatHistory = [...messages, userMessage]

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          mode: mode
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const choice = data.choices[0]
        const aiMessage: Message = {
          role: 'assistant',
          content: choice.message.content || '',
          reasoning_content: choice.message.reasoning_content || undefined,
          mode: mode
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        setErrorMsg(data.error || 'AI 통신 실패: 알 수 없는 오류가 발생했습니다.')
      }
    } catch (e: any) {
      setErrorMsg('서버 네트워크 오류가 발생했습니다. 환경설정을 다시 점검해 주세요.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  // 퀵 스타트 추천 질문 리스트
  const quickSuggestions = [
    { label: '✦ 최근 내 운동 요약 및 피드백해 줘', prompt: '내 최근 15개 운동 로그를 요약해주고, 운동 주기와 강도가 적절한지 피드백 해줘.' },
    { label: '▲ 내가 런닝을 더 잘 달리기 위한 처방을 줘', prompt: 'JOS 런닝 퀘스트(Long/Fast Track)를 잘 클리어하고 페이스를 빠르게 늘리기 위한 호흡법 및 보강 운동 꿀팁을 처방해줘.' },
    { label: '◌ 휴식(Rest)을 언제 가져가는 것이 최선일까?', prompt: '근성장 및 부상 방지를 위해 휴식(Rest) 요일을 설정하는 기준과 효과적인 리커버리 스트레칭 방법을 추천해줘.' }
  ]

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      
      {/* 1. Header & Mode Switcher */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-150 text-slate-800 text-xs font-extrabold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            JOS AI COACH
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            AI Assistant
          </h1>
        </div>

        {/* ⚡ Premium Segmented Mode Selector ⚡ */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/40 w-full sm:w-auto shrink-0 relative">
          <button
            type="button"
            onClick={() => setMode('fast')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'fast'
                ? 'bg-slate-950 text-white shadow-sm scale-102 font-black'
                : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${mode === 'fast' ? 'text-orange-400 fill-orange-400' : 'text-slate-400'}`} />
            Fast ⚡
          </button>
          <button
            type="button"
            onClick={() => setMode('pro')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'pro'
                ? 'bg-slate-950 text-white shadow-sm scale-102 font-black'
                : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${mode === 'pro' ? 'text-violet-400 fill-violet-400' : 'text-slate-400'}`} />
            Pro ✦
          </button>
        </div>
      </header>

      {/* 2. Chat Feed Area */}
      <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="h-full flex flex-col justify-center items-center text-center space-y-8 py-8 animate-in fade-in duration-300">
            <div className="p-5 bg-white border border-slate-100/80 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-center scale-105">
              <Sparkles className="w-10 h-10 text-slate-800 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">어떤 조언이 필요하신가요?</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">
                Fast 모드로 빠르게 피드백을 받거나,<br />
                Pro 모드로 딥시크의 깊이 있는 추론 분석을 실행해보세요.
              </p>
            </div>

            {/* Quick Suggestion Buttons */}
            <div className="w-full max-w-md flex flex-col gap-3.5 pt-4">
              {quickSuggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSendMessage(s.prompt)}
                  className="w-full text-left p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-150 hover:border-slate-250 transition-all text-slate-700 hover:text-slate-950 font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          <div className="flex flex-col gap-5 pr-1.5 pb-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${
                    isUser ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  
                  {/* Message Bubble */}
                  <div className={`p-4.5 rounded-2xl leading-relaxed shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all ${
                    isUser 
                      ? 'bg-slate-100/90 text-slate-800 font-semibold text-sm rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-905 text-sm rounded-tl-none font-semibold'
                  }`}>
                    
                    {/* Pro Mode: DeepSeek Reasoner Thinking CoT Accordion */}
                    {!isUser && msg.reasoning_content && (
                      <details className="mb-3.5 text-[11px] bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-slate-400 font-semibold cursor-pointer select-none">
                        <summary className="font-bold text-slate-500 uppercase tracking-widest text-[9px] list-none flex items-center gap-1.5 focus:outline-none">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>◌ Thinking Process (사고 추론 과정)</span>
                        </summary>
                        <p className="mt-2 font-mono whitespace-pre-wrap leading-relaxed text-[10px] text-slate-500/80 bg-white/50 p-2 rounded-lg border border-slate-50 shadow-inner">
                          {msg.reasoning_content}
                        </p>
                      </details>
                    )}

                    {/* Final Markdown Content */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose max-w-none text-sm prose-headings:font-bold prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:p-3 prose-pre:rounded-xl">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                  </div>

                  {/* Mode Badge & Label under AI Bubbles */}
                  {!isUser && msg.mode && (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      {msg.mode === 'pro' ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-violet-400 fill-violet-400" />
                          Pro ✦ model
                        </>
                      ) : (
                        <>
                          <Zap className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                          Fast ⚡ model
                        </>
                      )}
                    </span>
                  )}

                </div>
              )
            })}

            {/* Bubble Loading Animation */}
            {loading && (
              <div className="self-start flex flex-col items-start gap-1">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center justify-center">
                  <div className="flex space-x-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. API Error Warning Banner */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-250">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-sm">통신 에러 발생</h4>
            <p className="font-semibold leading-relaxed text-rose-600">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 4. Chat Input Form Panel */}
      <form onSubmit={handleFormSubmit} className="relative mt-2 border-t border-slate-100 pt-4 bg-white">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            placeholder={
              loading 
                ? 'AI 코치가 응답을 생성하고 있습니다...' 
                : mode === 'pro' 
                  ? 'Pro 추론 모드로 질문해 보세요...' 
                  : 'Fast 모드로 질문해 보세요...'
            }
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold shadow-inner text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-950 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-all cursor-pointer shadow-sm active:scale-95 disabled:scale-100"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </form>

    </div>
  )
}

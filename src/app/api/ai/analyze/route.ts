import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkoutEntry } from '@/lib/types'
import {
  computeQuestProgress,
  formatRunningDataForAI,
  formatQuestProgressForAI,
  formatRecentWorkoutsForAI,
  formatProfileForAI,
  formatGymDataForAI,
  formatGymProfileForAI,
  ProfileItem,
} from '@/lib/ai/context'
import { getRunningAnalysisPrompt, getQuestStrategyPrompt, getGymAnalysisPrompt } from '@/lib/ai/prompts'
import { getExercisesHistory } from '@/lib/workouts/exercises-repository'

const MAX_ATTACHED_RECORDS = 30;

function filterWorkoutsByRequest<T extends { workout_date?: string; date?: string; type?: string }>(
  items: T[],
  filters?: {
    months: string[];
    types: string[];
  }
): T[] {
  if (!filters) return items;

  return items.filter((item) => {
    const date = item.workout_date ?? item.date ?? '';
    const month = date.slice(0, 7);
    const type = item.type ?? '';

    const monthOk =
      filters.months.length === 0 ||
      filters.months.includes('all') ||
      filters.months.includes(month);

    const typeOk =
      filters.types.length === 0 ||
      filters.types.includes('all') ||
      filters.types.includes(type);

    return monthOk && typeOk;
  });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DEEPSEEK_API_KEY가 설정되지 않았습니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, coachType, mode, profileItems, attachHistory, filters, chatMessages } = body

    const activeCoachType = coachType || (action === 'gym_analysis' ? 'gym' : 'running')
    
    if (!activeCoachType || !['running', 'gym'].includes(activeCoachType)) {
      return NextResponse.json(
        { success: false, error: '유효한 coachType 혹은 action이 아닙니다.' },
        { status: 400 }
      )
    }

    // 1. 로그인 사용자 인증 및 운동 데이터 쿼리
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { data: workoutsData, error: dbError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })

    if (dbError) {
      return NextResponse.json(
        { success: false, error: `데이터 조회 실패: ${dbError.message}` },
        { status: 500 }
      )
    }

    const rawWorkouts = workoutsData as WorkoutEntry[]

    // 2. 컨텍스트 조립 (필터링된 내역)
    const questProgress = computeQuestProgress(rawWorkouts)
    
    let userContext = ''
    let systemPrompt = ''

    const profileContext = profileItems ? formatProfileForAI(profileItems as ProfileItem[]) : ''
    const gymProfileContext = profileItems ? formatGymProfileForAI(profileItems as ProfileItem[]) : ''

    if (activeCoachType === 'running') {
      const selectedHistory = attachHistory 
        ? filterWorkoutsByRequest(rawWorkouts, filters)
            .sort((a, b) => b.workout_date.localeCompare(a.workout_date))
            .slice(0, MAX_ATTACHED_RECORDS)
        : [];

      const runningContext = formatRunningDataForAI(selectedHistory)
      const questContext = formatQuestProgressForAI(questProgress)
      const allWorkoutsContext = formatRecentWorkoutsForAI(selectedHistory)

      if (action === 'quest_strategy') {
        systemPrompt = getQuestStrategyPrompt()
        userContext = [profileContext, questContext, runningContext].filter(Boolean).join('\n\n')
      } else {
        systemPrompt = getRunningAnalysisPrompt()
        userContext = [profileContext, runningContext, allWorkoutsContext].filter(Boolean).join('\n\n')
      }
    } else {
      // Gym Analysis
      systemPrompt = getGymAnalysisPrompt()
      
      let gymHistoryContext = '근력 운동 기록이 첨부되지 않았습니다.'
      if (attachHistory) {
        const fullGymHistory = await getExercisesHistory()
        const selectedGymHistory = filterWorkoutsByRequest(fullGymHistory, filters)
          .sort((a, b) => b.workout_date.localeCompare(a.workout_date))
          .slice(0, MAX_ATTACHED_RECORDS)
        gymHistoryContext = formatGymDataForAI(selectedGymHistory)
      }

      userContext = [gymProfileContext, gymHistoryContext].filter(Boolean).join('\n\n')
    }

    // 3. DeepSeek API 호출
    const modelName = mode === 'pro' ? 'deepseek-v4-pro' : 'deepseek-v4-flash'
    
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `아래는 나의 실제 운동 데이터 및 RAG 프로필입니다. 이 데이터를 기반으로 분석을 수행하고 내 질문에 답변해 주세요.\n\n[운동 데이터 & RAG 프로필]\n${userContext}`,
      },
    ]

    if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
      // 대화 기록 추가 (DeepSeek 규격에 맞게 role과 content만 필터링)
      const normalizedChat = chatMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }))
      messages.push(...normalizedChat)
    } else {
      // 대화 로그가 없는 경우 (싱글 샷 분석 폴백)
      messages.push({
        role: 'user',
        content: action === 'quest_strategy'
          ? '현재 퀘스트 현황을 확인하고 다음 미션 돌파 전략을 세부 수립해줘.'
          : '최근 내 운동 기록을 정밀 심층 분석하고 실천 가이드를 처방해줘.',
      })
    }

    const apiPayload: any = {
      model: modelName,
      messages,
    }

    if (mode === 'pro') {
      apiPayload.thinking = { type: 'enabled' }
      apiPayload.reasoning_effort = 'high'
    } else {
      apiPayload.thinking = { type: 'disabled' }
      apiPayload.temperature = 0.7
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(apiPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('DeepSeek API Error:', data)
      return NextResponse.json(
        { success: false, error: data.error?.message || `API 에러 (${response.status})` },
        { status: response.status }
      )
    }

    const choice = data.choices[0]

    return NextResponse.json({
      success: true,
      content: choice.message.content || '',
      reasoning_content: choice.message.reasoning_content || null,
      questData: activeCoachType === 'running' ? {
        longTrackNext: questProgress.longTrack.nextGoal,
        fastTrackActiveStep: questProgress.fastTrack.activeStep,
        fastTrackActivePaceLimit: questProgress.fastTrack.activePaceLimit,
        fastTrackNextMission: questProgress.fastTrack.nextMission,
      } : undefined,
    })
  } catch (error: any) {
    console.error('AI Analyze Route Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || '서버 내부 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkoutEntry } from '@/lib/types'
import {
  computeQuestProgress,
  formatRunningDataForAI,
  formatQuestProgressForAI,
  formatRecentWorkoutsForAI,
  formatProfileForAI,
  UserProfile,
} from '@/lib/ai/context'
import { getRunningAnalysisPrompt, getQuestStrategyPrompt } from '@/lib/ai/prompts'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DEEPSEEK_API_KEY가 설정되지 않았습니다.' },
        { status: 400 }
      )
    }

    const { action, mode, profile } = await request.json()

    if (!action || !['running_analysis', 'quest_strategy'].includes(action)) {
      return NextResponse.json(
        { success: false, error: '유효한 action이 아닙니다.' },
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

    const workouts = workoutsData as WorkoutEntry[]

    // 2. 컨텍스트 조립
    const questProgress = computeQuestProgress(workouts)
    const runningContext = formatRunningDataForAI(workouts)
    const questContext = formatQuestProgressForAI(questProgress)
    const allWorkoutsContext = formatRecentWorkoutsForAI(workouts)
    const profileContext = profile ? formatProfileForAI(profile as UserProfile) : ''

    // 3. 액션별 시스템 프롬프트 + 사용자 컨텍스트 결합
    let systemPrompt = ''
    let userContext = ''

    if (action === 'running_analysis') {
      systemPrompt = getRunningAnalysisPrompt()
      userContext = [profileContext, runningContext, allWorkoutsContext].filter(Boolean).join('\n\n')
    } else {
      systemPrompt = getQuestStrategyPrompt()
      userContext = [profileContext, questContext, runningContext].filter(Boolean).join('\n\n')
    }

    // 4. DeepSeek API 호출
    const modelName = mode === 'pro' ? 'deepseek-v4-pro' : 'deepseek-v4-flash'
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `아래는 나의 실제 운동 데이터입니다. 이 데이터를 기반으로 분석 및 전략을 제시해 주세요.\n\n${userContext}`,
      },
    ]

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
      questData: {
        longTrackNext: questProgress.longTrack.nextGoal,
        fastTrackActiveStep: questProgress.fastTrack.activeStep,
        fastTrackActivePaceLimit: questProgress.fastTrack.activePaceLimit,
        fastTrackNextMission: questProgress.fastTrack.nextMission,
      },
    })
  } catch (error: any) {
    console.error('AI Analyze Route Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || '서버 내부 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

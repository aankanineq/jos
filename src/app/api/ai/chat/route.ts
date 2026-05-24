import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DEEPSEEK_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경 변수에 등록해 주세요.' 
        },
        { status: 400 }
      )
    }

    const { messages, mode } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: '유효한 대화 내용(messages)이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 1. 모델명 결정
    let modelName = 'deepseek-v4-flash' // Fast 기본값 (DeepSeek V4 최신 패밀리)
    if (mode === 'pro') {
      modelName = 'deepseek-v4-pro' // Pro 추론 모델 (DeepSeek V4 최신 패밀리)
    }

    // 2. 대화 기록 정규화 (이전 reasoning_content 필드를 소거하여 API 400 에러 호환성 보장)
    const normalizedMessages = messages.map((m: any) => {
      return {
        role: m.role,
        content: m.content
      }
    })

    // 3. API 요청 파라미터 구성
    const apiPayload: any = {
      model: modelName,
      messages: normalizedMessages,
    }

    // 4. 최신 V4 모델 스펙에 맞게 thinking 및 reasoning_effort 설정
    if (mode === 'pro') {
      apiPayload.thinking = {
        type: 'enabled'
      }
      apiPayload.reasoning_effort = 'high' // Pro 모드 전용 깊이 있는 사고 추론 설정 (high/max 지원)
    } else {
      apiPayload.thinking = {
        type: 'disabled'
      }
      apiPayload.temperature = 0.7 // Fast 모드 샘플링 설정 (Pro는 temperature 무시됨)
    }

    // 4. DeepSeek API 호출
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(apiPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('DeepSeek API Error Output:', data)
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.message || `DeepSeek API 응답 에러 (Status: ${response.status})` 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      choices: data.choices
    })

  } catch (error: any) {
    console.error('Next.js AI Route Handler Exception:', error)
    return NextResponse.json(
      { success: false, error: error.message || '서버 내부 통신 예외 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

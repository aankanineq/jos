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
    let modelName = 'deepseek-chat' // Fast 기본값
    if (mode === 'pro') {
      modelName = 'deepseek-reasoner' // Pro 추론 모델
    }

    // 2. 대화 기록 정규화 (deepseek-reasoner의 400 에러를 유발하는 이전 reasoning_content 필드 완전 소거)
    const normalizedMessages = messages.map((m: any) => {
      // API 전송 시에는 오직 role과 content만 가도록 정제하여 호환성 보장
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

    // deepseek-reasoner 모델은 temperature 등의 샘플링 파라미터를 지원하지 않으므로 fast 모드일 때만 기입
    if (mode !== 'pro') {
      apiPayload.temperature = 0.7
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

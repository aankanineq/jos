import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkoutEntry } from '@/lib/types'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ type: string }> }
) {
  const params = await props.params
  const type = params.type

  if (type !== 'markdown') {
    return NextResponse.json({ error: 'Only Markdown export is supported.' }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const monthsParam = searchParams.get('months') || 'all'
  const typesParam = searchParams.get('types') || 'all'

  const supabase = await createClient()

  // Get user to verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all workouts for the authenticated user
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('workout_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let workouts = data as WorkoutEntry[]

  // 1. Filter by selected months
  if (monthsParam !== 'all') {
    const selectedMonths = monthsParam.split(',').map(m => m.trim())
    workouts = workouts.filter(w => {
      const wMonth = w.workout_date.substring(0, 7) // 'YYYY-MM'
      return selectedMonths.includes(wMonth)
    })
  }

  // 2. Filter by selected workout types
  if (typesParam !== 'all') {
    const selectedTypes = typesParam.split(',').map(t => t.trim().toLowerCase())
    workouts = workouts.filter(w => selectedTypes.includes(w.type.toLowerCase()))
  }

  // 3. Format the Markdown content
  let mdContent = `# JOS 운동 로그 백업 🏃‍♂️\n\n`
  mdContent += `> 본 문서는 **JOS Workout Calendar**에서 내보낸 운동 기록 백업 파일입니다.\n\n`
  mdContent += `### 📅 백업 메타데이터\n`
  mdContent += `- **백업 일시**: ${format(new Date(), 'yyyy년 MM월 dd일 HH시 mm분 ss초')}\n`
  mdContent += `- **선택 기간**: ${monthsParam === 'all' ? '전체 기간' : monthsParam.split(',').join(', ')}\n`
  mdContent += `- **선택 운동 종류**: ${typesParam === 'all' ? '전체 운동' : typesParam.split(',').join(', ')}\n`
  mdContent += `- **총 기록 개수**: ${workouts.length}개\n\n`
  mdContent += `---\n\n`

  if (workouts.length === 0) {
    mdContent += `*선택한 필터 조건에 해당하는 운동 로그가 존재하지 않습니다.*\n`
  } else {
    workouts.forEach(w => {
      mdContent += `## 🗓️ [${w.workout_date}] ${w.type}\n`
      
      const details: string[] = []
      
      if (w.status !== 'completed') {
        const statusMap = { planned: '예정됨', skipped: '건너뜀', completed: '완료됨' }
        details.push(`**상태**: ${statusMap[w.status] || w.status}`)
      }
      
      if (w.type === 'Running') {
        const parts: string[] = []
        if (w.running_distance_km) {
          parts.push(`${w.running_distance_km}km`)
        }
        if (w.running_duration_sec) {
          const mins = Math.floor(w.running_duration_sec / 60)
          const secs = w.running_duration_sec % 60
          parts.push(secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`)
        }
        if (w.running_pace_sec_per_km) {
          const paceMins = Math.floor(w.running_pace_sec_per_km / 60)
          const paceSecs = w.running_pace_sec_per_km % 60
          const paceSecsStr = paceSecs.toString().padStart(2, '0')
          parts.push(`페이스 ${paceMins}'${paceSecsStr}"/km`)
        }
        if (w.running_intensity && w.running_intensity !== 'unknown') {
          const intensityMap = {
            easy: '조깅/이지런',
            long: '장거리/롱런',
            tempo: '템포런',
            interval: '인터벌',
            race: '대회 페이스',
            unknown: '기타'
          }
          parts.push(intensityMap[w.running_intensity] || w.running_intensity)
        }
        if (parts.length > 0) {
          details.push(`**러닝 기록**: ${parts.join(' / ')}`)
        }
      }

      if (details.length > 0) {
        details.forEach(detail => {
          mdContent += `- ${detail}\n`
        })
        mdContent += `\n`
      }

      if (w.markdown) {
        mdContent += `${w.markdown}\n`
      }
      
      mdContent += `\n---\n\n`
    })
  }

  const currentDateStr = format(new Date(), 'yyyyMMdd')
  const filename = `workout-backup-${currentDateStr}.md`

  return new NextResponse(mdContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

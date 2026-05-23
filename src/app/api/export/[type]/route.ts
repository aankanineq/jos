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
      mdContent += `## ${w.workout_date} ${w.type}\n`
      mdContent += `status: ${w.status}\n`
      if (w.title) {
        mdContent += `title: ${w.title}\n`
      }
      if (w.type === 'Running') {
        if (w.running_distance_km) {
          mdContent += `running_distance_km: ${w.running_distance_km}\n`
        }
        if (w.running_duration_sec) {
          const h = Math.floor(w.running_duration_sec / 3600)
          const m = Math.floor((w.running_duration_sec % 3600) / 60)
          const s = w.running_duration_sec % 60
          const durationStr = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
          mdContent += `duration: ${durationStr}\n`
        }
      }
      if (w.markdown) {
        mdContent += `memo: ${w.markdown.replace(/\r?\n/g, ' ')}\n`
      }
      if (w.notes) {
        mdContent += `notes: ${w.notes.replace(/\r?\n/g, ' ')}\n`
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ParsedWorkout {
  workout_date: string
  type: string
  status: string
  title: string | null
  markdown: string
  running_distance_km: number | null
  running_duration_sec: number | null
  running_pace_sec_per_km: number | null
  running_intensity: string | null
  notes: string | null
  lineNum: number
  invalidDurationFormat?: string | null
}

function parseMarkdownWorkouts(text: string): ParsedWorkout[] {
  const lines = text.split(/\r?\n/)
  const parsedWorkouts: ParsedWorkout[] = []
  let currentWorkout: ParsedWorkout | null = null
  let capturingMarkdown = false

  // Regex to match header: e.g. ## 2026-05-21 Running or ## [2026-05-21] Running or ## 🗓️ [2026-05-21] Running
  const headerRegex = /^##\s+(?:🗓️\s+)?\[?(\d{4}-\d{2}-\d{2})\]?\s+([A-Za-z가-힣]+)/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headerMatch = line.match(headerRegex)

    if (headerMatch) {
      if (currentWorkout) {
        parsedWorkouts.push(currentWorkout)
      }

      const date = headerMatch[1]
      const typeRaw = headerMatch[2]

      // Map Korean type or standard casing type
      let type: string = typeRaw
      const typeMap: Record<string, string> = {
        '풀': 'Pull', 'pull': 'Pull', 'Pull': 'Pull',
        '푸쉬': 'Push', 'push': 'Push', 'Push': 'Push',
        '레그': 'Leg', 'leg': 'Leg', 'Leg': 'Leg',
        '러닝': 'Running', 'running': 'Running', 'Running': 'Running',
        '테니스': 'Tennis', 'tennis': 'Tennis', 'Tennis': 'Tennis',
        '전신': 'Full', 'full': 'Full', 'Full': 'Full',
        '휴식': 'Rest', 'rest': 'Rest', 'Rest': 'Rest',
        '기타': 'Other', 'other': 'Other', 'Other': 'Other'
      }

      if (typeMap[typeRaw]) {
        type = typeMap[typeRaw]
      } else {
        // Fallback: capitalize first character
        type = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase()
      }

      currentWorkout = {
        workout_date: date,
        type: type,
        status: 'completed', // default status
        title: null,
        markdown: '',
        running_distance_km: null,
        running_duration_sec: null,
        running_pace_sec_per_km: null,
        running_intensity: null,
        notes: null,
        lineNum: i + 1,
        invalidDurationFormat: null
      }
      capturingMarkdown = false
    } else if (currentWorkout) {
      if (!capturingMarkdown) {
        const trimmed = line.trim()

        if (trimmed === '' || trimmed === '---') {
          // A blank line or separator after properties marks transition to markdown content
          const propertyMatch = trimmed.match(/^([a-z_]+)\s*:\s*(.+)$/)
          if (!propertyMatch && trimmed !== '') {
            if (trimmed !== '---') {
              capturingMarkdown = true
              currentWorkout.markdown += line + '\n'
            }
          }
          continue
        }

        // Try to match property: e.g. "status: completed"
        const propertyMatch = line.match(/^\s*([a-z_]+)\s*:\s*(.+)$/)
        if (propertyMatch) {
          const key = propertyMatch[1].trim()
          let value = propertyMatch[2].trim()

          // Strip any markdown bold/italic symbols if user wrote them (e.g. **completed**)
          value = value.replace(/[\*_]/g, '')

          if (key === 'status') {
            // Map "complete" to "completed" for standard database compatibility
            currentWorkout.status = value === 'complete' ? 'completed' : value
          } else if (key === 'running_distance_km') {
            currentWorkout.running_distance_km = Number(value)
          } else if (key === 'duration' || key === 'running_duration' || key === 'running_duration_sec') {
            // Parse duration format H:MM:SS or HH:MM:SS (always require all 3 fields)
            const durationRegex = /^(\d{1,2}):(\d{2}):(\d{2})$/
            const match = value.match(durationRegex)
            if (match) {
              const h = parseInt(match[1], 10)
              const m = parseInt(match[2], 10)
              const s = parseInt(match[3], 10)
              currentWorkout.running_duration_sec = h * 3600 + m * 60 + s
            } else {
              // Store invalid text value for detailed error report
              currentWorkout.invalidDurationFormat = value
            }
          } else if (key === 'running_intensity') {
            currentWorkout.running_intensity = value
          } else if (key === 'title') {
            currentWorkout.title = value
          } else if (key === 'notes') {
            currentWorkout.notes = value
          } else if (key === 'running_pace_sec_per_km') {
            // Explicitly ignore pace as an input as it is calculated automatically
            continue
          } else {
            // Unknown property, treat as start of markdown body
            capturingMarkdown = true
            currentWorkout.markdown += line + '\n'
          }
        } else {
          capturingMarkdown = true
          currentWorkout.markdown += line + '\n'
        }
      } else {
        if (line.trim() !== '---') {
          currentWorkout.markdown += line + '\n'
        }
      }
    }
  }

  if (currentWorkout) {
    parsedWorkouts.push(currentWorkout)
  }

  // Trim final markdown strings and auto-calculate pace
  parsedWorkouts.forEach(w => {
    w.markdown = w.markdown.trim()
    
    // Auto-calculate pace: Pace = Duration (seconds) / Distance (km)
    if (w.type === 'Running' && w.running_distance_km && w.running_duration_sec) {
      w.running_pace_sec_per_km = Math.round(w.running_duration_sec / w.running_distance_km)
    }
  })

  return parsedWorkouts
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { markdown?: string }
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const { markdown } = body
  if (!markdown || typeof markdown !== 'string') {
    return NextResponse.json({ error: 'Markdown text is required' }, { status: 400 })
  }

  const parsedWorkouts = parseMarkdownWorkouts(markdown)
  if (parsedWorkouts.length === 0) {
    return NextResponse.json({
      success: false,
      message: '마크다운 내에서 운동 헤더(## YYYY-MM-DD Type)를 찾지 못했습니다.',
      totalParsed: 0,
      upsertedCount: 0,
      errors: ['운동 기록 헤더 형식을 찾을 수 없습니다. 예: "## 2026-05-21 Running"']
    }, { status: 400 })
  }

  let successCount = 0
  const errors: string[] = []

  const validTypes = ['Pull', 'Push', 'Leg', 'Running', 'Full', 'Tennis', 'Rest', 'Other']
  const validStatuses = ['planned', 'completed'] // Require complete or planned only (no skipped)
  const validIntensities = ['easy', 'long', 'tempo', 'interval', 'race', 'unknown']

  for (const pw of parsedWorkouts) {
    // 1. Validate Date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pw.workout_date)) {
      errors.push(`라인 ${pw.lineNum}: 올바르지 않은 날짜 형식입니다. (${pw.workout_date})`)
      continue
    }

    // 2. Validate Type
    if (!validTypes.includes(pw.type)) {
      errors.push(`라인 ${pw.lineNum}: 알 수 없는 운동 유형입니다. (${pw.type})`)
      continue
    }

    // 3. Validate Running specific conditions
    if (pw.type === 'Running') {
      if (pw.invalidDurationFormat) {
        errors.push(`라인 ${pw.lineNum}: 러닝 전체 시간(duration) 형식이 올바르지 않습니다. 생략 없이 반드시 H:MM:SS 형식이어야 합니다. (입력값: "${pw.invalidDurationFormat}")`)
        continue
      }
      
      // Require both distance and duration if one is supplied
      if (pw.running_distance_km && !pw.running_duration_sec) {
        errors.push(`라인 ${pw.lineNum}: 러닝 거리는 있으나 시간(duration: H:MM:SS)이 누락되었습니다.`)
        continue
      }
      if (pw.running_duration_sec && !pw.running_distance_km) {
        errors.push(`라인 ${pw.lineNum}: 러닝 시간은 있으나 거리(running_distance_km)가 누락되었습니다.`)
        continue
      }
    }

    // 4. Validate Status (Planned or Completed only)
    if (!validStatuses.includes(pw.status)) {
      errors.push(`라인 ${pw.lineNum}: 알 수 없는 상태값입니다. ("complete" 또는 "planned"만 허용됩니다. 입력값: "${pw.status}")`)
      continue
    }

    // 5. Validate Running Intensity
    if (pw.running_intensity && !validIntensities.includes(pw.running_intensity)) {
      errors.push(`라인 ${pw.lineNum}: 알 수 없는 러닝 강도입니다. (${pw.running_intensity})`)
      continue
    }

    try {
      // Check if this user already has this workout type on this date
      const { data: existing, error: fetchError } = await supabase
        .from('workouts')
        .select('id')
        .eq('workout_date', pw.workout_date)
        .eq('type', pw.type)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) {
        errors.push(`라인 ${pw.lineNum}: 기존 기록 조회 중 오류 - ${fetchError.message}`)
        continue
      }

      const payload = {
        workout_date: pw.workout_date,
        type: pw.type,
        status: pw.status,
        title: pw.title,
        markdown: pw.markdown,
        running_distance_km: pw.running_distance_km,
        running_duration_sec: pw.running_duration_sec,
        running_pace_sec_per_km: pw.running_pace_sec_per_km,
        running_intensity: pw.running_intensity,
        notes: pw.notes,
      }

      if (existing) {
        // OVERWRITE existing record (Upsert Update)
        const { error: updateError } = await supabase
          .from('workouts')
          .update(payload)
          .eq('id', existing.id)

        if (updateError) {
          errors.push(`라인 ${pw.lineNum}: 기록 업데이트 실패 - ${updateError.message}`)
        } else {
          successCount++
        }
      } else {
        // CREATE new record (Upsert Insert)
        const { error: insertError } = await supabase
          .from('workouts')
          .insert([{
            ...payload,
            user_id: user.id
          }])

        if (insertError) {
          errors.push(`라인 ${pw.lineNum}: 기록 추가 실패 - ${insertError.message}`)
        } else {
          successCount++
        }
      }
    } catch (err: any) {
      errors.push(`라인 ${pw.lineNum}: 시스템 오류 - ${err.message || err}`)
    }
  }

  // If we successfully added/updated anything, clear Next.js path caches
  if (successCount > 0) {
    revalidatePath('/')
    revalidatePath('/workouts')
    revalidatePath('/calendar')
    revalidatePath('/stats')
  }

  return NextResponse.json({
    success: true,
    totalParsed: parsedWorkouts.length,
    upsertedCount: successCount,
    errors: errors
  })
}

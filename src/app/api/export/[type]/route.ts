import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkoutEntry } from '@/lib/types'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ type: string }> }
) {
  const params = await props.params
  const type = params.type // 'json' or 'markdown'
  
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month') // e.g., '2026-05'

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month format. Expected YYYY-MM.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get user to verify authentication (handled partly by RLS, but let's be safe)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startDate = `${month}-01`
  const endDate = `${month}-31`

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .gte('workout_date', startDate)
    .lte('workout_date', endDate)
    .order('workout_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const workouts = data as WorkoutEntry[]

  if (type === 'json') {
    const exportData = {
      month,
      workouts,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="workout-${month}.json"`,
      },
    })
  }

  if (type === 'markdown') {
    let mdContent = `# ${month} 운동 로그\n\n`

    workouts.forEach(w => {
      mdContent += `## ${w.workout_date} ${w.type}\n`
      
      if (w.status !== 'completed') {
        mdContent += `상태: ${w.status}\n`
      }
      
      if (w.type === 'Running') {
        const distance = w.running_distance_km ? `${w.running_distance_km}km` : ''
        const intensity = w.running_intensity && w.running_intensity !== 'unknown' ? ` (${w.running_intensity})` : ''
        if (distance) {
          mdContent += `${distance}${intensity}\n`
        }
      }

      if (w.markdown) {
        mdContent += `${w.markdown}\n`
      }
      
      mdContent += '\n'
    })

    return new NextResponse(mdContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="workout-${month}.md"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid export type. Use json or markdown.' }, { status: 400 })
}

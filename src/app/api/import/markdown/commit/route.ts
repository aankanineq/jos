import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateWorkoutPayload } from '@/lib/workouts/validation'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { workouts?: any[] }
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const { workouts } = body
  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    return NextResponse.json({ error: 'Workouts array is required and cannot be empty' }, { status: 400 })
  }

  const insertPayloads: any[] = []
  const errors: string[] = []

  // Re-validate each workout payload before DB insertion to ensure absolute integrity
  for (let i = 0; i < workouts.length; i++) {
    const w = workouts[i]
    const sharedVal = validateWorkoutPayload(w)
    if (!sharedVal.isValid) {
      errors.push(`기록 #${i + 1} (${w.workout_date} ${w.type}): ${sharedVal.errors.join(', ')}`)
    } else {
      insertPayloads.push({
        workout_date: w.workout_date,
        type: w.type,
        status: w.status,
        title: w.title || null,
        markdown: w.markdown || '',
        notes: w.notes || null,
        running_distance_km: w.running_distance_km || null,
        running_duration_sec: w.running_duration_sec || null,
        running_pace_sec_per_km: w.running_pace_sec_per_km || null,
        running_intensity: w.running_intensity || null,
        user_id: user.id
      })
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({
      success: false,
      message: '일부 기록에 유효성 오류가 존재합니다. 저장이 차단되었습니다.',
      errors
    }, { status: 400 })
  }

  // Insert the approved workouts directly into the database (no unique key constraint check, always Insert)
  const { data, error: insertError } = await supabase
    .from('workouts')
    .insert(insertPayloads)
    .select('id')

  if (insertError) {
    return NextResponse.json({
      success: false,
      message: '데이터베이스에 기록을 저장하는 도중 오류가 발생했습니다.',
      errors: [insertError.message]
    }, { status: 500 })
  }

  // Revalidate page caches to reflect the newly inserted workouts
  revalidatePath('/')
  revalidatePath('/workouts')
  revalidatePath('/calendar')
  revalidatePath('/stats')

  return NextResponse.json({
    success: true,
    count: data ? data.length : insertPayloads.length
  })
}

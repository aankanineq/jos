'use server'

import { createClient } from '@/lib/supabase/server'
import { WorkoutType } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { DEFAULT_PRESETS } from '@/lib/workouts/exercise-presets'

// 결정론적 해시 함수
function stableHash(str: string): string {
  let hash = 0
  const cleanStr = str.trim().toLowerCase().replace(/\s+/g, '')
  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}

export async function addDbPresetAction(type: WorkoutType, name: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('인증되지 않은 사용자입니다.')

  const normalizedName = name.trim()
  if (!normalizedName) throw new Error('이름이 비어있습니다.')

  const key = `custom_${stableHash(normalizedName)}`

  const { error } = await supabase
    .from('exercise_presets')
    .insert({
      user_id: user.id,
      exercise_type: type,
      exercise_key: key,
      exercise_name: normalizedName
    })

  if (error) {
    if (error.code === '23505') { // Unique constraint violation (duplicate key per user)
      throw new Error('이미 존재하는 종목명 또는 키입니다.')
    }
    console.error('Error inserting preset into db:', error)
    throw new Error('프리셋 추가 중 오류가 발생했습니다.')
  }

  revalidatePath('/gym')
  revalidatePath('/workouts/new')
  revalidatePath('/workouts/[id]/edit')
}

export async function deleteDbPresetAction(type: WorkoutType, key: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('인증되지 않은 사용자입니다.')

  const { error } = await supabase
    .from('exercise_presets')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_type', type)
    .eq('exercise_key', key)

  if (error) {
    console.error('Error deleting preset from db:', error)
    throw new Error('프리셋 삭제 중 오류가 발생했습니다.')
  }

  revalidatePath('/gym')
  revalidatePath('/workouts/new')
  revalidatePath('/workouts/[id]/edit')
}

export async function resetDbPresetsAction() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('인증되지 않은 사용자입니다.')

  // 1. Delete all user presets in db
  const { error: delError } = await supabase
    .from('exercise_presets')
    .delete()
    .eq('user_id', user.id)

  if (delError) {
    console.error('Error clearing presets for reset in db:', delError)
    throw new Error('프리셋 복원 중 오류가 발생했습니다.')
  }

  // 2. Seed defaults to db
  const rowsToSeed = []
  for (const [type, list] of Object.entries(DEFAULT_PRESETS)) {
    for (const item of list) {
      rowsToSeed.push({
        user_id: user.id,
        exercise_type: type,
        exercise_key: item.key,
        exercise_name: item.name
      })
    }
  }

  const { error: seedError } = await supabase
    .from('exercise_presets')
    .insert(rowsToSeed)

  if (seedError) {
    console.error('Error seeding defaults on reset in db:', seedError)
    throw new Error('기본 프리셋 데이터 등록 중 오류가 발생했습니다.')
  }

  revalidatePath('/gym')
  revalidatePath('/workouts/new')
  revalidatePath('/workouts/[id]/edit')
}

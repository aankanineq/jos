import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateWorkoutPayload } from '@/lib/workouts/validation'

interface PreviewBlock {
  blockIndex: number
  lineNum: number
  type: 'valid' | 'invalid' | 'warning'
  workout: any
  errors: string[]
  warnings: string[]
}

function splitBlocks(text: string): { blockText: string; lineStart: number }[] {
  const lines = text.split(/\r?\n/)
  const blocks: { blockText: string; lineStart: number }[] = []
  let currentBlockLines: string[] = []
  let currentBlockStartLine = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '---') {
      if (currentBlockLines.length > 0) {
        blocks.push({
          blockText: currentBlockLines.join('\n'),
          lineStart: currentBlockStartLine
        })
        currentBlockLines = []
      }
      currentBlockStartLine = i + 2
    } else {
      if (currentBlockLines.length === 0) {
        currentBlockStartLine = i + 1
      }
      currentBlockLines.push(line)
    }
  }

  if (currentBlockLines.length > 0) {
    blocks.push({
      blockText: currentBlockLines.join('\n'),
      lineStart: currentBlockStartLine
    })
  }

  return blocks.filter(b => b.blockText.trim().length > 0)
}

function parseBlock(blockText: string, lineStart: number, blockIndex: number): PreviewBlock {
  const lines = blockText.split('\n')
  const errors: string[] = []
  const warnings: string[] = []

  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    return {
      blockIndex,
      lineNum: lineStart,
      type: 'invalid',
      workout: null,
      errors: ['운동 기록 헤더를 찾을 수 없습니다.'],
      warnings: []
    }
  }

  const headerLine = lines[headerIndex].trim()
  const headerRegex = /^##\s+(\d{4}-\d{2}-\d{2})\s+(Running|Pull|Push|Leg|Full|Tennis|Rest|Other)$/
  const headerMatch = headerLine.match(headerRegex)

  if (!headerMatch) {
    return {
      blockIndex,
      lineNum: lineStart + headerIndex,
      type: 'invalid',
      workout: null,
      errors: [`헤더 규격 '## YYYY-MM-DD WorkoutType'을 지키지 않았거나 지원하지 않는 유형/날짜 형식입니다. (입력값: "${headerLine}")`],
      warnings: []
    }
  }

  const workout_date = headerMatch[1]
  const workoutType = headerMatch[2]

  let inMetadata = true
  let markdown = ''
  const metadata: Record<string, string> = {}

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (inMetadata) {
      if (line.trim() === '') {
        inMetadata = false
        continue
      }

      const propertyMatch = line.match(/^\s*([a-zA-Z0-9_-]+)\s*:\s*(.*)$/)
      if (propertyMatch) {
        const key = propertyMatch[1].trim()
        const value = propertyMatch[2].trim()
        metadata[key] = value
      } else {
        inMetadata = false
        markdown += line + '\n'
      }
    } else {
      markdown += line + '\n'
    }
  }

  // Define supported & forbidden keys
  const supportedKeys = ['status', 'title', 'running_distance_km', 'duration', 'running_intensity', 'notes']
  const forbiddenKeys = ['running_duration_sec', 'running_pace_sec_per_km']

  const status = metadata['status'] || ''
  const title = metadata['title'] || null
  let running_distance_km: number | null = null
  let running_duration_sec: number | null = null
  const running_intensity = metadata['running_intensity'] || null
  const notes = metadata['notes'] || null

  // Check metadata keys syntax
  for (const key of Object.keys(metadata)) {
    if (forbiddenKeys.includes(key)) {
      errors.push(`금지된 key '${key}'가 사용되었습니다. (시간은 'duration: H:MM:SS' 형식을 써야 하며 페이스는 직접 기입할 수 없습니다.)`)
    } else if (!supportedKeys.includes(key)) {
      warnings.push(`지원하지 않는 key '${key}'는 무시되었습니다.`)
    }
  }

  // Validate non-running workout fields
  const runningKeys = ['running_distance_km', 'duration', 'running_intensity']
  if (workoutType !== 'Running') {
    for (const rKey of runningKeys) {
      if (metadata[rKey] !== undefined) {
        errors.push(`러닝이 아닌 운동(${workoutType})에는 러닝 관련 필드(${rKey})를 기입할 수 없습니다.`)
      }
    }
  }

  // Parse duration if Running
  if (workoutType === 'Running' && metadata['duration'] !== undefined) {
    const durationVal = metadata['duration']
    const durationRegex = /^(\d{1,2}):(\d{2}):(\d{2})$/
    const durationMatch = durationVal.match(durationRegex)
    if (durationMatch) {
      const h = parseInt(durationMatch[1], 10)
      const m = parseInt(durationMatch[2], 10)
      const s = parseInt(durationMatch[3], 10)
      running_duration_sec = h * 3600 + m * 60 + s
    } else {
      errors.push(`duration 형식은 반드시 'H:MM:SS' 형식이어야 합니다. (입력값: "${durationVal}")`)
    }
  }

  if (workoutType === 'Running' && metadata['running_distance_km'] !== undefined) {
    const distVal = metadata['running_distance_km']
    const parsedDist = Number(distVal)
    if (isNaN(parsedDist)) {
      errors.push(`running_distance_km 값은 숫자여야 합니다. (입력값: "${distVal}")`)
    } else {
      running_distance_km = parsedDist
    }
  }

  // Build payload for common validator
  const payload = {
    workout_date,
    type: workoutType,
    status,
    markdown: markdown.trim(),
    running_distance_km,
    running_duration_sec,
    running_intensity,
    notes,
  }

  // Run common validator
  const sharedVal = validateWorkoutPayload(payload)
  if (!sharedVal.isValid) {
    errors.push(...sharedVal.errors)
  }

  // Compute pace for preview block
  let running_pace_sec_per_km: number | null = null
  if (workoutType === 'Running' && running_distance_km && running_duration_sec) {
    running_pace_sec_per_km = Math.round(running_duration_sec / running_distance_km)
  }

  const finalWorkout = {
    workout_date,
    type: workoutType,
    status,
    title,
    markdown: markdown.trim(),
    notes,
    running_distance_km,
    running_duration_sec,
    running_pace_sec_per_km,
    running_intensity,
  }

  let finalType: 'valid' | 'invalid' | 'warning' = 'valid'
  if (errors.length > 0) {
    finalType = 'invalid'
  } else if (warnings.length > 0) {
    finalType = 'warning'
  }

  return {
    blockIndex,
    lineNum: lineStart + headerIndex,
    type: finalType,
    workout: finalWorkout,
    errors,
    warnings
  }
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

  const blocksRaw = splitBlocks(markdown)
  if (blocksRaw.length === 0) {
    return NextResponse.json({
      success: false,
      message: '가져올 마크다운에서 유효한 운동 블록을 찾지 못했습니다.',
      blocks: []
    }, { status: 400 })
  }

  const previewBlocks: PreviewBlock[] = []
  for (let i = 0; i < blocksRaw.length; i++) {
    const { blockText, lineStart } = blocksRaw[i]
    const blockPreview = parseBlock(blockText, lineStart, i)
    previewBlocks.push(blockPreview)
  }

  const totalCount = previewBlocks.length
  const validCount = previewBlocks.filter(b => b.type === 'valid').length
  const warningCount = previewBlocks.filter(b => b.type === 'warning').length
  const invalidCount = previewBlocks.filter(b => b.type === 'invalid').length

  return NextResponse.json({
    success: true,
    stats: {
      totalCount,
      validCount,
      warningCount,
      invalidCount
    },
    blocks: previewBlocks
  })
}

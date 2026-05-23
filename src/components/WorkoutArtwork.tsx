'use client'

import { WorkoutType, WorkoutStatus } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  type: WorkoutType | string
  status?: WorkoutStatus
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// Map workout types to highly distinct pastel themes (with richer contrast and deeper colors)
const artworkThemes: Record<string, { bg: string; text: string; label: string }> = {
  Running: { bg: '#fee2e2', text: '#991b1b', label: 'RUN' },
  Pull: { bg: '#ccfbf1', text: '#115e59', label: 'PULL' },
  Push: { bg: '#fef08a', text: '#854d0e', label: 'PUSH' },
  Leg: { bg: '#f3e8ff', text: '#6b21a8', label: 'LEG' },
  Full: { bg: '#dbeafe', text: '#1e40af', label: 'FULL' },
  Rest: { bg: '#e0e7ff', text: '#3730a3', label: 'REST' },
  Tennis: { bg: '#dcfce7', text: '#166534', label: 'TENNIS' },
  Other: { bg: '#f1f5f9', text: '#334155', label: 'OTHER' },
  'Shoulder, Arm': { bg: '#e0f2fe', text: '#0369a1', label: 'ARM' },
  'Shoulder, arm': { bg: '#e0f2fe', text: '#0369a1', label: 'ARM' },
}

export default function WorkoutArtwork({ type, status = 'completed', size = 'md', className }: Props) {
  const normType = (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) as WorkoutType | string

  // Size classes for outer containers
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  }

  // Get theme based on normalized type
  const theme = artworkThemes[normType] || {
    bg: '#f1f5f9',
    text: '#334155',
    label: type.trim().toUpperCase() === 'RUNNING' ? 'RUN' : type.trim().toUpperCase()
  }

  // Dynamic font sizing based on label length to prevent overflow inside circle (made larger and bolder)
  const label = theme.label
  let fontSize = '28px'
  if (label.length <= 3) {
    fontSize = '35px'
  } else if (label.length === 4) {
    fontSize = '30px'
  } else if (label.length === 5) {
    fontSize = '25px'
  } else {
    fontSize = '20px'
  }

  return (
    <div className={clsx('relative inline-block shrink-0 select-none transition-transform hover:scale-105 duration-300', sizeMap[size], className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_5px_rgba(15,23,42,0.06)]"
      >
        {/* Typographical Circular Badge - Ultra-minimal borderless */}
        <circle cx="50" cy="50" r="48" fill={theme.bg} />
        
        {/* Bold Modern Text Centerpiece */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.text}
          fontSize={fontSize}
          fontWeight="900"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Outfit', 'Inter', sans-serif"
          letterSpacing="0.03em"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}


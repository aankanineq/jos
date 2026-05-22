'use client'

import { WorkoutType, WorkoutStatus } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  type: WorkoutType | string
  status?: WorkoutStatus
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

// Map workout types to highly distinct pastel themes (with clear contrast)
const artworkThemes: Record<string, { bg: string; text: string; label: string }> = {
  Running: { bg: '#fef2f2', text: '#dc2626', label: 'RUN' },
  Pull: { bg: '#f0fdfa', text: '#0d9488', label: 'PULL' },
  Push: { bg: '#fefbeb', text: '#d97706', label: 'PUSH' },
  Leg: { bg: '#faf5ff', text: '#7e22ce', label: 'LEG' },
  Full: { bg: '#eff6ff', text: '#1d4ed8', label: 'FULL' },
  Rest: { bg: '#f5f3ff', text: '#4338ca', label: 'REST' },
  Tennis: { bg: '#f0fdf4', text: '#16a34a', label: 'TENNIS' },
  Other: { bg: '#f8fafc', text: '#475569', label: 'OTHER' },
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
    bg: '#f8fafc',
    text: '#475569',
    label: type.trim().toUpperCase() === 'RUNNING' ? 'RUN' : type.trim().toUpperCase()
  }

  // Ring styling based on status (flat, clean, ultra-minimalist)
  const renderStatusRing = () => {
    if (status === 'completed') {
      return (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )
    } else if (status === 'planned') {
      return (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      )
    } else {
      // skipped
      return (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
      )
    }
  }

  // Dynamic font sizing based on label length to prevent overflow inside circle
  const label = theme.label
  let fontSize = '24px'
  if (label.length <= 3) {
    fontSize = '28px'
  } else if (label.length === 4) {
    fontSize = '24px'
  } else if (label.length === 5) {
    fontSize = '20px'
  } else {
    fontSize = '16px'
  }

  return (
    <div className={clsx('relative inline-block shrink-0 select-none transition-transform hover:scale-105 duration-300', sizeMap[size], className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_5px_rgba(15,23,42,0.06)]"
      >
        {/* Typographical Circular Badge */}
        <circle cx="50" cy="50" r="45" fill={theme.bg} />
        
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

        {/* Outer Ring Gauge for Status */}
        {renderStatusRing()}
      </svg>
    </div>
  )
}


'use client'

import { WorkoutType, WorkoutStatus } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  type: WorkoutType | string
  status?: WorkoutStatus
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
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

  // Ring styling based on status
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
          filter="drop-shadow(0px 0px 3px rgba(16,185,129,0.6))"
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
          strokeDasharray="6 4"
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
          stroke="#71717a"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
      )
    }
  }

  // Vector landscapes based on Workout Type
  const renderLandscape = () => {
    switch (normType) {
      case 'Running':
        return (
          <>
            <defs>
              <linearGradient id="grad-running" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-running)" />
            {/* Setting glowing sun */}
            <circle cx="50" cy="46" r="15" fill="#fef08a" opacity="0.9" />
            {/* Mountain silhouttes */}
            <polygon points="5,68 35,46 65,68" fill="#4c1d95" opacity="0.45" />
            <polygon points="35,68 62,38 95,68" fill="#312e81" opacity="0.6" />
            {/* Curved landscape road */}
            <path d="M 15,90 Q 50,46 85,90" fill="none" stroke="#1e1b4b" strokeWidth="8" strokeLinecap="round" />
            {/* Center yellow road dash */}
            <path d="M 28,80 Q 50,56 72,80" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" />
          </>
        )

      case 'Pull':
        return (
          <>
            <defs>
              <linearGradient id="grad-pull" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2fd4bf" />
                <stop offset="50%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#115e59" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-pull)" />
            {/* High rising moon */}
            <circle cx="76" cy="26" r="6" fill="#ccfbf1" opacity="0.9" />
            {/* Steep cliffs and mountain peaks */}
            <polygon points="5,90 40,24 75,90" fill="#115e59" opacity="0.8" />
            <polygon points="35,90 68,36 95,90" fill="#0f766e" />
            <polygon points="5,90 28,54 52,90" fill="#14b8a6" opacity="0.35" />
            {/* Climber route dotted path */}
            <path d="M 40,78 Q 44,55 52,44" fill="none" stroke="#ccfbf1" strokeWidth="1.5" strokeDasharray="2 2" />
            <polygon points="52,41 55,46 49,46" fill="#ccfbf1" />
          </>
        )

      case 'Push':
        return (
          <>
            <defs>
              <linearGradient id="grad-push" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-push)" />
            {/* Intense radiant sun */}
            <circle cx="50" cy="78" r="20" fill="#fef08a" />
            {/* Radiant light beams */}
            <line x1="50" y1="78" x2="20" y2="35" stroke="#fef08a" strokeWidth="2.5" opacity="0.5" />
            <line x1="50" y1="78" x2="50" y2="16" stroke="#fef08a" strokeWidth="2.5" opacity="0.5" />
            <line x1="50" y1="78" x2="80" y2="35" stroke="#fef08a" strokeWidth="2.5" opacity="0.5" />
            <line x1="50" y1="78" x2="14" y2="65" stroke="#fef08a" strokeWidth="2.5" opacity="0.5" />
            <line x1="50" y1="78" x2="86" y2="65" stroke="#fef08a" strokeWidth="2.5" opacity="0.5" />
            {/* Minimal city skyline silhouette */}
            <rect x="22" y="66" width="14" height="24" fill="#7f1d1d" opacity="0.75" />
            <rect x="40" y="52" width="18" height="38" fill="#7f1d1d" />
            <rect x="62" y="62" width="12" height="28" fill="#7f1d1d" opacity="0.6" />
          </>
        )

      case 'Leg':
        return (
          <>
            <defs>
              <linearGradient id="grad-leg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-leg)" />
            {/* Low desert sun */}
            <circle cx="28" cy="48" r="10" fill="#ea580c" opacity="0.75" />
            {/* Desert sand dunes */}
            <path d="M 5,82 Q 30,62 55,84 T 95,74 L 95,90 L 5,90 Z" fill="#9a3412" opacity="0.85" />
            <path d="M 5,90 Q 65,68 95,90 L 95,90 L 5,90 Z" fill="#431407" />
            {/* High stretching desert highway */}
            <polygon points="35,58 38,58 65,90 20,90" fill="#1c1917" opacity="0.45" />
            <line x1="41" y1="58" x2="42.5" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
          </>
        )

      case 'Full':
        return (
          <>
            <defs>
              <linearGradient id="grad-full" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-full)" />
            {/* Soft backdrop sun */}
            <circle cx="50" cy="34" r="12" fill="#a7f3d0" opacity="0.35" />
            {/* Mountain layer range */}
            <polygon points="5,72 32,42 62,72" fill="#065f46" opacity="0.85" />
            <polygon points="32,72 65,34 95,72" fill="#064e3b" />
            {/* Quiet lake water at bottom */}
            <rect x="5" y="70" width="90" height="20" fill="#1e3a8a" opacity="0.45" />
            {/* Water reflections */}
            <line x1="20" y1="76" x2="42" y2="76" stroke="#34d399" strokeWidth="1" opacity="0.6" />
            <line x1="52" y1="82" x2="78" y2="82" stroke="#34d399" strokeWidth="1" opacity="0.6" />
            <line x1="30" y1="86" x2="58" y2="86" stroke="#34d399" strokeWidth="1" opacity="0.4" />
          </>
        )

      case 'Rest':
        return (
          <>
            <defs>
              <linearGradient id="grad-rest" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="50%" stopColor="#4c1d95" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-rest)" />
            {/* Starry night sky dots */}
            <circle cx="24" cy="22" r="0.8" fill="#ffffff" />
            <circle cx="68" cy="18" r="0.8" fill="#ffffff" opacity="0.85" />
            <circle cx="34" cy="40" r="0.8" fill="#ffffff" opacity="0.6" />
            <circle cx="76" cy="38" r="0.8" fill="#ffffff" />
            <circle cx="18" cy="44" r="0.8" fill="#ffffff" opacity="0.4" />
            {/* Elegant crescent moon */}
            <path
              d="M 44,18 A 14,14 0 1,0 58,32 A 11,11 0 1,1 44,18 Z"
              fill="#e0f2fe"
              filter="drop-shadow(0px 0px 4px rgba(224,242,254,0.65))"
            />
            {/* Quiet lake ripples */}
            <path d="M 12,74 Q 30,72 50,74 T 88,74" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.45" />
            <path d="M 22,81 Q 40,79 60,81 T 78,81" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.3" />
          </>
        )

      case 'Tennis':
        return (
          <>
            <defs>
              <linearGradient id="grad-tennis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-tennis)" />
            {/* Tennis clay court lines */}
            <line x1="8" y1="48" x2="92" y2="48" stroke="#ffffff" strokeWidth="2.2" opacity="0.6" />
            <line x1="48" y1="8" x2="48" y2="92" stroke="#ffffff" strokeWidth="2.2" opacity="0.6" />
            {/* Stylized tennis ball with glowing shade */}
            <circle cx="50" cy="50" r="16" fill="#ccfbf1" filter="drop-shadow(0px 0px 5px rgba(234,179,8,0.7))" />
            <circle cx="50" cy="50" r="15.5" fill="#a3e635" />
            {/* Tennis ball seams */}
            <path d="M 38,44 Q 44,44 44,38" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M 62,56 Q 56,56 56,62" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          </>
        )

      default:
        // Other / Abstract geometric
        return (
          <>
            <defs>
              <linearGradient id="grad-other" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4b5563" />
                <stop offset="50%" stopColor="#374151" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#grad-other)" />
            {/* Minimal geometric patterns */}
            <circle cx="50" cy="50" r="18" fill="none" stroke="#9ca3af" strokeWidth="2.5" opacity="0.4" />
            <rect
              x="36"
              y="36"
              width="28"
              height="28"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="1.5"
              transform="rotate(45 50 50)"
              opacity="0.5"
            />
            <line x1="12" y1="12" x2="88" y2="88" stroke="#9ca3af" strokeWidth="1" opacity="0.25" />
            <line x1="88" y1="12" x2="12" y2="88" stroke="#9ca3af" strokeWidth="1" opacity="0.25" />
          </>
        )
    }
  }

  return (
    <div className={clsx('relative inline-block shrink-0 select-none transition-transform hover:scale-105 duration-300', sizeMap[size], className)}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_5px_rgba(15,23,42,0.08)]"
      >
        {/* Core Landscape Illustration */}
        {renderLandscape()}

        {/* Outer Ring Gauge for Smartwatch Vibe */}
        {renderStatusRing()}
      </svg>
    </div>
  )
}

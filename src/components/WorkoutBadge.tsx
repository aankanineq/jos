import { WorkoutType } from '@/lib/types'
import clsx from 'clsx'

export default function WorkoutBadge({ type, className }: { type: WorkoutType | string; className?: string }) {
  const typeLower = type.toLowerCase()
  return (
    <span
      className={clsx(
        `px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-type-${typeLower}`,
        className
      )}
    >
      {type}
    </span>
  )
}

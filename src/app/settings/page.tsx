import { getWorkouts } from '@/lib/workouts/repository'
import SettingsClient from '@/components/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  let uniqueMonths: string[] = []
  
  try {
    const workouts = await getWorkouts()
    const months = workouts.map(w => w.workout_date.substring(0, 7)) // Extract YYYY-MM
    uniqueMonths = Array.from(new Set(months)).sort((a, b) => b.localeCompare(a))
  } catch (error) {
    console.error('Failed to fetch workout months for settings page:', error)
  }

  return <SettingsClient uniqueMonths={uniqueMonths} />
}

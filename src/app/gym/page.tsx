import { getExercisesHistory, getDbPresets } from '@/lib/workouts/exercises-repository'
import GymClient from '@/components/GymClient'

export const dynamic = 'force-dynamic'

export default async function GymDashboardPage() {
  const history = await getExercisesHistory()
  const presets = await getDbPresets()
  return <GymClient initialHistory={history} initialPresets={presets} />
}

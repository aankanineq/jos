import { getWorkouts } from '@/lib/workouts/repository'
import WorkoutsListClient from '@/components/WorkoutsListClient'

export const dynamic = 'force-dynamic'

export default async function WorkoutsListPage() {
  const workouts = await getWorkouts()

  return <WorkoutsListClient initialWorkouts={workouts} />
}

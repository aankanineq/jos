import { getWorkouts } from '@/lib/workouts/repository'
import RunningClient from '@/components/RunningClient'

export const dynamic = 'force-dynamic'

export default async function RunningQuestPage() {
  const workouts = await getWorkouts()
  
  return <RunningClient initialWorkouts={workouts} />
}

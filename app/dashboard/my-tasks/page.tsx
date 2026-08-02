import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listMyTasks } from '@/services/tasks/my-tasks-service'
import { MyTasksDashboard } from '@/components/tasks/my-tasks-dashboard'

export default async function MyTasksPage() {
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  return <MyTasksDashboard tasks={await listMyTasks(client, result.user.id)} />
}

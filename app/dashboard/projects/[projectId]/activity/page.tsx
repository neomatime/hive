import { createClient } from '@/lib/supabase/server'
import { listProjectActivity } from '@/services/activity/activity-service'
import { ProjectActivityFeed } from '@/components/activity/project-activity-feed'

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const activity = await listProjectActivity(await createClient(), projectId)
  return <ProjectActivityFeed activity={activity} />
}

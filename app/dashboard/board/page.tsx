import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listProjects } from '@/services/projects/project-service'
import { BoardPicker } from '@/components/projects/board-picker'

export default async function BoardPage() {
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  const projects = await listProjects(client, result.user.workspace.id, {
    sortBy: 'name',
    sortDirection: 'asc',
  })
  return <BoardPicker initialProjects={projects} />
}

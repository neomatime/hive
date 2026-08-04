import { createClient } from '@/lib/supabase/server'
import { getProjectBoard } from '@/services/tasks/task-service'
import { listProjectMembers } from '@/services/projects/project-member-service'
import { listFilterPresets } from '@/services/tasks/filter-preset-service'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { KanbanBoard } from '@/components/tasks/kanban-board'
export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const client = await createClient()
  const [board, members, user] = await Promise.all([
    getProjectBoard(client, projectId),
    listProjectMembers(client, projectId),
    getCurrentUserWithMembership(client),
  ])
  if (!board) return <p className="text-muted-foreground">Board unavailable.</p>
  const presets =
    user.status === 'ok' ? await listFilterPresets(client, board.id, user.user.id) : []
  return <KanbanBoard board={board} members={members} presets={presets} />
}

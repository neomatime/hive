import { createClient } from '@/lib/supabase/server'
import { getProjectBoard } from '@/services/tasks/task-service'
import { listProjectMembers } from '@/services/projects/project-member-service'
import { KanbanBoard } from '@/components/tasks/kanban-board'
export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const client = await createClient()
  const [board, members] = await Promise.all([
    getProjectBoard(client, projectId),
    listProjectMembers(client, projectId),
  ])
  return board ? (
    <KanbanBoard board={board} members={members} />
  ) : (
    <p className="text-muted-foreground">Board unavailable.</p>
  )
}

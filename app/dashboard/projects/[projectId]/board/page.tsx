import { createClient } from '@/lib/supabase/server'
import { getProjectBoard } from '@/services/tasks/task-service'
import { KanbanBoard } from '@/components/tasks/kanban-board'
export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const board = await getProjectBoard(await createClient(), projectId)
  return board ? (
    <KanbanBoard board={board} />
  ) : (
    <p className="text-muted-foreground">Board unavailable.</p>
  )
}

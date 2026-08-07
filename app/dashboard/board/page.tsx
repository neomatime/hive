import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listProjects } from '@/services/projects/project-service'
import { listProjectMembers } from '@/services/projects/project-member-service'
import { getProjectBoard } from '@/services/tasks/task-service'
import { listFilterPresets } from '@/services/tasks/filter-preset-service'
import { selectBoardProject } from '@/lib/board/select-board-project'
import { BoardProjectSwitcher } from '@/components/tasks/board-project-switcher'
import { KanbanBoard } from '@/components/tasks/kanban-board'

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const { project: requestedId } = await searchParams
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null

  const projects = await listProjects(client, result.user.workspace.id, {
    sortBy: 'name',
    sortDirection: 'asc',
  })
  const selected = selectBoardProject(projects, requestedId)

  if (!selected) {
    return (
      <div className="space-y-5">
        <div>
          <h1>Board</h1>
          <p className="text-muted-foreground">Track work across a project&apos;s columns.</p>
        </div>
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2>No projects yet</h2>
          <p className="text-muted-foreground">Create a project to get a board.</p>
        </div>
      </div>
    )
  }

  const [board, members] = await Promise.all([
    getProjectBoard(client, selected.id),
    listProjectMembers(client, selected.id),
  ])
  const presets = board ? await listFilterPresets(client, board.id, result.user.id) : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1>Board</h1>
          <p className="font-data text-sm text-muted-foreground">{selected.projectCode}</p>
        </div>
        <BoardProjectSwitcher
          projects={projects.filter((project) => !project.archivedAt)}
          selectedId={selected.id}
        />
      </div>
      {board ? (
        <KanbanBoard board={board} members={members} presets={presets} />
      ) : (
        <p className="text-muted-foreground">Board unavailable.</p>
      )}
    </div>
  )
}

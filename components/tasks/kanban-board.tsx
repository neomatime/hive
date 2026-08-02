'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { moveTaskAction } from '@/app/dashboard/projects/[projectId]/board/actions'
import { TaskCard } from './task-card'
import { CreateTaskForm } from './create-task-form'
import { TaskDetailDialog } from './task-detail-dialog'
import type { ProjectBoard, Task } from '@/types/task'
export function KanbanBoard({ board }: { board: ProjectBoard }) {
  const [dragged, setDragged] = useState<Task | null>(null),
    [selected, setSelected] = useState<Task | null>(null),
    [busy, setBusy] = useState(false)
  const router = useRouter()
  async function drop(id: string, terminal: boolean, count: number) {
    if (!dragged || dragged.columnId === id) return
    setBusy(true)
    const result = await moveTaskAction(
      board.projectId,
      dragged.id,
      id,
      terminal,
      (count + 1) * 1024
    )
    setBusy(false)
    setDragged(null)
    if (!result.error) router.refresh()
  }
  return (
    <>
      <div aria-label="Kanban board" aria-busy={busy} className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <section
            key={column.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(column.id, column.isTerminal, column.tasks.length)}
            className="w-72 shrink-0 space-y-3 rounded-xl bg-muted/50 p-3"
          >
            <header className="flex justify-between">
              <h2 className="text-sm font-semibold">{column.name}</h2>
              <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
            </header>
            <div className="min-h-20 space-y-2">
              {column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onDragStart={setDragged} onOpen={setSelected} />
              ))}
            </div>
            <CreateTaskForm projectId={board.projectId} boardId={board.id} columnId={column.id} />
          </section>
        ))}
      </div>
      {selected && <TaskDetailDialog task={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

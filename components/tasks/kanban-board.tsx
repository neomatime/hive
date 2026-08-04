'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  moveTaskAction,
  moveTasksAction,
  updateColumnWipLimitAction,
} from '@/app/dashboard/projects/[projectId]/board/actions'
import { TaskCard } from './task-card'
import { CreateTaskForm } from './create-task-form'
import { TaskDetailDialog } from './task-detail-dialog'
import type { ProjectBoard, Task } from '@/types/task'

function WipLimitEditor({
  projectId,
  columnId,
  columnName,
  wipLimit,
}: {
  projectId: string
  columnId: string
  columnName: string
  wipLimit: number | null
}) {
  const [editing, setEditing] = useState(false)
  const router = useRouter()
  async function save(value: string) {
    const parsed = value.trim() === '' ? null : Number(value)
    await updateColumnWipLimitAction(projectId, columnId, Number.isNaN(parsed!) ? null : parsed)
    setEditing(false)
    router.refresh()
  }
  if (editing) {
    return (
      <Input
        type="number"
        min={0}
        aria-label={`WIP limit for ${columnName}`}
        defaultValue={wipLimit ?? ''}
        autoFocus
        className="h-6 w-16 px-1.5 text-xs"
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save((e.target as HTMLInputElement).value)
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    )
  }
  return (
    <button
      type="button"
      aria-label={`Edit WIP limit for ${columnName}`}
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Pencil className="size-3" aria-hidden="true" />
      {wipLimit === null ? 'Set limit' : `Limit ${wipLimit}`}
    </button>
  )
}

export function KanbanBoard({ board }: { board: ProjectBoard }) {
  const [dragged, setDragged] = useState<Task | null>(null),
    [selected, setSelected] = useState<Task | null>(null),
    [busy, setBusy] = useState(false),
    [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set()),
    [bulkTargetColumnId, setBulkTargetColumnId] = useState(board.columns[0]?.id ?? '')
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
  function toggleTaskSelect(id: string, next: boolean) {
    setSelectedTaskIds((current) => {
      const updated = new Set(current)
      if (next) updated.add(id)
      else updated.delete(id)
      return updated
    })
  }
  async function bulkMove() {
    const target = board.columns.find((column) => column.id === bulkTargetColumnId)
    if (!target || selectedTaskIds.size === 0) return
    await moveTasksAction(
      board.projectId,
      Array.from(selectedTaskIds),
      target.id,
      target.isTerminal
    )
    setSelectedTaskIds(new Set())
    router.refresh()
  }
  return (
    <>
      {selectedTaskIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <span>{selectedTaskIds.size} selected</span>
          <div className="flex items-center gap-2">
            <select
              aria-label="Move selected to"
              className="h-7 rounded-lg border bg-background px-2 text-sm"
              value={bulkTargetColumnId}
              onChange={(e) => setBulkTargetColumnId(e.target.value)}
            >
              {board.columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={bulkMove}>
              Move {selectedTaskIds.size} {selectedTaskIds.size === 1 ? 'task' : 'tasks'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedTaskIds(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}
      <div aria-label="Kanban board" aria-busy={busy} className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => {
          const atLimit = column.wipLimit !== null && column.tasks.length >= column.wipLimit
          return (
            <section
              key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(column.id, column.isTerminal, column.tasks.length)}
              className="w-72 shrink-0 space-y-3 rounded-xl bg-muted/50 p-3"
            >
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{column.name}</h2>
                <div className="flex items-center gap-2">
                  <span
                    data-testid={`wip-count-${column.id}`}
                    data-at-limit={atLimit}
                    className={cn(
                      'text-xs',
                      atLimit ? 'font-semibold text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {column.wipLimit !== null
                      ? `${column.tasks.length} / ${column.wipLimit}`
                      : column.tasks.length}
                  </span>
                  <WipLimitEditor
                    projectId={board.projectId}
                    columnId={column.id}
                    columnName={column.name}
                    wipLimit={column.wipLimit}
                  />
                </div>
              </header>
              <div className="min-h-20 space-y-2">
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={setDragged}
                    onOpen={setSelected}
                    isSelected={selectedTaskIds.has(task.id)}
                    onToggleSelect={toggleTaskSelect}
                  />
                ))}
              </div>
              <CreateTaskForm projectId={board.projectId} boardId={board.id} columnId={column.id} />
            </section>
          )
        })}
      </div>
      {selected && <TaskDetailDialog task={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

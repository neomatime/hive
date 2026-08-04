'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  deleteFilterPresetAction,
  moveTaskAction,
  moveTasksAction,
  saveFilterPresetAction,
  updateColumnWipLimitAction,
} from '@/app/dashboard/projects/[projectId]/board/actions'
import { TaskCard } from './task-card'
import { CreateTaskForm } from './create-task-form'
import { TaskDetailDialog } from './task-detail-dialog'
import type { BoardFilters, FilterPreset, ProjectBoard, Task } from '@/types/task'
import type { ProjectMember, TaskPriority } from '@/types/project'

const defaultFilters: BoardFilters = { search: '', priority: 'all', assigneeId: 'all' }

type GroupBy = 'none' | 'assignee' | 'priority'

const priorityOrder: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

function laneKeyFor(task: Task, groupBy: GroupBy): string {
  if (groupBy === 'priority') return task.priority
  if (groupBy === 'assignee') return task.assigneeId ?? 'unassigned'
  return 'all'
}

function laneLabel(key: string, members: ProjectMember[]): string {
  if (key === 'unassigned') return 'Unassigned'
  const member = members.find((item) => item.userId === key)
  if (member) return member.displayName
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function laneKeys(groupBy: GroupBy, tasks: Task[], members: ProjectMember[]): string[] {
  if (groupBy === 'priority') return priorityOrder
  if (groupBy === 'assignee') {
    const present = new Set(tasks.map((task) => laneKeyFor(task, groupBy)))
    const memberKeys = members.map((member) => member.userId).filter((id) => present.has(id))
    return present.has('unassigned') ? [...memberKeys, 'unassigned'] : memberKeys
  }
  return []
}

function matchesFilters(task: Task, filters: BoardFilters): boolean {
  if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
    return false
  }
  if (filters.priority !== 'all' && task.priority !== filters.priority) return false
  if (filters.assigneeId === 'unassigned' && task.assigneeId !== null) return false
  if (
    filters.assigneeId !== 'all' &&
    filters.assigneeId !== 'unassigned' &&
    task.assigneeId !== filters.assigneeId
  ) {
    return false
  }
  return true
}

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

export function KanbanBoard({
  board,
  members = [],
  presets: initialPresets = [],
}: {
  board: ProjectBoard
  members?: ProjectMember[]
  presets?: FilterPreset[]
}) {
  const [dragged, setDragged] = useState<Task | null>(null),
    [selected, setSelected] = useState<Task | null>(null),
    [busy, setBusy] = useState(false),
    [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set()),
    [bulkTargetColumnId, setBulkTargetColumnId] = useState(board.columns[0]?.id ?? ''),
    [filters, setFilters] = useState<BoardFilters>(defaultFilters),
    [groupBy, setGroupBy] = useState<GroupBy>('none'),
    [presets, setPresets] = useState<FilterPreset[]>(initialPresets),
    [selectedPresetId, setSelectedPresetId] = useState(''),
    [savingPreset, setSavingPreset] = useState(false)
  const router = useRouter()
  const visibleTasks = board.columns
    .flatMap((column) => column.tasks)
    .filter((task) => matchesFilters(task, filters))
  const lanes = laneKeys(groupBy, visibleTasks, members)
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
  function applyPreset(presetId: string) {
    setSelectedPresetId(presetId)
    const preset = presets.find((item) => item.id === presetId)
    if (preset) setFilters(preset.filters)
  }
  async function saveCurrentAsPreset(name: string) {
    const result = await saveFilterPresetAction(board.projectId, board.id, name, filters)
    if (result.preset) {
      setPresets((current) => [...current, result.preset!])
      setSelectedPresetId(result.preset.id)
    }
    setSavingPreset(false)
  }
  async function deleteSelectedPreset() {
    if (!selectedPresetId) return
    await deleteFilterPresetAction(board.projectId, selectedPresetId)
    setPresets((current) => current.filter((item) => item.id !== selectedPresetId))
    setSelectedPresetId('')
  }
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          aria-label="Search tasks"
          placeholder="Search tasks…"
          className="h-8 w-48"
          value={filters.search}
          onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))}
        />
        <select
          aria-label="Filter by priority"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
          value={filters.priority}
          onChange={(e) =>
            setFilters((current) => ({
              ...current,
              priority: e.target.value as BoardFilters['priority'],
            }))
          }
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          aria-label="Filter by assignee"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
          value={filters.assigneeId}
          onChange={(e) => setFilters((current) => ({ ...current, assigneeId: e.target.value }))}
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>
        <select
          aria-label="Group by"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
        >
          <option value="none">No grouping</option>
          <option value="assignee">Assignee</option>
          <option value="priority">Priority</option>
        </select>
        <select
          aria-label="Saved filters"
          className="h-8 rounded-lg border bg-background px-2 text-sm"
          value={selectedPresetId}
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="">Saved filters…</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        {selectedPresetId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Delete preset"
            onClick={deleteSelectedPreset}
          >
            Delete preset
          </Button>
        )}
        {savingPreset ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const name = new FormData(e.currentTarget).get('presetName')
              if (typeof name === 'string' && name.trim()) saveCurrentAsPreset(name.trim())
            }}
          >
            <Input
              name="presetName"
              aria-label="Preset name"
              placeholder="Preset name"
              autoFocus
              className="h-8 w-40"
            />
            <Button type="submit" size="sm">
              Save preset
            </Button>
          </form>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setSavingPreset(true)}>
            Save as preset
          </Button>
        )}
      </div>
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
      {groupBy === 'none' ? (
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
                  {column.tasks
                    .filter((task) => matchesFilters(task, filters))
                    .map((task) => (
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
                <CreateTaskForm
                  projectId={board.projectId}
                  boardId={board.id}
                  columnId={column.id}
                />
              </section>
            )
          })}
        </div>
      ) : (
        <div aria-label="Kanban board" aria-busy={busy} className="space-y-6 overflow-x-auto pb-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${board.columns.length}, 18rem)` }}
          >
            {board.columns.map((column) => {
              const atLimit = column.wipLimit !== null && column.tasks.length >= column.wipLimit
              return (
                <div key={column.id} className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{column.name}</h2>
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
                </div>
              )
            })}
          </div>
          {lanes.map((laneKey) => (
            <section key={laneKey} aria-label={`Swimlane: ${laneLabel(laneKey, members)}`}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {laneLabel(laneKey, members)}
              </h3>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${board.columns.length}, 18rem)` }}
              >
                {board.columns.map((column) => (
                  <div
                    key={column.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => drop(column.id, column.isTerminal, column.tasks.length)}
                    className="min-h-16 space-y-2 rounded-xl bg-muted/50 p-3"
                  >
                    {column.tasks
                      .filter(
                        (task) =>
                          matchesFilters(task, filters) && laneKeyFor(task, groupBy) === laneKey
                      )
                      .map((task) => (
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
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {selected && <TaskDetailDialog task={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

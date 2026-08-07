'use client'
import { CalendarDays } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import type { Task } from '@/types/task'
import type { TaskPriority } from '@/types/project'

const priorityVariant: Record<TaskPriority, BadgeVariant> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
}

export function TaskCard({
  task,
  onDragStart,
  onOpen,
  isSelected,
  onToggleSelect,
}: {
  task: Task
  onDragStart: (task: Task) => void
  onOpen: (task: Task) => void
  isSelected?: boolean
  onToggleSelect?: (id: string, next: boolean) => void
}) {
  return (
    <article
      draggable
      onDragStart={() => onDragStart(task)}
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(task)
      }}
      className="cursor-grab space-y-2 rounded-md border bg-background p-3 transition-colors hover:border-foreground/25"
    >
      <div className="flex justify-between gap-2">
        <div className="flex items-start gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              aria-label={`Select ${task.title}`}
              checked={isSelected ?? false}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onToggleSelect(task.id, event.target.checked)}
            />
          )}
          <h3 className="text-sm font-medium">{task.title}</h3>
        </div>
        <Badge variant={priorityVariant[task.priority]} className="shrink-0 uppercase">
          {task.priority}
        </Badge>
      </div>
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ backgroundColor: label.colorToken }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      {task.dueDate && (
        <p className="font-data flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3" aria-hidden="true" />
          {task.dueDate}
        </p>
      )}
    </article>
  )
}

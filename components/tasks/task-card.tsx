'use client'
import { CalendarDays } from 'lucide-react'
import type { Task } from '@/types/task'
export function TaskCard({
  task,
  onDragStart,
  onOpen,
}: {
  task: Task
  onDragStart: (task: Task) => void
  onOpen: (task: Task) => void
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
      className="cursor-grab space-y-2 rounded-lg border bg-background p-3 shadow-sm"
    >
      <div className="flex justify-between gap-2">
        <h3 className="text-sm font-medium">{task.title}</h3>
        <span className="text-xs capitalize text-muted-foreground">{task.priority}</span>
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
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3" />
          {task.dueDate}
        </p>
      )}
    </article>
  )
}

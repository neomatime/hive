'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flag, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

type View = 'month' | 'week' | 'day'
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const key = (date: Date) => {
  const part = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`
}
const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)

export function CalendarView({
  events,
  initialDate,
}: {
  events: CalendarEvent[]
  initialDate?: string
}) {
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(() =>
    initialDate ? new Date(`${initialDate}T12:00:00`) : new Date()
  )
  const today = key(new Date())
  const days = useMemo(() => {
    if (view === 'day') return [cursor]
    if (view === 'week') {
      const start = addDays(cursor, -cursor.getDay())
      return Array.from({ length: 7 }, (_, index) => addDays(start, index))
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = addDays(first, -first.getDay())
    return Array.from({ length: 42 }, (_, index) => addDays(start, index))
  }, [cursor, view])
  const title =
    view === 'day'
      ? cursor.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : view === 'week'
        ? `${days[0]!.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${days.at(-1)!.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  function move(amount: number) {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1))
    else setCursor(addDays(cursor, amount * (view === 'week' ? 7 : 1)))
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>Calendar</h1>
          <p className="text-muted-foreground">Project and task deadlines in one place.</p>
        </div>
        <div className="flex rounded-lg border p-1">
          {(['month', 'week', 'day'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={cn(
                'rounded-md px-3 py-1 text-sm capitalize',
                view === item && 'bg-primary text-primary-foreground'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" aria-label="Previous period" onClick={() => move(-1)}>
            <ChevronLeft />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button size="sm" variant="outline" aria-label="Next period" onClick={() => move(1)}>
            <ChevronRight />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {view !== 'day' && (
        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      )}
      <div
        aria-label={`${view} calendar`}
        className={cn(
          'grid overflow-hidden rounded-xl border bg-border gap-px',
          view === 'month' ? 'grid-cols-7' : view === 'week' ? 'grid-cols-7' : 'grid-cols-1'
        )}
      >
        {days.map((date) => {
          const dateKey = key(date)
          const dayEvents = events.filter((event) => event.date === dateKey)
          return (
            <section
              key={dateKey}
              aria-label={date.toLocaleDateString()}
              className={cn(
                'min-h-32 bg-background p-2',
                view === 'month' &&
                  date.getMonth() !== cursor.getMonth() &&
                  'bg-muted/40 text-muted-foreground',
                dateKey === today && 'ring-1 ring-inset ring-primary'
              )}
            >
              <p className="mb-2 text-xs font-medium">
                {view === 'day'
                  ? date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : date.getDate()}
              </p>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/projects/${event.projectId}/${event.type === 'task' ? 'board' : 'overview'}`}
                    className={cn(
                      'flex items-start gap-1 rounded-md px-2 py-1 text-xs',
                      event.type === 'project'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-primary/10 text-foreground',
                      event.completed && 'line-through opacity-60'
                    )}
                    title={`${event.projectCode} · ${event.projectName}`}
                  >
                    {event.type === 'project' ? (
                      <Flag className="mt-0.5 size-3 shrink-0" />
                    ) : (
                      <ListTodo className="mt-0.5 size-3 shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ListTodo className="size-3" /> Task deadline
        </span>
        <span className="flex items-center gap-1">
          <Flag className="size-3" /> Project deadline
        </span>
      </div>
    </div>
  )
}

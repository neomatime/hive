'use client'
import { useState } from 'react'
import { updateTaskPreferencesAction } from '@/app/dashboard/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
type Preferences = Awaited<
  ReturnType<typeof import('@/services/settings/settings-service').getTaskPreferences>
>
export function TaskPreferencesForm({ preferences }: { preferences: Preferences }) {
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false)
  return (
    <form
      className="max-w-2xl space-y-6 rounded-xl border bg-card p-6"
      onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const result = await updateTaskPreferencesAction(preferences.user_id, {
          defaultPriority: String(
            data.get('defaultPriority')
          ) as Preferences['default_task_priority'],
          defaultStatus: String(data.get('defaultStatus')) as Preferences['default_task_status'],
          weekStartsOn: Number(data.get('weekStartsOn')),
          workingHoursStart: String(data.get('workingHoursStart')),
          workingHoursEnd: String(data.get('workingHoursEnd')),
          showCompletedTasks: data.get('showCompletedTasks') === 'on',
        })
        setError(result.error)
        setSaved(!result.error)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Default priority
          <select
            name="defaultPriority"
            defaultValue={preferences.default_task_priority}
            className="h-8 rounded-lg border bg-background px-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Default status
          <select
            name="defaultStatus"
            defaultValue={preferences.default_task_status}
            className="h-8 rounded-lg border bg-background px-2"
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Week starts on
        <select
          name="weekStartsOn"
          defaultValue={preferences.week_starts_on}
          className="h-8 rounded-lg border bg-background px-2"
        >
          <option value="1">Monday</option>
          <option value="0">Sunday</option>
        </select>
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Working hours</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Start
            <Input
              type="time"
              name="workingHoursStart"
              defaultValue={preferences.working_hours_start ?? '08:00'}
            />
          </label>
          <label className="grid gap-1 text-sm">
            End
            <Input
              type="time"
              name="workingHoursEnd"
              defaultValue={preferences.working_hours_end ?? '17:00'}
            />
          </label>
        </div>
      </fieldset>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="showCompletedTasks"
          defaultChecked={preferences.show_completed_tasks}
          className="size-4 accent-primary"
        />
        Show completed tasks by default
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="text-sm text-emerald-600">
          Preferences saved.
        </p>
      )}
      <Button type="submit">Save task preferences</Button>
    </form>
  )
}

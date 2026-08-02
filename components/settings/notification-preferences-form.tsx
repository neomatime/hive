'use client'

import { useState } from 'react'
import { updateNotificationPreferencesAction } from '@/app/dashboard/settings/actions'
import { Button } from '@/components/ui/button'

type Preferences = Awaited<
  ReturnType<typeof import('@/services/settings/settings-service').getNotificationPreferences>
>
const channels = [
  ['in_app_enabled', 'In-app', 'See alerts while working in HIVE.'],
  ['email_enabled', 'Email', 'Receive important updates in your inbox.'],
  ['browser_enabled', 'Browser', 'Allow browser notifications when supported.'],
] as const
const events = [
  ['assigned_task', 'Task assigned', 'When a task is assigned to you.'],
  ['mention', 'Mention', 'When someone mentions you in a comment.'],
  ['due_today', 'Due today', 'A reminder on the day work is due.'],
  ['overdue', 'Overdue', 'When assigned work passes its due date.'],
  ['review_requested', 'Review requested', 'When your review is requested.'],
  ['task_completed', 'Task completed', 'When assigned work is completed.'],
] as const

function ToggleRow({
  name,
  title,
  description,
  checked,
}: {
  name: string
  title: string
  description: string
  checked: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 border-t py-4 first:border-t-0">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="size-4 accent-primary"
      />
    </label>
  )
}

export function NotificationPreferencesForm({ preferences }: { preferences: Preferences }) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const enabled = (name: string) => data.get(name) === 'on'
        const result = await updateNotificationPreferencesAction(preferences.user_id, {
          inAppEnabled: enabled('in_app_enabled'),
          emailEnabled: enabled('email_enabled'),
          browserEnabled: enabled('browser_enabled'),
          assignedTask: enabled('assigned_task'),
          mention: enabled('mention'),
          dueToday: enabled('due_today'),
          overdue: enabled('overdue'),
          reviewRequested: enabled('review_requested'),
          taskCompleted: enabled('task_completed'),
        })
        setError(result.error)
        setSaved(!result.error)
      }}
    >
      <section className="rounded-xl border bg-card px-5">
        <h2 className="pt-5 text-base font-medium">Delivery channels</h2>
        <p className="pb-2 text-sm text-muted-foreground">Choose how notifications reach you.</p>
        {channels.map(([name, title, description]) => (
          <ToggleRow
            key={name}
            name={name}
            title={title}
            description={description}
            checked={preferences[name]}
          />
        ))}
      </section>
      <section className="rounded-xl border bg-card px-5">
        <h2 className="pt-5 text-base font-medium">Activity</h2>
        <p className="pb-2 text-sm text-muted-foreground">Choose the events you want to follow.</p>
        {events.map(([name, title, description]) => (
          <ToggleRow
            key={name}
            name={name}
            title={title}
            description={description}
            checked={preferences[name]}
          />
        ))}
      </section>
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
      <Button type="submit">Save notifications</Button>
    </form>
  )
}

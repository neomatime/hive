'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/dashboard/inbox/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
type Item = Awaited<
  ReturnType<typeof import('@/services/notifications/notification-service').listNotifications>
>[number]
type View = 'all' | 'unread' | 'read'
export function NotificationInbox({ notifications }: { notifications: Item[] }) {
  const [items, setItems] = useState(notifications),
    [view, setView] = useState<View>('all'),
    [error, setError] = useState<string | null>(null)
  const visible = useMemo(
    () =>
      items.filter((item) => view === 'all' || (view === 'unread' ? !item.is_read : item.is_read)),
    [items, view]
  )
  const unread = items.filter((item) => !item.is_read).length
  async function read(item: Item) {
    if (item.is_read) return
    const result = await markNotificationReadAction(item.id)
    setError(result.error)
    if (!result.error)
      setItems((current) =>
        current.map((value) =>
          value.id === item.id
            ? { ...value, is_read: true, read_at: new Date().toISOString() }
            : value
        )
      )
  }
  async function readAll() {
    const result = await markAllNotificationsReadAction()
    setError(result.error)
    if (!result.error)
      setItems((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at ?? new Date().toISOString(),
        }))
      )
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>Inbox</h1>
          <p className="text-muted-foreground">
            Assignments, mentions, reviews, due dates, completions, and important updates.
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={readAll}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        )}
      </div>
      <div className="flex gap-2 border-b pb-3">
        {(['all', 'unread', 'read'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setView(item)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm capitalize',
              view === item
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {item}
            {item === 'unread' && ` ${unread}`}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Bell className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2>No notifications here</h2>
          <p className="text-sm text-muted-foreground">
            New task activity will appear in your inbox.
          </p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {visible.map((item) => (
            <Link
              key={item.id}
              href={
                item.projectId
                  ? `/dashboard/projects/${item.projectId}/board`
                  : '/dashboard/my-tasks'
              }
              onClick={() => read(item)}
              className={cn('flex gap-4 p-5 hover:bg-muted/50', !item.is_read && 'bg-primary/5')}
            >
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  item.is_read ? 'bg-muted' : 'bg-primary'
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{item.title}</strong>
                  <time className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </time>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.message}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

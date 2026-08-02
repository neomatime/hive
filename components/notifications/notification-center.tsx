'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
type Notification = Database['public']['Tables']['notifications']['Row']
export function NotificationCenter() {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Notification[]>([])
  useEffect(() => {
    let active = true
    createClient()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (active) setItems(data ?? [])
      })
    return () => {
      active = false
    }
  }, [])
  const unread = items.filter((item) => !item.is_read).length
  async function markRead(item: Notification) {
    if (item.is_read) return
    const now = new Date().toISOString()
    const result = await createClient()
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', item.id)
    if (!result.error)
      setItems((current) =>
        current.map((value) =>
          value.id === item.id ? { ...value, is_read: true, read_at: now } : value
        )
      )
  }
  async function markAllRead() {
    const now = new Date().toISOString()
    const result = await createClient()
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('is_read', false)
    if (!result.error)
      setItems((current) =>
        current.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? now }))
      )
  }
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-9 place-items-center rounded-lg border bg-background"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <Link
              href="/dashboard/inbox"
              onClick={() => setOpen(false)}
              className="text-sm font-medium hover:text-primary"
            >
              Notifications
            </Link>
            {unread > 0 && (
              <button className="text-xs text-primary" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Youâ€™re all caught up.</p>
          ) : (
            <div className="max-h-96 divide-y overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href="/dashboard/my-tasks"
                  onClick={() => markRead(item)}
                  className={`block p-4 text-sm hover:bg-muted/50 ${item.is_read ? '' : 'bg-primary/5'}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${item.is_read ? 'bg-transparent' : 'bg-primary'}`}
                    />
                    <span>
                      <span className="block font-medium">{item.title}</span>
                      <span className="block text-muted-foreground">{item.message}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

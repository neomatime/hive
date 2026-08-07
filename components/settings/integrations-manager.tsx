'use client'
import { useState } from 'react'
import { CalendarDays, Cloud, MessageSquare, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { setIntegrationConnectionAction } from '@/app/dashboard/settings/actions'
const providers = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Workspace messaging notifications.',
    icon: MessageSquare,
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Team collaboration notifications.',
    icon: Users,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Calendar event synchronization.',
    icon: CalendarDays,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'External document storage connection.',
    icon: Cloud,
  },
] as const
export function IntegrationsManager({
  workspaceId,
  userId,
  connected,
  canEdit,
}: {
  workspaceId: string
  userId: string
  connected: Array<{ provider: string; is_connected: boolean }>
  canEdit: boolean
}) {
  const [active, setActive] = useState(
    () => new Set(connected.filter((item) => item.is_connected).map((item) => item.provider))
  )
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {providers.map((provider) => {
        const Icon = provider.icon
        const enabled = active.has(provider.id)
        return (
          <section key={provider.id} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <Icon className="size-6 text-primary" />
              <Badge variant={enabled ? 'success' : 'neutral'}>
                {enabled ? 'Connected' : 'Not connected'}
              </Badge>
            </div>
            <div>
              <h2>{provider.name}</h2>
              <p className="text-sm text-muted-foreground">{provider.description}</p>
            </div>
            {canEdit ? (
              <Button
                variant={enabled ? 'outline' : 'default'}
                onClick={async () => {
                  const result = await setIntegrationConnectionAction(
                    workspaceId,
                    userId,
                    provider.id,
                    !enabled
                  )
                  setError(result.error)
                  if (!result.error)
                    setActive((current) => {
                      const next = new Set(current)
                      if (enabled) next.delete(provider.id)
                      else next.add(provider.id)
                      return next
                    })
                }}
              >
                {enabled ? 'Disconnect' : 'Connect'}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Admin access is required.</p>
            )}
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}

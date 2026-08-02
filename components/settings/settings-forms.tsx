'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  updateMemberRoleAction,
  updatePasswordAction,
  updateProfileAction,
  updateWorkspaceAction,
} from '@/app/dashboard/settings/actions'
import type { Database } from '@/types/database'

function Message({ error, saved }: { error: string | null; saved: boolean }) {
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    )
  if (saved)
    return (
      <p role="status" className="text-sm text-emerald-600">
        Changes saved.
      </p>
    )
  return null
}
export function ProfileForm({
  profile,
}: {
  profile: NonNullable<
    Awaited<ReturnType<typeof import('@/services/settings/settings-service').getProfile>>
  >
}) {
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false)
  return (
    <form
      className="max-w-2xl space-y-4 rounded-xl border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const d = new FormData(e.currentTarget)
        const r = await updateProfileAction(profile.id, {
          displayName: String(d.get('displayName')),
          firstName: String(d.get('firstName')),
          lastName: String(d.get('lastName')),
          jobTitle: String(d.get('jobTitle')),
          department: String(d.get('department')),
          phoneNumber: String(d.get('phoneNumber')),
          timezone: String(d.get('timezone')),
        })
        setError(r.error)
        setSaved(!r.error)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          First name
          <Input name="firstName" defaultValue={profile.first_name} />
        </label>
        <label className="grid gap-1 text-sm">
          Last name
          <Input name="lastName" defaultValue={profile.last_name} />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Display name
        <Input name="displayName" defaultValue={profile.display_name} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Job title
          <Input name="jobTitle" defaultValue={profile.job_title ?? ''} />
        </label>
        <label className="grid gap-1 text-sm">
          Department
          <Input name="department" defaultValue={profile.department ?? ''} />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Phone number
        <Input name="phoneNumber" defaultValue={profile.phone_number ?? ''} />
      </label>
      <label className="grid gap-1 text-sm">
        Timezone
        <Input name="timezone" defaultValue={profile.timezone} required />
      </label>
      <Message error={error} saved={saved} />
      <Button type="submit">Save profile</Button>
    </form>
  )
}
export function WorkspaceForm({
  workspace,
  canEdit,
}: {
  workspace: NonNullable<
    Awaited<ReturnType<typeof import('@/services/settings/settings-service').getWorkspace>>
  >
  canEdit: boolean
}) {
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false)
  return (
    <form
      className="max-w-2xl space-y-4 rounded-xl border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const d = new FormData(e.currentTarget)
        const r = await updateWorkspaceAction(workspace.id, {
          name: String(d.get('name')),
          description: String(d.get('description')),
          timezone: String(d.get('timezone')),
          dateFormat: String(d.get('dateFormat')),
          timeFormat: String(d.get('timeFormat')),
        })
        setError(r.error)
        setSaved(!r.error)
      }}
    >
      <label className="grid gap-1 text-sm">
        Workspace name
        <Input name="name" defaultValue={workspace.name} disabled={!canEdit} />
      </label>
      <label className="grid gap-1 text-sm">
        Description
        <textarea
          name="description"
          defaultValue={workspace.description ?? ''}
          disabled={!canEdit}
          className="min-h-24 rounded-lg border bg-transparent p-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Timezone
        <Input name="timezone" defaultValue={workspace.timezone} disabled={!canEdit} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Date format
          <select
            name="dateFormat"
            defaultValue={workspace.date_format}
            disabled={!canEdit}
            className="h-8 rounded-lg border bg-background px-2"
          >
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Time format
          <select
            name="timeFormat"
            defaultValue={workspace.time_format}
            disabled={!canEdit}
            className="h-8 rounded-lg border bg-background px-2"
          >
            <option value="24h">24 hour</option>
            <option value="12h">12 hour</option>
          </select>
        </label>
      </div>
      <Message error={error} saved={saved} />
      {canEdit ? (
        <Button type="submit">Save workspace</Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only owners and admins can change workspace settings.
        </p>
      )}
    </form>
  )
}
export function PasswordForm() {
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false)
  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const d = new FormData(e.currentTarget)
        const p = String(d.get('password')),
          c = String(d.get('confirm'))
        if (p !== c) {
          setError('Passwords do not match.')
          return
        }
        const r = await updatePasswordAction(p)
        setError(r.error)
        setSaved(!r.error)
        if (!r.error) e.currentTarget.reset()
      }}
    >
      <label className="grid gap-1 text-sm">
        New password
        <Input type="password" name="password" minLength={12} required />
      </label>
      <label className="grid gap-1 text-sm">
        Confirm password
        <Input type="password" name="confirm" minLength={12} required />
      </label>
      <Message error={error} saved={saved} />
      <Button type="submit">Update password</Button>
    </form>
  )
}
export function TeamTable({
  members,
  canEdit,
}: {
  members: Awaited<
    ReturnType<typeof import('@/services/settings/settings-service').listWorkspaceTeam>
  >
  canEdit: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="overflow-hidden rounded-xl border">
      {error && (
        <p role="alert" className="p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {members.map((member) => (
        <div
          key={member.id}
          className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-4 border-t p-4 first:border-t-0"
        >
          <div>
            <p className="font-medium">{member.user?.display_name ?? 'Unknown user'}</p>
            <p className="text-xs text-muted-foreground">
              {member.user?.email}
              {member.user?.job_title ? ` · ${member.user.job_title}` : ''}
            </p>
          </div>
          <select
            aria-label={`Role for ${member.user?.display_name ?? 'user'}`}
            value={member.role}
            disabled={!canEdit || member.role === 'owner'}
            onChange={async (e) => {
              const r = await updateMemberRoleAction(
                member.id,
                e.target.value as Database['public']['Enums']['workspace_role']
              )
              setError(r.error)
            }}
            className="h-8 rounded-lg border bg-background px-2 text-sm"
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      ))}
    </div>
  )
}

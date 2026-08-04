'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateMemberRoleAction,
  updatePasswordAction,
  updateProfileAction,
  updateWorkspaceAction,
} from '@/app/dashboard/settings/actions'
import { getProfile } from '@/services/settings/settings-service'
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
  onSaved,
}: {
  profile: NonNullable<
    Awaited<ReturnType<typeof import('@/services/settings/settings-service').getProfile>>
  >
  onSaved?: (input: {
    displayName: string
    firstName: string
    lastName: string
    jobTitle: string
    department: string
    phoneNumber: string
    timezone: string
  }) => void
}) {
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false)
  return (
    <form
      className="max-w-2xl space-y-4 rounded-xl border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const d = new FormData(e.currentTarget)
        const input = {
          displayName: String(d.get('displayName')),
          firstName: String(d.get('firstName')),
          lastName: String(d.get('lastName')),
          jobTitle: String(d.get('jobTitle')),
          department: String(d.get('department')),
          phoneNumber: String(d.get('phoneNumber')),
          timezone: String(d.get('timezone')),
        }
        const r = await updateProfileAction(profile.id, input)
        setError(r.error)
        setSaved(!r.error)
        if (!r.error) onSaved?.(input)
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
    [saved, setSaved] = useState(false),
    [logoUrl, setLogoUrl] = useState(workspace.logo_url)
  return (
    <form
      className="max-w-2xl space-y-4 rounded-xl border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const d = new FormData(e.currentTarget)
        const logo = d.get('logo') as File
        let nextLogoUrl = logoUrl
        if (logo?.size) {
          if (
            logo.size > 2 * 1024 * 1024 ||
            !['image/png', 'image/jpeg', 'image/webp'].includes(logo.type)
          ) {
            setError('Logo must be a PNG, JPEG, or WebP under 2 MB.')
            return
          }
          const client = createClient()
          const extension = logo.name.split('.').pop()?.toLowerCase() || 'png'
          const storagePath = `${workspace.id}/logo.${extension}`
          const upload = await client.storage
            .from('workspace-branding')
            .upload(storagePath, logo, { upsert: true })
          if (upload.error) {
            setError('Could not upload workspace logo.')
            return
          }
          // workspace-branding is a private bucket (audit I-2) -- a public
          // URL would 403; use a signed URL instead.
          const signed = await client.storage
            .from('workspace-branding')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7)
          if (signed.error || !signed.data) {
            setError('Logo uploaded, but could not generate a preview URL.')
            return
          }
          nextLogoUrl = signed.data.signedUrl
          setLogoUrl(nextLogoUrl)
        }
        const r = await updateWorkspaceAction(workspace.id, {
          name: String(d.get('name')),
          description: String(d.get('description')),
          timezone: String(d.get('timezone')),
          dateFormat: String(d.get('dateFormat')),
          timeFormat: String(d.get('timeFormat')),
          logoUrl: nextLogoUrl,
        })
        setError(r.error)
        setSaved(!r.error)
      }}
    >
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Workspace logo"
            width={64}
            height={64}
            unoptimized
            className="size-16 rounded-xl border object-cover"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-xl border bg-muted text-xl font-semibold">
            {workspace.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <label className="grid flex-1 gap-1 text-sm">
          Workspace logo
          <Input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            disabled={!canEdit}
          />
        </label>
      </div>
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
type TeamMember = Awaited<
  ReturnType<typeof import('@/services/settings/settings-service').listWorkspaceTeam>
>[number]

function TeamMemberProfileDialog({
  userId,
  onClose,
  onSaved,
}: {
  userId: string
  onClose: () => void
  onSaved: (input: { displayName: string; jobTitle: string }) => void
}) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>> | null | undefined>(
    undefined
  )
  useEffect(() => {
    let active = true
    getProfile(createClient(), userId).then((data) => {
      if (active) setProfile(data)
    })
    return () => {
      active = false
    }
  }, [userId])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
      >
        <div className="mb-5 flex justify-between">
          <h2 id="member-profile-title">Edit profile</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {profile === undefined && <p className="text-sm text-muted-foreground">Loading…</p>}
        {profile === null && (
          <p role="alert" className="text-sm text-destructive">
            Could not load this member&apos;s profile.
          </p>
        )}
        {profile && (
          <ProfileForm
            profile={profile}
            onSaved={(input) =>
              onSaved({ displayName: input.displayName, jobTitle: input.jobTitle })
            }
          />
        )}
      </section>
    </div>
  )
}
export function TeamTable({
  members,
  canEdit,
  workspaceId,
}: {
  members: TeamMember[]
  canEdit: boolean
  workspaceId: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState(members)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      {canEdit && (
        <form
          className="flex flex-wrap gap-3 rounded-xl border bg-card p-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            const result = await addWorkspaceMemberAction(
              workspaceId,
              String(data.get('email')),
              String(data.get('role')) as Database['public']['Enums']['workspace_role']
            )
            setError(result.error)
            if (!result.error) form.reset()
          }}
        >
          <Input
            className="min-w-64 flex-1"
            name="email"
            type="email"
            placeholder="teammate@example.com"
            aria-label="Member email"
            required
          />
          <select name="role" className="h-10 rounded-lg border bg-background px-3 text-sm">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit">Add member</Button>
        </form>
      )}
      <div className="overflow-hidden rounded-xl border">
        {error && (
          <p role="alert" className="p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="grid gap-4 border-t p-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            {canEdit ? (
              <button
                type="button"
                className="rounded-lg text-left hover:underline"
                onClick={() => setEditingUserId(member.user_id)}
              >
                <p className="font-medium">{member.user?.display_name ?? 'Unknown user'}</p>
                <p className="text-xs text-muted-foreground">
                  {member.user?.email}
                  {member.user?.job_title ? ` • ${member.user.job_title}` : ''}
                </p>
              </button>
            ) : (
              <div>
                <p className="font-medium">{member.user?.display_name ?? 'Unknown user'}</p>
                <p className="text-xs text-muted-foreground">
                  {member.user?.email}
                  {member.user?.job_title ? ` • ${member.user.job_title}` : ''}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <select
                aria-label={`Role for ${member.user?.display_name ?? 'user'}`}
                value={member.role}
                disabled={!canEdit || member.role === 'owner' || !member.is_active}
                onChange={async (event) => {
                  const result = await updateMemberRoleAction(
                    member.id,
                    event.target.value as Database['public']['Enums']['workspace_role']
                  )
                  setError(result.error)
                }}
                className="h-8 rounded-lg border bg-background px-2 text-sm"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              {canEdit && member.role !== 'owner' && member.is_active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const result = await removeWorkspaceMemberAction(member.id)
                    setError(result.error)
                  }}
                >
                  Remove
                </Button>
              )}
              {!member.is_active && <span className="text-xs text-muted-foreground">Inactive</span>}
            </div>
          </div>
        ))}
      </div>
      {editingUserId && (
        <TeamMemberProfileDialog
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
          onSaved={(input) => {
            setTeamMembers((current) =>
              current.map((member) =>
                member.user_id === editingUserId && member.user
                  ? {
                      ...member,
                      user: {
                        ...member.user,
                        display_name: input.displayName,
                        job_title: input.jobTitle || null,
                      },
                    }
                  : member
              )
            )
            setEditingUserId(null)
          }}
        />
      )}
    </div>
  )
}

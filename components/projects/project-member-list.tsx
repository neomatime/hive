'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  addProjectMemberAction,
  removeProjectMemberAction,
  updateProjectMemberRoleAction,
} from '@/app/dashboard/projects/[projectId]/settings/actions'
import type { ProjectMember } from '@/types/project'

const labels = {
  project_owner: 'Project owner',
  project_manager: 'Project manager',
  contributor: 'Contributor',
  viewer: 'Viewer',
}
export function ProjectMemberList({
  projectId,
  members,
  availableMembers,
}: {
  projectId: string
  members: ProjectMember[]
  availableMembers: { userId: string; displayName: string; email: string }[]
}) {
  const router = useRouter(),
    [error, setError] = useState<string | null>(null)
  async function add(userId: string, role: ProjectMember['role']) {
    const result = await addProjectMemberAction(projectId, userId, role)
    if (result.error) setError(result.error)
    else router.refresh()
  }
  async function remove(userId: string) {
    const result = await removeProjectMemberAction(projectId, userId)
    if (result.error) setError(result.error)
    else router.refresh()
  }
  async function role(userId: string, value: ProjectMember['role']) {
    const result = await updateProjectMemberRoleAction(projectId, userId, value)
    if (result.error) setError(result.error)
    else router.refresh()
  }
  return (
    <div className="space-y-3">
      {availableMembers.length > 0 ? (
        <form
          className="flex flex-wrap gap-3 rounded-xl border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            add(String(data.get('userId')), data.get('role') as ProjectMember['role'])
          }}
        >
          <select
            name="userId"
            aria-label="Workspace member"
            required
            className="h-10 min-w-64 flex-1 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Select a teammate…</option>
            {availableMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName} ({member.email})
              </option>
            ))}
          </select>
          <select
            name="role"
            defaultValue="contributor"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="project_manager">Project manager</option>
            <option value="contributor">Contributor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit">Add to project</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Everyone on the workspace team is already on this project.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {members.map((member) => (
        <div
          key={member.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {member.displayName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.displayName}</p>
              <p className="text-xs text-muted-foreground">{labels[member.role]}</p>
            </div>
          </div>
          {member.role !== 'project_owner' && (
            <div className="flex gap-2">
              <select
                aria-label={`Role for ${member.displayName}`}
                value={member.role}
                onChange={(event) =>
                  role(member.userId, event.target.value as ProjectMember['role'])
                }
                className="h-8 rounded-lg border bg-background px-2 text-sm"
              >
                <option value="project_owner">Project owner</option>
                <option value="project_manager">Project manager</option>
                <option value="contributor">Contributor</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${member.displayName}`}
                onClick={() => remove(member.userId)}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

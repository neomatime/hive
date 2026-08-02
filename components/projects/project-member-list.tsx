'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
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
}: {
  projectId: string
  members: ProjectMember[]
}) {
  const router = useRouter(),
    [error, setError] = useState<string | null>(null)
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

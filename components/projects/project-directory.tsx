'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toggleFavourite, type ListProjectsFilters } from '@/services/projects/project-service'
import { useProjects } from '@/hooks/use-projects'
import { ProjectCard } from './project-card'

export function ProjectDirectory({ workspaceId }: { workspaceId: string }) {
  const [filters, setFilters] = useState<ListProjectsFilters>({
    sortBy: 'created_at',
    sortDirection: 'desc',
  })
  const { data: projects = [], isLoading } = useProjects(workspaceId, filters)
  const queryClient = useQueryClient()
  async function favourite(id: string, next: boolean) {
    await toggleFavourite(createClient(), id, next)
    await queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <Input
          aria-label="Search projects"
          placeholder="Search projects…"
          value={filters.search ?? ''}
          onChange={(e) =>
            setFilters((value) => ({ ...value, search: e.target.value || undefined }))
          }
        />
        <select
          aria-label="Project status"
          className="h-8 rounded-lg border bg-background px-3 text-sm"
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((value) => ({
              ...value,
              status: (e.target.value || undefined) as ListProjectsFilters['status'],
            }))
          }
        >
          <option value="">All statuses</option>
          <option value="not_started">Not started</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <label className="flex h-8 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.favouritesOnly ?? false}
            onChange={(e) =>
              setFilters((value) => ({ ...value, favouritesOnly: e.target.checked || undefined }))
            }
          />{' '}
          Favourites
        </label>
        <select
          aria-label="Sort projects"
          className="h-8 rounded-lg border bg-background px-3 text-sm"
          value={filters.sortBy}
          onChange={(e) =>
            setFilters((value) => ({
              ...value,
              sortBy: e.target.value as ListProjectsFilters['sortBy'],
            }))
          }
        >
          <option value="created_at">Recently created</option>
          <option value="name">Name</option>
          <option value="due_date">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2>No projects found</h2>
          <p className="text-muted-foreground">Create a project or adjust your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onToggleFavourite={favourite} />
          ))}
        </div>
      )}
    </div>
  )
}

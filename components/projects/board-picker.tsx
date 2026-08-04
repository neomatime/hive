'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleFavourite } from '@/services/projects/project-service'
import { ProjectCard } from './project-card'
import type { Project } from '@/types/project'

export function BoardPicker({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  async function favourite(id: string, next: boolean) {
    setProjects((current) =>
      current.map((project) => (project.id === id ? { ...project, isFavourite: next } : project))
    )
    await toggleFavourite(createClient(), id, next)
  }
  return (
    <div className="space-y-5">
      <div>
        <h1>Board</h1>
        <p className="text-muted-foreground">Pick a project to open its board.</p>
      </div>
      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2>No projects yet</h2>
          <p className="text-muted-foreground">Create a project to get a board.</p>
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

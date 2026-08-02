'use client'

import Link from 'next/link'
import { ArrowRight, Columns3, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'

const labels: Record<Project['status'], string> = {
  not_started: 'Not started',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  archived: 'Archived',
}

export function ProjectCard({
  project,
  onToggleFavourite,
}: {
  project: Project
  onToggleFavourite: (id: string, next: boolean) => void
}) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}/board`}
      aria-label={`Open ${project.name} board`}
      className="block"
    >
      <Card
        data-testid="project-card"
        data-archived={project.status === 'archived'}
        className={cn(
          'space-y-3 p-5 transition-shadow hover:shadow-md',
          project.status === 'archived' && 'opacity-60'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{project.projectCode}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-1"
            aria-label={project.isFavourite ? 'Remove favourite' : 'Add favourite'}
            onClick={(event) => {
              event.preventDefault()
              onToggleFavourite(project.id, !project.isFavourite)
            }}
          >
            <Star
              aria-hidden="true"
              fill={project.isFavourite ? 'currentColor' : 'none'}
              className="text-primary"
            />
          </button>
        </div>
        <div className="flex justify-between text-sm">
          <span>{labels[project.status]}</span>
          <span>{project.progressPercentage}% complete</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${project.progressPercentage}%` }} />
        </div>
        {project.dueDate && (
          <p className="text-xs text-muted-foreground">
            Due {new Date(`${project.dueDate}T00:00:00`).toLocaleDateString()}
          </p>
        )}
        <div className="flex items-center justify-between border-t pt-3 text-sm font-medium text-primary">
          <span className="flex items-center gap-2">
            <Columns3 className="size-4" aria-hidden="true" />
            Open board
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  )
}




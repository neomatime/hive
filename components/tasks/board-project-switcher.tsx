'use client'

import { useRouter } from 'next/navigation'
import type { Project } from '@/types/project'

// The board it opens is carried in the URL rather than component state, so a
// board link can be shared and the browser's back button steps between
// projects the way you'd expect.
export function BoardProjectSwitcher({
  projects,
  selectedId,
}: {
  projects: Project[]
  selectedId: string
}) {
  const router = useRouter()
  return (
    <select
      aria-label="Project"
      value={selectedId}
      onChange={(event) => router.push(`/dashboard/board?project=${event.target.value}`)}
      className="h-8 rounded-lg border bg-background px-2 text-sm"
    >
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  )
}

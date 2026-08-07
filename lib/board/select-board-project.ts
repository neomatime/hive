import type { Project } from '@/types/project'

// Decides which project's board /dashboard/board opens. An explicit
// ?project= wins, so the switcher and shared links are honoured; otherwise a
// favourited project, else the first one. Archived projects are never opened
// -- not by default and not on request -- since their board is not somewhere
// you want to land.
export function selectBoardProject(projects: Project[], requestedId: string | undefined) {
  const open = projects.filter((project) => !project.archivedAt)
  const requested = requestedId ? open.find((project) => project.id === requestedId) : undefined
  return requested ?? open.find((project) => project.isFavourite) ?? open[0] ?? null
}

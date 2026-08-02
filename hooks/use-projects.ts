'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { listProjects, type ListProjectsFilters } from '@/services/projects/project-service'

export function useProjects(workspaceId: string, filters: ListProjectsFilters) {
  return useQuery({
    queryKey: ['projects', workspaceId, filters],
    queryFn: () => listProjects(createClient(), workspaceId, filters),
  })
}

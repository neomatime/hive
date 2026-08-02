'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUserWithMembership(createClient()),
  })
}

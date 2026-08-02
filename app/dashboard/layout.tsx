import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { NoAccess } from '@/components/empty-states/no-access'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const result = await getCurrentUserWithMembership(supabase)

  if (result.status === 'unauthenticated') {
    redirect('/login')
  }

  if (result.status === 'no-active-membership') {
    return <NoAccess />
  }

  return <DashboardShell user={result.user}>{children}</DashboardShell>
}

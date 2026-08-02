import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { ROLE_LABELS } from '@/constants/roles'

export default async function OverviewPage() {
  const supabase = await createClient()
  const result = await getCurrentUserWithMembership(supabase)

  // Unreachable in the 'unauthenticated'/'no-active-membership' cases —
  // app/dashboard/layout.tsx (Task 13) already handles both before this page renders.
  if (result.status !== 'ok') return null

  const { user } = result

  return (
    <div className="space-y-2">
      <h1>Welcome, {user.displayName.split(' ')[0]}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        You&apos;re signed in to the {user.workspace.name} workspace as {ROLE_LABELS[user.role]}.
      </p>
      <p style={{ color: 'var(--text-muted)' }}>
        Projects, tasks, and deadlines will show up here once they&apos;re built.
      </p>
    </div>
  )
}

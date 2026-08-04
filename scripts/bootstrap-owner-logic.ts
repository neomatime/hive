import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { WorkspaceRole } from '@/types/workspace'

const VALID_ROLES: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer']

export function parseBootstrapArgs(argv: string[]): {
  email: string
  role: WorkspaceRole
  firstName: string | undefined
  lastName: string | undefined
} {
  const emailArg = argv.find((a) => a.startsWith('--email='))
  const roleArg = argv.find((a) => a.startsWith('--role='))
  const firstNameArg = argv.find((a) => a.startsWith('--first-name='))
  const lastNameArg = argv.find((a) => a.startsWith('--last-name='))

  if (!emailArg) {
    throw new Error('--email is required, e.g. --email=owner@himark.com')
  }

  const email = emailArg.split('=')[1]
  if (!email) {
    throw new Error('--email is required, e.g. --email=owner@himark.com')
  }

  const role = (roleArg ? roleArg.split('=')[1] : 'member') as WorkspaceRole

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`invalid role "${role}" — must be one of ${VALID_ROLES.join(', ')}`)
  }

  return {
    email,
    role,
    firstName: firstNameArg?.split('=')[1],
    lastName: lastNameArg?.split('=')[1],
  }
}

export async function ensureWorkspace(admin: SupabaseClient<Database>): Promise<{ id: string }> {
  const { data: existing } = await admin.from('workspaces').select('id').limit(1).maybeSingle()
  if (existing) return { id: existing.id }

  const { data: created, error } = await admin
    .from('workspaces')
    .insert({
      name: 'HIMARK',
      slug: 'himark',
      timezone: 'UTC',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
    })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(`Failed to create workspace: ${error?.message}`)
  }

  return { id: created.id }
}

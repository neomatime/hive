import { createAdminClient } from '@/lib/supabase/admin'
import { parseBootstrapArgs, ensureWorkspace } from './bootstrap-owner-logic'

async function main() {
  const { email, role } = parseBootstrapArgs(process.argv.slice(2))
  const admin = createAdminClient()

  const workspace = await ensureWorkspace(admin)

  // inviteUserByEmail does not support the PKCE flow (auth-js's own doc
  // comment: "PKCE is not supported when using inviteUserByEmail. This is
  // because the browser initiating the invite is often different from the
  // browser accepting the invite"). Its emailed link resolves to a redirect
  // carrying `#access_token=...&refresh_token=...&type=invite` in the URL
  // fragment, which only client-side JS can read -- never a route.ts
  // handler (see app/auth/confirm/route.ts's doc comment). So this points
  // straight at /reset-password, whose SessionGate
  // (components/auth/session-gate.tsx) reads the fragment client-side and
  // establishes the session before the password form renders.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })
  if (inviteError || !invited.user) {
    throw new Error(`Failed to invite ${email}: ${inviteError?.message}`)
  }

  // The DB trigger (Task 3) has created the public.users row by now.
  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('id')
    .eq('auth_user_id', invited.user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(`Could not find users row for invited auth user: ${profileError?.message}`)
  }

  const { error: memberError } = await admin.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: profile.id,
    role,
  })

  if (memberError) {
    throw new Error(`Failed to add workspace membership: ${memberError.message}`)
  }

  console.log(`Invited ${email} as ${role}. They'll receive an email to set their password.`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

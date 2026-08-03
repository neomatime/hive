import { createClient } from '@/lib/supabase/server'
import { AccountSecurityForm } from '@/components/settings/account-security-form'
import { PasswordForm } from '@/components/settings/settings-forms'
import { SettingsHeader } from '@/components/settings/settings-header'
export default async function AccountPage() {
  const client = await createClient()
  const [{ data: userData }, { data: factors }] = await Promise.all([
    client.auth.getUser(),
    client.auth.mfa.listFactors(),
  ])
  if (!userData.user) return null
  return (
    <>
      <SettingsHeader
        title="Account"
        description="Manage credentials, multi-factor authentication, and sessions."
      />
      <div className="space-y-6">
        <AccountSecurityForm
          email={userData.user.email ?? ''}
          verifiedFactorId={
            factors?.totp.find((factor) => factor.status === 'verified')?.id ?? null
          }
        />
        <PasswordForm />
      </div>
    </>
  )
}

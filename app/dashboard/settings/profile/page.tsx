import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { getProfile } from '@/services/settings/settings-service'
import { ProfileForm } from '@/components/settings/settings-forms'
import { SettingsHeader } from '@/components/settings/settings-header'
export default async function ProfilePage() {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const profile = await getProfile(client, current.user.id)
  if (!profile) return null
  return (
    <>
      <SettingsHeader title="My profile" description="Manage how you appear across HIVE." />
      <ProfileForm profile={profile} />
    </>
  )
}

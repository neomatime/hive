import { PasswordForm } from '@/components/settings/settings-forms'
import { SettingsHeader } from '@/components/settings/settings-header'
export default function AccountPage() {
  return (
    <>
      <SettingsHeader title="Account" description="Update your authentication credentials." />
      <PasswordForm />
    </>
  )
}

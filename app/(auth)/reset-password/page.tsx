import { SessionGate } from '@/components/auth/session-gate'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <h1>Set a new password</h1>
      <SessionGate>
        <ResetPasswordForm />
      </SessionGate>
    </div>
  )
}

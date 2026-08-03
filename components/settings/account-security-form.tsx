'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signOutOtherSessionsAction, updateEmailAction } from '@/app/dashboard/settings/actions'

export function AccountSecurityForm({
  email,
  verifiedFactorId,
}: {
  email: string
  verifiedFactorId: string | null
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string } | null>(null)
  async function enroll() {
    setError(null)
    const { data, error: authError } = await createClient().auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Hive authenticator',
    })
    if (authError || !data.totp) return setError('Could not start authenticator setup.')
    setFactor({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
  }
  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!factor) return
    const code = String(new FormData(event.currentTarget).get('code'))
    const { error: authError } = await createClient().auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    })
    if (authError) return setError('That verification code was not accepted.')
    setFactor(null)
    setMessage('Authenticator enabled. Other sessions were signed out for your security.')
    window.location.reload()
  }
  async function disable() {
    if (!verifiedFactorId) return
    const { error: authError } = await createClient().auth.mfa.unenroll({
      factorId: verifiedFactorId,
    })
    if (authError) return setError('Reauthenticate with your authenticator before removing it.')
    window.location.reload()
  }
  return (
    <div className="max-w-xl space-y-6">
      <form
        className="space-y-4 rounded-xl border bg-card p-6"
        onSubmit={async (event) => {
          event.preventDefault()
          setError(null)
          const nextEmail = String(new FormData(event.currentTarget).get('email')).trim()
          const result = await updateEmailAction(nextEmail)
          setError(result.error)
          if (!result.error) setMessage('Check both email addresses to confirm the change.')
        }}
      >
        <div>
          <h2>Email address</h2>
          <p className="text-sm text-muted-foreground">
            Changing your sign-in email requires verification.
          </p>
        </div>
        <Input name="email" type="email" defaultValue={email} required />
        <Button type="submit">Update email</Button>
      </form>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2>Authenticator app</h2>
          <p className="text-sm text-muted-foreground">
            Add a time-based one-time password as a second sign-in step.
          </p>
        </div>
        {verifiedFactorId ? (
          <Button variant="outline" onClick={disable}>
            Remove authenticator
          </Button>
        ) : (
          <Button variant="outline" onClick={enroll}>
            Set up authenticator
          </Button>
        )}
        {factor && (
          <form className="space-y-3" onSubmit={verify}>
            {/* Supabase returns a local data URI containing the enrollment QR code. */}
            <Image
              src={factor.qr}
              alt="Authenticator enrollment QR code"
              width={192}
              height={192}
              unoptimized
              className="size-48 rounded-lg border bg-white p-2"
            />
            <p className="break-all text-xs text-muted-foreground">Manual key: {factor.secret}</p>
            <Input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              required
            />
            <Button type="submit">Verify authenticator</Button>
          </form>
        )}
      </section>
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2>Sessions</h2>
          <p className="text-sm text-muted-foreground">
            This browser is your current session. You can revoke every other active session.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            const result = await signOutOtherSessionsAction()
            setError(result.error)
            if (!result.error) setMessage('All other sessions have been signed out.')
          }}
        >
          Sign out other sessions
        </Button>
      </section>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-600">
          {message}
        </p>
      )}
    </div>
  )
}

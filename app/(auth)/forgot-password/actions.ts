'use server'

import { createClient } from '@/lib/supabase/server'
import { requestPasswordReset } from '@/services/auth/auth-service'

export async function requestPasswordResetAction(input: {
  email: string
}): Promise<{ submitted: true }> {
  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
  await requestPasswordReset(supabase, input.email, redirectTo)
  return { submitted: true }
}

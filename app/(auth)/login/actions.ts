'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signIn } from '@/services/auth/auth-service'

export async function loginAction(input: {
  email: string
  password: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const result = await signIn(supabase, input.email, input.password)
  if (result.error) return result

  redirect('/dashboard/overview')
}

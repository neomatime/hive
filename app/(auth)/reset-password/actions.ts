'use server'

import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/services/auth/auth-service'

export async function updatePasswordAction(input: {
  password: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  return updatePassword(supabase, input.password)
}

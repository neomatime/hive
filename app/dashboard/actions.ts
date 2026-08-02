'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/services/auth/auth-service'

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await signOut(supabase)
  redirect('/login')
}

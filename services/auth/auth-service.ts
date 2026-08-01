import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function signIn(
  supabase: SupabaseClient<Database>,
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Invalid email or password.' }
  return { error: null }
}

export async function signOut(supabase: SupabaseClient<Database>): Promise<void> {
  await supabase.auth.signOut()
}

export async function requestPasswordReset(
  supabase: SupabaseClient<Database>,
  email: string,
  redirectTo: string
): Promise<void> {
  await supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(
  supabase: SupabaseClient<Database>,
  newPassword: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    return { error: 'Could not update password. Please try requesting a new reset link.' }
  }
  return { error: null }
}

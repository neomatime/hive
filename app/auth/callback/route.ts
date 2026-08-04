import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Completes the PKCE code-exchange for a real interactive sign-in (OAuth
 * providers like "Sign in with Microsoft"), as opposed to
 * app/auth/confirm/route.ts, which handles the invite/password-reset email
 * flow and always lands on /reset-password -- wrong for this case, since a
 * returning OAuth user should land in the app, not on a "set new password"
 * form.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/dashboard/overview', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Completes the Supabase PKCE code-exchange step for both password-reset and
 * invite emails.
 *
 * `@supabase/ssr`'s createServerClient/createBrowserClient hardcode
 * `flowType: 'pkce'`. With the default (unmodified) Supabase email
 * templates, the emailed link points at GoTrue's own `/verify` endpoint,
 * which validates the token server-side and then redirects to the
 * `redirectTo` URL with a `?code=...` query param. This route exchanges
 * that code for a real session and forwards the user to /reset-password,
 * which both the password-reset flow and the bootstrap invite flow use as
 * their shared landing page (Task 10's design).
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/reset-password', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}

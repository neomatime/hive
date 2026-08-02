'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type GateState = 'checking' | 'ready' | 'error'

/**
 * Establishes a client-side Supabase session before rendering `children`.
 * Used on /reset-password, which is the shared landing page for two
 * different kinds of email link:
 *
 * 1. Invite links (scripts/bootstrap-owner.ts's inviteUserByEmail). PKCE is
 *    not supported for invites -- auth-js's own doc comment on
 *    inviteUserByEmail explains why: "the browser initiating the invite is
 *    often different from the browser accepting the invite". So GoTrue's
 *    emailed link redirects here with `#access_token=...&refresh_token=...
 *    &type=invite` in the URL *fragment*, not a `?code=` query param.
 *    Browsers never send fragments to a server, so only client-side JS
 *    running on this page can read `window.location.hash` -- a route.ts
 *    handler (see app/auth/confirm/route.ts) can never see this, under any
 *    implementation. This component parses the fragment itself and calls
 *    `setSession()` directly to establish the session.
 *
 *    This deliberately does not rely on the Supabase SDK's own automatic
 *    `detectSessionInUrl` handling. Confirmed by reading
 *    node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:
 *    @supabase/ssr's createBrowserClient hardcodes `flowType: 'pkce'`
 *    (lib/supabase/client.ts uses it unmodified), and
 *    `_getSessionFromURL` actively throws AuthPKCEGrantCodeExchangeError
 *    when it sees an implicit-grant fragment (`access_token` in the URL)
 *    on a client configured for `flowType: 'pkce'`. That automatic attempt
 *    still runs on mount (inside the SDK's own internal `_initialize()`),
 *    but the error is swallowed internally and never thrown to our code,
 *    and -- critically -- it returns before ever reaching the line that
 *    would clear `window.location.hash`, so the fragment is still intact
 *    when we read it ourselves. `setSession()` is a separate, flow-agnostic
 *    method with no such gate: it accepts any valid access/refresh token
 *    pair regardless of the client's configured flowType.
 *
 * 2. Password-reset links. /auth/confirm's PKCE code exchange already ran
 *    server-side and set a session cookie before redirecting here, so
 *    there's no fragment at all in this case -- just an existing session
 *    to confirm via `getSession()`.
 *
 * Anything else (no fragment, no existing session) is an invalid or
 * expired link.
 *
 * Effect safety (double-invoke): the fragment is single-use -- it's
 * stripped from the URL the moment it's read, so if the effect body ever
 * ran twice on one mount, the second run would see an empty hash and fall
 * straight through to the "no session yet" branch while the first run's
 * setSession() network round-trip is still in flight, racing it to an
 * incorrect 'error' result. `startedRef` guards the entire async body so
 * the real work happens at most once per mount, no matter how many times
 * the effect itself is invoked -- including React StrictMode's dev-only
 * double-invoke (not observed for this component in live testing so far,
 * but not structurally impossible on a future React/Next version or a
 * Fast-Refresh remount, so this is defensive rather than reactive).
 *
 * Deliberately no `cancelled`/cleanup-flag guard on the setState calls:
 * setState on an unmounted component is a silent no-op in React 18+, and a
 * `cancelled` flag flipped by StrictMode's between-invocations cleanup
 * would incorrectly suppress the *first* run's result too, permanently
 * stranding the UI on "Verifying your link…" instead of fixing anything.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>('checking')
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function establishSession() {
      const supabase = createClient()
      const hash = window.location.hash

      if (hash.length > 1) {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const hasError = params.has('error') || params.has('error_description')

        // Strip the tokens from the URL/history unconditionally -- they're
        // single-use-ish credentials and shouldn't linger in the address
        // bar or browser history any longer than needed, whether or not
        // setSession succeeds.
        window.history.replaceState(null, '', window.location.pathname)

        if (accessToken && refreshToken && !hasError) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          setState(error ? 'error' : 'ready')
          return
        }

        setState('error')
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      setState(session ? 'ready' : 'error')
    }

    // Anything unexpected -- not one of auth-js's own {error} results
    // (already handled above), but a genuine throw, e.g. document.cookie
    // access blocked under strict cookie settings -- must still resolve to
    // the error state rather than leaving "Verifying your link…" stuck
    // forever with no recovery path.
    establishSession().catch(() => setState('error'))
  }, [])

  if (state === 'checking') {
    return (
      <p role="status" style={{ color: 'var(--text-muted)' }}>
        Verifying your link…
      </p>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-2">
        <p role="alert" style={{ color: 'var(--danger)' }}>
          This link is invalid or has expired.
        </p>
        <a
          href="/forgot-password"
          className="text-sm block"
          style={{ color: 'var(--color-ocean)' }}
        >
          Request a new link
        </a>
      </div>
    )
  }

  return <>{children}</>
}

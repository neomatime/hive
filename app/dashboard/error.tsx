'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // `error` must never be shown to the user (security.md §15: no internal error
  // details in the UI). Kept as a prop — not rendered — for a future step that
  // forwards it to server-side logging; `void` marks the non-use as intentional.
  void error

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: 'var(--space-16) 0' }}
    >
      <h3>Something went wrong</h3>
      <p style={{ color: 'var(--text-muted)' }}>
        Please try again. If the problem continues, contact whoever manages HIVE.
      </p>
      <button onClick={reset} className="underline text-sm" style={{ marginTop: 'var(--space-4)' }}>
        Try again
      </button>
    </div>
  )
}

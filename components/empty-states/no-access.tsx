export function NoAccess() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center"
      style={{ background: 'var(--background-app)', padding: 'var(--space-8)' }}
    >
      <h1>You don&apos;t have access</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Your account isn&apos;t an active member of the HIMARK workspace. Contact your workspace
        owner or admin.
      </p>
    </div>
  )
}

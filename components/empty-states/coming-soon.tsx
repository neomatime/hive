export function ComingSoon({ module }: { module: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: 'var(--space-16) 0' }}
    >
      <h3>{module} is coming soon</h3>
      <p style={{ color: 'var(--text-muted)' }}>
        This part of HIVE hasn&apos;t been built yet — it&apos;s planned for a later phase.
      </p>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background-app)' }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-lg"
        style={{ background: 'var(--background-surface)', boxShadow: 'var(--shadow-md)' }}
      >
        {children}
      </div>
    </div>
  )
}

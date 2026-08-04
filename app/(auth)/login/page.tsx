import { LoginForm } from '@/components/forms/login-form'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1>Welcome back</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Sign in to access <span style={{ color: 'var(--color-ocean)' }}>HIVE</span>
        </p>
      </div>
      <LoginForm />
    </div>
  )
}

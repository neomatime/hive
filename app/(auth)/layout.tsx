import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-dark relative min-h-screen overflow-hidden bg-background">
      <Image
        src="/brand/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-[18vh]">
        <div
          className="w-full max-w-md space-y-6 rounded-2xl border p-8 backdrop-blur-xl"
          style={{
            background: 'color-mix(in oklch, var(--color-midnight) 55%, transparent)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

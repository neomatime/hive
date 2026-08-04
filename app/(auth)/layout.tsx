import Image from 'next/image'
import { Plus_Jakarta_Sans } from 'next/font/google'

// This page's own hero-style heading, sourced from the brand assets folder
// alongside the background image -- deliberately not the app-wide Newsreader
// serif (styles/typography.css's h1 rule): login is a "welcome mat" moment
// with its own typographic personality, scoped here via --font-auth-heading
// and never touching the internal app's type system.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-auth-heading',
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`auth-dark relative min-h-screen overflow-hidden bg-background ${plusJakartaSans.variable}`}
    >
      <Image
        src="/brand/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-[6vh]">
        <div className="w-full max-w-md space-y-6 p-8">{children}</div>
      </div>
    </div>
  )
}

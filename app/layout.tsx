import '@/styles/global.css'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import Script from 'next/script'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import { THEME_STORAGE_KEY } from '@/lib/theme/theme-store'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
// Optical sizing + a restrained italic give this a ledger/report character
// rather than a trendy-blog one -- used only for page titles, never body text.
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('font-sans', geist.variable, geistMono.variable, newsreader.variable)}
      suppressHydrationWarning
    >
      <body>
        {/* beforeInteractive runs before hydration so the correct theme
            applies on first paint, avoiding a flash of the wrong theme.
            next/script (not a raw <script>) is required here -- Next.js
            warns about a bare <script> placed outside <head>/<body> in a
            known order. suppressHydrationWarning above pairs with it: this
            script intentionally adds a `dark` class the server never
            rendered, which is an expected mismatch, not a real bug. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

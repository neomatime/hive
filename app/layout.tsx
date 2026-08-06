import '@/styles/global.css'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
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
    >
      {/* Runs before hydration so the correct theme applies on first paint --
          without this, the page would flash light before React mounts and
          the ThemeToggle's useSyncExternalStore picks up the real value. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
        }}
      />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

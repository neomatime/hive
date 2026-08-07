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
      suppressHydrationWarning
    >
      <body>
        {/* Runs synchronously before hydration so the correct theme applies
            on first paint, avoiding a flash of the wrong theme. Must be a
            raw <script>, not next/script -- even with strategy=
            "beforeInteractive", next/script's inline-content path only
            queues the script into a self.__next_s array for the app bundle
            to execute post-load (see node_modules/next/dist/client/
            app-bootstrap.js); it does not run before paint despite the
            strategy name. Confirmed by inspecting actual build output
            (.next/server/app/*.html). A raw <script> placed as the first
            child of <body> (not <html>, which is invalid HTML and trips a
            different Next.js dev warning) executes synchronously as the
            HTML parser reaches it, before Providers/hydration -- which is
            what this needs. suppressHydrationWarning on <html> covers the
            resulting expected className mismatch (this script may add a
            `dark` class the server never rendered). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

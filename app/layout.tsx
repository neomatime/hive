import '@/styles/global.css'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Providers } from './providers'

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

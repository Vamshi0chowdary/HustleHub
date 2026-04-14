import type { Metadata } from 'next'
import { Manrope, Sora } from 'next/font/google'
import AppProviders from '@/components/providers/AppProviders'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'HustleHub | Premium AI Network',
  description:
    'HustleHub web experience for premium recommendation feed, creator discovery, and high-signal collaboration.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: ['/logo.png'],
    apple: [{ url: '/logo.png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='hustlehub-theme';var s=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(s==='dark'||s==='light')?s:(d?'dark':'light');var r=document.documentElement;if(t==='dark'){r.classList.add('dark')}else{r.classList.remove('dark')}r.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${sora.variable} ${manrope.variable} antialiased text-appText bg-appBg`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
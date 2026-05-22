import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Workout Log Calendar',
  description: 'Personal workout log calendar web application',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" className="light">
      <body className={`${outfit.variable} ${inter.variable} bg-background text-foreground min-h-screen flex flex-col font-sans`}>
        {user && <Navigation />}
        <main className="flex-1 w-full max-w-5xl mx-auto p-3 min-[390px]:p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  )
}


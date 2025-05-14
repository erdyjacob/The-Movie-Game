import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import TestDataLoader from "@/test-data-loader"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Movie Game",
  description: "Test your movie knowledge by connecting actors to movies they starred in",
  icons: {
    icon: "/images/TheMovieGamefavicon.svg",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense>
            {children}
            <TestDataLoader />
            <SpeedInsights />
            <Analytics />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}

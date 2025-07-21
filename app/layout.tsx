import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { MantineThemeProvider } from "@/components/mantine-theme-provider"
import '@mantine/core/styles.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Albatross - The Ultimate Flight School Management Dashboard",
  description: "Streamline your flight school operations with our comprehensive dashboard solution.",
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#ffffff',
    'theme-color': '#ffffff',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="light" storageKey="albatross-theme">
          <MantineThemeProvider>
            {children}
          </MantineThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"

import { ThemeProvider } from "@/components/theme-provider"
import { MantineThemeProvider } from "@/components/mantine-theme-provider"
import "./globals.css"
import '@mantine/core/styles.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SkyTrack Flight School",
  description: "Flight school management dashboard",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider defaultTheme="dark" storageKey="skytrack-theme">
          <MantineThemeProvider>
            {children}
            <Toaster position="top-right" />
          </MantineThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

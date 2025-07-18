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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light" storageKey="albatross-theme">
          <MantineThemeProvider>
            {children}
          </MantineThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

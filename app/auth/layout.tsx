import type React from "react"
import { Toaster } from "@/components/ui/sonner"
import { BackgroundProvider } from "@/contexts/background-context"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BackgroundProvider>
      {children}
      <Toaster />
    </BackgroundProvider>
  )
} 
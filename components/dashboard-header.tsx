import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  children: ReactNode
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 w-full justify-between">
        {children}
      </div>
    </header>
  )
}

import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  children: ReactNode
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          {children}
        </div>
        <div className="flex items-center gap-6 ml-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

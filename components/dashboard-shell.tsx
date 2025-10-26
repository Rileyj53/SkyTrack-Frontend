import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("container flex-1 items-start md:grid md:gap-8 py-8", className)}>
      <main className="flex w-full flex-col overflow-hidden">{children}</main>
    </div>
  )
}

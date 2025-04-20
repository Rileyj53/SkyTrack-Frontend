import type { ReactNode } from "react"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="container flex-1 items-start md:grid md:gap-8 py-8">
      <main className="flex w-full flex-col overflow-hidden">{children}</main>
    </div>
  )
}

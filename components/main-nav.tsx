"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plane } from "lucide-react"

import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
        <Plane className="h-7 w-7 text-primary" strokeWidth={2.5} />
        <span className="hidden font-bold sm:inline-block">SkyTrack Flight School</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/dashboard"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/dashboard" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/flight-log"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/flight-log" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Flight Log
        </Link>
        <Link
          href="/schedule"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/schedule" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Schedule
        </Link>
        <Link
          href="/students"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/students" || pathname.startsWith("/students/") ? "text-foreground" : "text-foreground/60",
          )}
        >
          Students
        </Link>
        <Link
          href="/aircraft"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/aircraft" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Aircraft
        </Link>
        <Link
          href="/instructors"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/instructors" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Instructors
        </Link>
        <Link
          href="/settings"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/settings" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Settings
        </Link>
      </nav>
    </div>
  )
}

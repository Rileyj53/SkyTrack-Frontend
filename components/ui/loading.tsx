import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { Skeleton } from "./skeleton"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "skeleton" | "minimal"
  text?: string
  className?: string
}

interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

export function Loading({ 
  size = "md", 
  variant = "spinner", 
  text = "Loading...",
  className 
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      </div>
    )
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      <span className={cn("font-medium text-muted-foreground", textSizes[size])}>
        {text}
      </span>
    </div>
  )
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-lg bg-card", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  )
}

export function LoadingTable({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-4 gap-4 p-4 border-b">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function LoadingPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center", className)}>
      <Loading size="lg" text="Loading application..." />
    </div>
  )
} 
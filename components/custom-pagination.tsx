"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CustomPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPrevious: () => void
  onNext: () => void
  hasNext: boolean
  hasPrev: boolean
  loading?: boolean
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
  hasNext,
  hasPrev,
  loading = false
}: CustomPaginationProps) {
  const renderPageButtons = () => {
    const buttons = []

    // Always show first page
    if (totalPages > 0) {
      buttons.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={loading}
          className="h-9 w-9 p-0"
        >
          1
        </Button>
      )
    }

    // Show ellipsis if there's a gap
    if (currentPage > 3 && totalPages > 4) {
      buttons.push(
        <div key="ellipsis-start" className="flex h-9 w-9 items-center justify-center">
          <MoreHorizontal className="h-4 w-4" />
        </div>
      )
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let page = start; page <= end; page++) {
      buttons.push(
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          disabled={loading}
          className="h-9 w-9 p-0"
        >
          {page}
        </Button>
      )
    }

    // Show ellipsis if there's a gap at the end
    if (currentPage < totalPages - 2 && totalPages > 4) {
      buttons.push(
        <div key="ellipsis-end" className="flex h-9 w-9 items-center justify-center">
          <MoreHorizontal className="h-4 w-4" />
        </div>
      )
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      buttons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={loading}
          className="h-9 w-9 p-0"
        >
          {totalPages}
        </Button>
      )
    }

    return buttons
  }

  return (
    <nav role="navigation" aria-label="pagination" className="mx-auto flex w-full justify-center">
      <div className="flex flex-row items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrev || loading}
          className="gap-1 pl-2.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        
        {renderPageButtons()}
        
        <Button
          variant="outline" 
          size="sm"
          onClick={onNext}
          disabled={!hasNext || loading}
          className="gap-1 pr-2.5"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
} 
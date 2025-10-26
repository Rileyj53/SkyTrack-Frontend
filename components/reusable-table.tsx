"use client"

import { useState, useMemo, ReactNode, useEffect, useRef } from "react"
import { Search, Filter, X } from "lucide-react"
import { Table, Group, Avatar, Text, Badge, Box } from '@mantine/core'
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export interface TableColumn<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T, index: number) => ReactNode
  sortable?: boolean
  searchable?: boolean
}

export interface FilterConfig {
  key: string
  label: string
  width?: string
  type?: 'select' | 'date' | 'time' // Added support for different filter types
  options?: Array<{ value: string; label: string }>
  defaultValue?: string
  serverSide?: boolean // Whether this filter should trigger API calls
  placeholder?: string // For date/time pickers
}

export interface PaginationConfig {
  enabled: boolean
  pageSize?: number
  serverSide?: boolean // Whether pagination is handled server-side
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
}

export interface EmptyStateConfig {
  title: string
  description: string
  searchTitle?: string
  searchDescription?: string
}

export interface ServerSideConfig {
  totalItems?: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onFiltersChange?: (filters: Record<string, string>) => void
  onSearchChange?: (searchQuery: string) => void
}

export interface ReusableTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  filterLoading?: boolean // Loading state for filters/search operations
  error?: string | null
  searchConfig?: {
    enabled: boolean
    placeholder?: string
    searchFields: (keyof T | string)[] // Allow nested paths like 'user_id.name'
    serverSide?: boolean // Whether search should trigger API calls
    debounceMs?: number
  }
  filters?: FilterConfig[]
  pagination?: PaginationConfig
  serverSide?: ServerSideConfig
  onRowClick?: (item: T, index: number) => void
  emptyState?: EmptyStateConfig
  className?: string
}

export function ReusableTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  filterLoading = false,
  error = null,
  searchConfig,
  filters = [],
  pagination,
  serverSide,
  onRowClick,
  emptyState = {
    title: 'No data available',
    description: 'There are no items to display at the moment.',
    searchTitle: 'No results found',
    searchDescription: 'No items match your search criteria.'
  },
  className = ""
}: ReusableTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    filters.reduce((acc, filter) => {
      if (filter.type === 'date' || filter.type === 'time') {
        acc[filter.key] = filter.defaultValue || ""
      } else {
        acc[filter.key] = filter.defaultValue || "all"
      }
      return acc
    }, {} as Record<string, string>)
  )
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(serverSide?.currentPage || 1)
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10)

  // Send initial filter values to parent on mount
  useEffect(() => {
    const hasServerSideFilters = filters.some(f => f.serverSide)
    if (hasServerSideFilters && serverSide?.onFiltersChange && Object.keys(filterValues).length > 0) {
      // Send initial filter values to parent
      serverSide.onFiltersChange(filterValues)
    }
  }, []) // Only run on mount

  // Filter popover state
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  
  // Search state for filter dropdowns
  const [filterSearchValues, setFilterSearchValues] = useState<Record<string, string>>({})

  // Debounced search for server-side
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  // Handle debounced search
  useEffect(() => {
    if (searchConfig?.serverSide) {
      const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery)
      }, searchConfig.debounceMs || 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, searchConfig?.serverSide, searchConfig?.debounceMs])

  // Trigger server-side search when debounced search changes
  useEffect(() => {
    if (searchConfig?.serverSide && serverSide?.onSearchChange) {
      serverSide.onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchConfig?.serverSide, serverSide?.onSearchChange])

  // Helper function to get nested property value
  const getNestedValue = (obj: T, path: keyof T | string): any => {
    if (typeof path !== 'string') return obj[path]
    
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined
    }, obj as any)
  }

  // Filter data based on search and filters (client-side only)
  const filteredData = useMemo(() => {
    if (searchConfig?.serverSide || filters.some(f => f.serverSide)) {
      // For server-side filtering, return data as-is
      return data
    }

    return data.filter((item) => {
      // Search filter (client-side only)
      if (searchConfig?.enabled && !searchConfig.serverSide && searchQuery) {
        const matchesSearch = searchConfig.searchFields.some(field => {
          const value = getNestedValue(item, field)
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(searchQuery.toLowerCase())
        })
        if (!matchesSearch) return false
      }

      // Other filters (client-side only)
      for (const filter of filters) {
        if (!filter.serverSide) {
          const filterValue = filterValues[filter.key]
          if (filterValue && filterValue !== "all") {
            const itemValue = getNestedValue(item, filter.key)
            if (itemValue !== filterValue) return false
          }
        }
      }

      return true
    })
  }, [data, searchQuery, filterValues, searchConfig, filters])

  // Paginated data (client-side pagination only)
  const paginatedData = useMemo(() => {
    if (pagination?.serverSide) {
      return filteredData
    }

    if (!pagination?.enabled) {
      return filteredData
    }

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, pageSize, pagination])

  // Calculate pagination info
  const totalItems = serverSide?.totalItems || filteredData.length
  const totalPages = serverSide?.totalPages || Math.ceil(totalItems / pageSize)
  const actualCurrentPage = serverSide?.currentPage || currentPage

  // Get unique values for filter options (if not provided)
  const getUniqueFilterValues = (key: string) => {
    const values = data.map(item => getNestedValue(item, key))
      .filter(value => value !== null && value !== undefined)
    return [...new Set(values)]
  }

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilterValues = { ...filterValues, [filterKey]: value }
    setFilterValues(newFilterValues)
    
    // Reset to first page when filters change
    if (pagination?.enabled) {
      const newPage = 1
      setCurrentPage(newPage)
      // Don't call onPageChange here - let onFiltersChange handle both the filter and page reset
    }

    // Trigger server-side filter change if any filters are server-side
    const hasServerSideFilters = filters.some(f => f.serverSide)
    if (hasServerSideFilters && serverSide?.onFiltersChange) {
      serverSide.onFiltersChange(newFilterValues)
    }
  }

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (serverSide?.onPageChange) {
      serverSide.onPageChange(page)
    }
  }

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page
    if (serverSide?.onPageSizeChange) {
      serverSide.onPageSizeChange(newPageSize)
    }
    if (serverSide?.onPageChange) {
      serverSide.onPageChange(1)
    }
  }

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (actualCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (actualCurrentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = actualCurrentPage - 1; i <= actualCurrentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Count active filters
  const activeFiltersCount = Object.values(filterValues).filter(value => value !== "all").length

  // Create skeleton rows for loading state
  const renderSkeletonRows = () => {
    const skeletonRowCount = pageSize || 10
    return Array.from({ length: skeletonRowCount }, (_, index) => (
      <Table.Tr key={`skeleton-${index}`}>
        {columns.map((column, colIndex) => (
          <Table.Td 
            key={`skeleton-${index}-${colIndex}`}
            style={{ 
              width: column.width || 'auto',
              textAlign: column.align || 'left'
            }}
          >
            {/* Different skeleton patterns based on column type */}
            {column.key === 'student' || column.header.toLowerCase().includes('student') || column.header.toLowerCase().includes('name') ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ) : column.header.toLowerCase().includes('progress') ? (
              <div className="flex items-center justify-center space-x-2">
                <Skeleton className="h-2 w-[60px] rounded-full" />
                <Skeleton className="h-3 w-[30px]" />
              </div>
            ) : column.header.toLowerCase().includes('status') || column.header.toLowerCase().includes('stage') ? (
              <Skeleton className="h-6 w-[80px] rounded-full" />
            ) : column.align === 'center' ? (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ) : (
              <Skeleton className="h-4 w-[90px]" />
            )}
          </Table.Td>
        ))}
      </Table.Tr>
    ))
  }

  // Show skeleton when loading AND there's no data (initial load)
  if (loading && data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Search skeleton */}
            {searchConfig?.enabled && (
              <div className="flex flex-1 items-center space-x-2">
                <Skeleton className="h-9 w-[300px]" />
              </div>
            )}
            
            {/* Filter skeleton */}
            {filters.length > 0 && (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-[100px]" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
              <Table.Thead>
                <Table.Tr>
                  {columns.map((column) => (
                    <Table.Th 
                      key={column.key}
                      style={{ 
                        width: column.width || 'auto',
                        textAlign: column.align || 'left'
                      }}
                    >
                      {column.header}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {renderSkeletonRows()}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </CardContent>

        {/* Pagination skeleton */}
        {pagination?.enabled && (
          <CardFooter className="flex items-center justify-between px-6 py-4">
            <Skeleton className="h-4 w-[200px]" />
            <div className="flex-1 flex justify-center">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-[70px]" />
                <Skeleton className="h-9 w-[32px]" />
                <Skeleton className="h-9 w-[32px]" />
                <Skeleton className="h-9 w-[32px]" />
                <Skeleton className="h-9 w-[70px]" />
              </div>
            </div>
            {pagination?.showPageSizeSelector && (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[70px]" />
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Search */}
          {searchConfig?.enabled && (
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchConfig.placeholder || "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ '--tw-ring-color': '#3366ff' } as any}
                  className="pl-8 pr-8 max-w-sm border-slate-200 focus:border-[#3366ff] dark:border-slate-700 dark:focus:border-[#3366ff]"
                />
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {/* Search loading indicator */}
                {searchConfig.serverSide && searchQuery !== debouncedSearch && (
                  <div className="absolute right-2 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Collapsible Filters */}
          {filters.length > 0 && (
            <div className="flex items-center space-x-2">
              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <UIBadge 
                        variant="secondary" 
                        className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {activeFiltersCount}
                      </UIBadge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filters</h4>
                      <p className="text-sm text-muted-foreground">
                        Apply filters to refine your search results.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {filters.map((filter) => (
                        <div key={filter.key} className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {filter.label}
                          </label>
                          {filter.type === 'date' ? (
                            <DatePicker
                              date={(() => {
                                const dateValue = filterValues[filter.key]
                                if (!dateValue || dateValue === '') return null
                                // Parse date as local date to avoid timezone issues
                                const [year, month, day] = dateValue.split('-').map(Number)
                                if (isNaN(year) || isNaN(month) || isNaN(day)) return null
                                const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
                                return isNaN(parsedDate.getTime()) ? null : parsedDate
                              })()}
                              setDate={(date) => {
                                if (date) {
                                  // Format date in local timezone to avoid UTC conversion issues
                                  const year = date.getFullYear()
                                  const month = String(date.getMonth() + 1).padStart(2, '0')
                                  const day = String(date.getDate()).padStart(2, '0')
                                  const localDateString = `${year}-${month}-${day}`
                                  handleFilterChange(filter.key, localDateString)
                                  // Close the popover when a date is selected
                                  setFilterPopoverOpen(false)
                                } else {
                                  handleFilterChange(filter.key, '')
                                }
                              }}
                              className="w-full"
                            />
                          ) : filter.type === 'time' ? (
                            <TimePicker
                              time={filterValues[filter.key] || ''}
                              setTime={(time) => handleFilterChange(filter.key, time || '')}
                              className="w-full"
                            />
                          ) : (
                            // Use Command for searchable dropdowns (instructor, student, and aircraft filters)
                            filter.key === 'instructor' || filter.key === 'student' || filter.key === 'aircraft' ? (
                              <Select 
                                value={filterValues[filter.key]} 
                                onValueChange={(value) => handleFilterChange(filter.key, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={filter.label}>
                                    {filterValues[filter.key] === "all" 
                                      ? `All ${filter.label}${filter.key === 'aircraft' ? '' : 's'}` 
                                      : (() => {
                                          // Find the display name for the selected value
                                          if (filterValues[filter.key] && filterValues[filter.key] !== "all") {
                                            const option = filter.options?.find(opt => opt.value === filterValues[filter.key])
                                            return option ? option.label : filterValues[filter.key]
                                          }
                                          return filter.label
                                        })()}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <Command>
                                    <CommandInput placeholder={`Search ${filter.label.toLowerCase()}...`} className="h-9" />
                                                                          <CommandList className="max-h-[200px]">
                                        <CommandEmpty>No {filter.label.toLowerCase()} found.</CommandEmpty>
                                        <CommandGroup>
                                          {(filter.options || []).map(option => (
                                            <CommandItem
                                              key={option.value}
                                              value={option.value}
                                              onSelect={() => {
                                                handleFilterChange(filter.key, option.value)
                                              }}
                                            >
                                              {option.label}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                  </Command>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Select 
                                value={filterValues[filter.key]} 
                                onValueChange={(value) => handleFilterChange(filter.key, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={filter.label} />
                                </SelectTrigger>
                                <SelectContent>
                                  {filter.options && filter.options.length > 0 
                                    ? filter.options.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))
                                    : (
                                      <>
                                        <SelectItem value="all">All {filter.label}</SelectItem>
                                        {getUniqueFilterValues(filter.key).map(value => (
                                          <SelectItem key={String(value)} value={String(value)}>
                                            {String(value)}
                                          </SelectItem>
                                        ))}
                                      </>
                                    )
                                  }
                                </SelectContent>
                              </Select>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                    {activeFiltersCount > 0 && (
                      <div className="pt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const resetFilters = filters.reduce((acc, filter) => {
                              if (filter.type === 'date' || filter.type === 'time') {
                                acc[filter.key] = ""
                              } else {
                                acc[filter.key] = "all"
                              }
                              return acc
                            }, {} as Record<string, string>)
                            setFilterValues(resetFilters)
                            if (serverSide?.onFiltersChange) {
                              serverSide.onFiltersChange(resetFilters)
                            }
                          }}
                          className="w-full"
                        >
                          Clear all filters
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table.ScrollContainer minWidth={900}>
          <Table verticalSpacing="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
            <Table.Thead>
              <Table.Tr>
                {columns.map((column) => (
                  <Table.Th 
                    key={column.key}
                    style={{ 
                      width: column.width || 'auto',
                      textAlign: column.align || 'left',
                      maxWidth: column.width || 'auto',
                      overflow: 'hidden'
                    }}
                    className="px-3 py-3 font-medium text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.header}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="space-y-2 text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {searchQuery ? emptyState.searchTitle || emptyState.title : emptyState.title}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {searchQuery 
                            ? emptyState.searchDescription || `No items match "${searchQuery}". Try adjusting your search terms.`
                            : emptyState.description
                          }
                        </p>
                      </div>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedData.map((item, index) => (
                  <Table.Tr 
                    key={index}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {columns.map((column) => (
                      <Table.Td 
                        key={column.key}
                        style={{ 
                          width: column.width || 'auto',
                          textAlign: column.align || 'left',
                          maxWidth: column.width || 'auto',
                          overflow: 'hidden'
                        }}
                        className="px-3 py-2"
                      >
                        {column.render ? column.render(item, index) : getNestedValue(item, column.key)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </CardContent>

      {/* Pagination Footer */}
      {pagination?.enabled && (
        <CardFooter className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center text-sm text-muted-foreground">
            {totalPages === 1 
              ? `Showing ${totalItems} of ${totalItems} results`
              : `Showing ${Math.min((actualCurrentPage - 1) * pageSize + 1, totalItems)} to ${Math.min(actualCurrentPage * pageSize, totalItems)} of ${totalItems} results`
            }
          </div>
          
          {/* Centered Pagination - only show if more than 1 page */}
          <div className="flex-1 flex justify-center">
            {totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (actualCurrentPage > 1) {
                          handlePageChange(actualCurrentPage - 1)
                        }
                      }}
                      className={actualCurrentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {generatePageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={page === actualCurrentPage}
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(page as number)
                          }}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (actualCurrentPage < totalPages) {
                          handlePageChange(actualCurrentPage + 1)
                        }
                      }}
                      className={actualCurrentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              // Empty space to maintain layout when no pagination needed
              <div></div>
            )}
          </div>

          {/* Page Size Selector on the Right - always show if enabled */}
          {pagination?.showPageSizeSelector && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(pagination.pageSizeOptions || [10, 25, 50, 100]).map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

// Export common cell renderers for convenience
export const TableCellRenderers = {
  Avatar: ({ name, email, size = 32 }: { name?: string; email?: string; size?: number }) => (
    <Group gap="xs">
      <Avatar size={size} radius={size} color="blue">
        {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : email?.[0]?.toUpperCase() || '?'}
      </Avatar>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Text fz="sm" fw={500} truncate>{name || email}</Text>
        {name && email && <Text c="dimmed" fz="xs" truncate>{email}</Text>}
      </div>
    </Group>
  ),
  
  Badge: ({ value, variant = "outline", color }: { value: string; variant?: string; color?: string }) => (
    <Badge variant={variant as any} color={color} size="sm">{value}</Badge>
  ),
  
  Progress: ({ value, showText = true }: { value: number; showText?: boolean }) => (
    <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      <div className="w-[60px] bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showText && (
        <Text fz="xs" style={{ minWidth: '30px' }}>
          {value}%
        </Text>
      )}
    </Box>
  ),
  
  MonospaceText: ({ value }: { value: string | number }) => (
    <Text fz="sm" style={{ fontFamily: 'monospace' }}>{value}</Text>
  )
} 
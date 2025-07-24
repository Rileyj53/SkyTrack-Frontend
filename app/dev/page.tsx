"use client"

import React, { useState } from 'react';
import { MainNav } from "@/components/main-nav-new"
import { ReusableTable, TableColumn, FilterConfig, TableCellRenderers, PaginationConfig, ServerSideConfig } from "@/components/reusable-table"
import { Badge } from "@/components/ui/badge"

// Sample data for demonstration
interface SampleStudent {
  id: string
  name: string
  email: string
  program: string
  status: string
  stage: string
  progress: number
  flightHours: number
  licenseNumber: string
  nextMilestone: string
}

const sampleData: SampleStudent[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    program: "Private Pilot License",
    status: "Active",
    stage: "Pre-Solo",
    progress: 65,
    flightHours: 25.5,
    licenseNumber: "PPL-001",
    nextMilestone: "First Solo Flight"
  },
  {
    id: "2", 
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    program: "Commercial Pilot License",
    status: "Active",
    stage: "Cross Country",
    progress: 78,
    flightHours: 145.2,
    licenseNumber: "CPL-007",
    nextMilestone: "Commercial Checkride"
  },
  {
    id: "3",
    name: "Mike Davis",
    email: "mike.davis@example.com", 
    program: "Instrument Rating",
    status: "On Hold",
    stage: "Instrument Training",
    progress: 45,
    flightHours: 67.8,
    licenseNumber: "IR-003",
    nextMilestone: "IFR Written Exam"
  },
  {
    id: "4",
    name: "Emily Wilson",
    email: "emily.wilson@example.com",
    program: "Private Pilot License", 
    status: "Graduated",
    stage: "Completed",
    progress: 100,
    flightHours: 75.0,
    licenseNumber: "PPL-012",
    nextMilestone: "N/A"
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.brown@example.com",
    program: "Commercial Pilot License",
    status: "Active",
    stage: "Pre-Solo", 
    progress: 32,
    flightHours: 18.5,
    licenseNumber: "CPL-015",
    nextMilestone: "Pattern Work"
  },
  {
    id: "6",
    name: "Jennifer Taylor",
    email: "jennifer.taylor@example.com",
    program: "Private Pilot License",
    status: "Active",
    stage: "Solo Cross Country",
    progress: 85,
    flightHours: 42.3,
    licenseNumber: "PPL-018",
    nextMilestone: "Private Pilot Checkride"
  },
  {
    id: "7",
    name: "Robert Garcia",
    email: "robert.garcia@example.com",
    program: "Instrument Rating",
    status: "Active",
    stage: "Instrument Training",
    progress: 62,
    flightHours: 89.7,
    licenseNumber: "IR-021",
    nextMilestone: "Instrument Checkride"
  },
  {
    id: "8",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    program: "Commercial Pilot License",
    status: "Graduated",
    stage: "Completed",
    progress: 100,
    flightHours: 203.5,
    licenseNumber: "CPL-025",
    nextMilestone: "N/A"
  },
  {
    id: "9",
    name: "Kevin Martinez",
    email: "kevin.martinez@example.com",
    program: "Private Pilot License",
    status: "On Hold",
    stage: "Pre-Solo",
    progress: 28,
    flightHours: 12.1,
    licenseNumber: "PPL-030",
    nextMilestone: "Medical Certificate Renewal"
  },
  {
    id: "10",
    name: "Amanda White",
    email: "amanda.white@example.com",
    program: "Commercial Pilot License",
    status: "Active",
    stage: "Cross Country",
    progress: 71,
    flightHours: 156.8,
    licenseNumber: "CPL-033",
    nextMilestone: "Complex Aircraft Training"
  },
  {
    id: "11",
    name: "Thomas Rodriguez",
    email: "thomas.rodriguez@example.com",
    program: "Instrument Rating",
    status: "Active",
    stage: "Instrument Training",
    progress: 54,
    flightHours: 95.2,
    licenseNumber: "IR-037",
    nextMilestone: "Hood Time Practice"
  },
  {
    id: "12",
    name: "Jessica Thompson",
    email: "jessica.thompson@example.com",
    program: "Private Pilot License",
    status: "Graduated",
    stage: "Completed",
    progress: 100,
    flightHours: 68.9,
    licenseNumber: "PPL-041",
    nextMilestone: "N/A"
  }
]

const statusBadgeStyles: Record<string, React.CSSProperties> = {
  active: {
    background: '#c2f0c2',
    border: '2px solid #33cc33',
    color: '#111',
    fontWeight: 500,
  },
  graduated: {
    background: '#b3c6ff',
    border: '2px solid #3366ff',
    color: '#111',
    fontWeight: 500,
  },
  'on hold': {
    background: '#f0b3ff',
    border: '2px solid #cc00ff',
    color: '#111',
    fontWeight: 500,
  },
}

export default function DashboardDev() {
  // State for demonstration of server-side features
  const [currentData, setCurrentData] = useState(sampleData)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")

  // Simulate server-side filtering and pagination
  const simulateServerSideData = () => {
    let filteredData = [...sampleData]

    // Apply search
    if (searchQuery) {
      filteredData = filteredData.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        filteredData = filteredData.filter(student => student[key as keyof SampleStudent] === value)
      }
    })

    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = filteredData.slice(startIndex, endIndex)

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage
    }
  }

  const serverSideResult = simulateServerSideData()

  // Define table columns
  const columns: TableColumn<SampleStudent>[] = [
    {
      key: 'student',
      header: 'Student',
      width: '20%',
      render: (student) => (
        <TableCellRenderers.Avatar 
          name={student.name}
          email={student.email}
        />
      )
    },
    {
      key: 'licenseNumber',
      header: 'License #',
      width: '10%',
      render: (student) => (
        <TableCellRenderers.MonospaceText value={student.licenseNumber} />
      )
    },
    {
      key: 'program',
      header: 'Program',
      width: '15%'
    },
    {
      key: 'stage',
      header: 'Stage', 
      width: '10%',
      render: (student) => (
        <Badge variant="outline">{student.stage}</Badge>
      )
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '15%',
      align: 'center',
      render: (student) => (
        <TableCellRenderers.Progress value={student.progress} />
      )
    },
    {
      key: 'flightHours',
      header: 'Flight Hours',
      width: '10%',
      align: 'center',
      render: (student) => (
        <TableCellRenderers.MonospaceText value={`${student.flightHours} hrs`} />
      )
    },
    {
      key: 'nextMilestone',
      header: 'Next Milestone',
      width: '15%'
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      align: 'center',
      render: (student) => (
        <Badge
          style={statusBadgeStyles[student.status.toLowerCase()] || statusBadgeStyles['active']}
          variant="outline"
        >
          {student.status}
        </Badge>
      )
    }
  ]

  // Define filters with server-side support
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      width: 'w-[130px]',
      serverSide: true, // This filter will trigger API calls
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Graduated', label: 'Graduated' },
        { value: 'On Hold', label: 'On Hold' }
      ]
    },
    {
      key: 'program',
      label: 'Program',
      width: 'w-[160px]',
      serverSide: true, // This filter will trigger API calls
      options: [
        { value: 'Private Pilot License', label: 'Private Pilot License' },
        { value: 'Commercial Pilot License', label: 'Commercial Pilot License' },
        { value: 'Instrument Rating', label: 'Instrument Rating' }
      ]
    },
    {
      key: 'stage',
      label: 'Stage',
      width: 'w-[140px]',
      serverSide: false, // This filter will be handled client-side
      options: [
        { value: 'Pre-Solo', label: 'Pre-Solo' },
        { value: 'Cross Country', label: 'Cross Country' },
        { value: 'Solo Cross Country', label: 'Solo Cross Country' },
        { value: 'Instrument Training', label: 'Instrument Training' },
        { value: 'Completed', label: 'Completed' }
      ]
    }
  ]

  // Pagination configuration
  const paginationConfig: PaginationConfig = {
    enabled: true,
    pageSize: pageSize,
    serverSide: true, // Enable server-side pagination
    showPageSizeSelector: true,
    pageSizeOptions: [5, 10, 25, 50]
  }

  // Server-side configuration
  const serverSideConfig: ServerSideConfig = {
    totalItems: serverSideResult.totalItems,
    currentPage: serverSideResult.currentPage,
    totalPages: serverSideResult.totalPages,
    onPageChange: (page) => {
      console.log('Page changed to:', page)
      setCurrentPage(page)
    },
    onPageSizeChange: (newPageSize) => {
      console.log('Page size changed to:', newPageSize)
      setPageSize(newPageSize)
      setCurrentPage(1)
    },
    onFiltersChange: (newFilters) => {
      console.log('Filters changed:', newFilters)
      setFilters(newFilters)
      setCurrentPage(1)
    },
    onSearchChange: (query) => {
      console.log('Search changed:', query)
      setSearchQuery(query)
      setCurrentPage(1)
    }
  }

  const handleRowClick = (student: SampleStudent, index: number) => {
    console.log('Clicked on student:', student.name, 'at index:', index)
    alert(`Clicked on ${student.name}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Development Page</h1>
            <p className="text-muted-foreground mb-4">
              Testing the new reusable table component with pagination and API filtering capabilities.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pagination</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Server-side pagination with page size selector (showing {pageSize} items per page)
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                <h3 className="font-semibold text-green-900 dark:text-green-100">API Filtering</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Status & Program filters trigger "API calls", Stage filter is client-side
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Search</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Debounced server-side search with 500ms delay
                </p>
              </div>
            </div>
          </div>

          <ReusableTable
            data={serverSideResult.data}
            columns={columns}
            searchConfig={{
              enabled: true,
              placeholder: "Search students...",
              searchFields: ['name', 'email', 'program', 'nextMilestone', 'licenseNumber'],
              serverSide: true, // Enable server-side search
              debounceMs: 500
            }}
            filters={filterConfigs}
            pagination={paginationConfig}
            serverSide={serverSideConfig}
            onRowClick={handleRowClick}
            emptyState={{
              title: 'No students found',
              description: 'There are no students enrolled in any programs.',
              searchTitle: 'No students match your search',
              searchDescription: 'Try adjusting your search terms or filters.'
            }}
          />

          {/* Debug information */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>Current Page: {currentPage}</p>
              <p>Page Size: {pageSize}</p>
              <p>Total Items: {serverSideResult.totalItems}</p>
              <p>Total Pages: {serverSideResult.totalPages}</p>
              <p>Active Filters: {JSON.stringify(filters)}</p>
              <p>Search Query: "{searchQuery}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
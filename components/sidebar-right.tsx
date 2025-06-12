"use client";

import * as React from "react"
import { useState, useEffect } from "react"
import { Edit, Trash2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Student {
  _id: string;
  school_id: string;
  user_id: {
    _id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  contact_email: string;
  phone: string;
  certifications: string[];
  license_number: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  enrollmentDate: string;
  program: string;
  status: string;
  stage: string;
  nextMilestone: string;
  notes: string;
  progress: {
    requirements: any[];
    milestones: any[];
    stages: any[];
    lastUpdated: string;
  };
  studentNotes: any[];
  created_at: string;
  updated_at: string;
  __v: number;
}

const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
};

function UsersTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;
  
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = students.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const schoolId = localStorage.getItem("schoolId");
        
        if (!token || !schoolId) {
          setError("Missing authentication or school information");
          return;
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students`;
        console.log('Fetching students from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
            "X-CSRF-Token": localStorage.getItem("csrfToken") || "",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`);
        }

        const data = await response.json();
        console.log('Students data received:', data);
        setStudents(data.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const rows = currentUsers.map((item) => (
    <TableRow key={item.user_id?.email || item._id} style={{ height: '48px', minHeight: '48px' }}>
      <TableCell className="p-2" style={{ height: '48px' }}>
        <div className="flex items-center gap-2 h-8">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {item.user_id?.first_name?.[0] || '?'}{item.user_id?.last_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate h-4">
              {item.user_id?.first_name || 'Unknown'} {item.user_id?.last_name || 'User'}
            </div>
            <div className="text-xs text-muted-foreground truncate h-4">
              {item.user_id?.email || item.contact_email || 'No email'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="p-2" style={{ height: '48px' }}>
        <div className="space-y-1 h-8">
          <Badge variant={statusColors[item.status?.toLowerCase()] || "outline"} className="text-xs px-1 py-0 h-4">
            {item.status || 'Unknown'}
          </Badge>
          <div className="text-xs text-muted-foreground truncate h-4">{item.program || 'No program'}</div>
        </div>
      </TableCell>
    </TableRow>
  ));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-3">
        <div className="text-center text-sm text-muted-foreground">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-3">
        <div className="text-center text-sm text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 text-xs">Student</TableHead>
            <TableHead className="p-2 text-xs">Status & Program</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows}
          {/* Add empty rows to maintain consistent height */}
          {Array.from({ length: Math.max(0, itemsPerPage - currentUsers.length) }, (_, i) => (
            <TableRow key={`empty-${i}`} style={{ height: '48px', minHeight: '48px' }}>
              <TableCell className="p-2" style={{ height: '48px' }}>
                <div className="flex items-center gap-2 h-8">
                  <div className="h-6 w-6"></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate h-4">&nbsp;</div>
                    <div className="text-xs text-muted-foreground truncate h-4">&nbsp;</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2" style={{ height: '48px' }}>
                <div className="space-y-1 h-8">
                  <div className="text-xs px-1 py-0 h-4">&nbsp;</div>
                  <div className="text-xs text-muted-foreground truncate h-4">&nbsp;</div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page);
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      style={{ "--sidebar-width": "30rem" } as React.CSSProperties}
      {...props}
    >
      <SidebarContent className="flex flex-col">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Students</h3>
          <UsersTable />
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

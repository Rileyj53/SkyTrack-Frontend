'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, Group, Avatar, Text, Badge, ActionIcon, Box } from '@mantine/core';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';

interface Student {
  _id: string;
  user_id?: {
    _id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  contact_email: string;
  program: string;
  status: string;
  stage: string;
  nextMilestone: string;
  progress: {
    requirements: {
      name: string;
      total_hours: number;
      completed_hours: number;
      _id: string;
    }[];
    lastUpdated: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalStudents: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Program {
  _id: string;
  program_name: string;
  requirements: {
    name: string;
    hours: number;
    _id: string;
  }[];
  description: string;
  duration: string;
  cost: number;
}

interface StudentProgressProps {
  className?: string;
  fullView?: boolean;
}

const statusColors: Record<string, string> = {
  active: '#33cc33',
  graduated: '#3366ff',
  'on hold': '#cc00ff',
  discontinued: '#f90606',
  pending: '#f2f20d',
};

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
  discontinued: {
    background: '#fc9c9c',
    border: '2px solid #f90606',
    color: '#111',
    fontWeight: 500,
  },
  pending: {
    background: '#fbfbb6',
    border: '2px solid #f2f20d',
    color: '#111',
    fontWeight: 500,
  },
};

export function StudentProgress({ className, fullView = false }: StudentProgressProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    hasNext: false,
    hasPrev: false,
  });

  const STUDENTS_PER_PAGE = fullView ? 10 : 4;

  useEffect(() => {
    // Get user role from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        setUserRole(payload.role);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const schoolId = localStorage.getItem('schoolId');
        const token = localStorage.getItem('token');

        if (!schoolId || !token) {
          throw new Error('School ID or authentication token not found');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/programs`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch programs');
        }

        const data = await response.json();
        setPrograms(data.programs || []);
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };

    fetchPrograms();
  }, []);

  const fetchStudents = useCallback(
    async (page = 1, search = '') => {
      try {
        setLoading(true);
        setError(null);

        const schoolId = localStorage.getItem('schoolId');
        const token = localStorage.getItem('token');

        if (!schoolId || !token) {
          throw new Error('School ID or authentication token not found');
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: STUDENTS_PER_PAGE.toString(),
        });

        if (search.trim()) {
          params.append('search', search.trim());
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        setStudents(data.students || []);

        if (data.pagination) {
          setPagination({
            ...data.pagination,
            hasNext: data.pagination.hasNextPage,
            hasPrev: data.pagination.hasPrevPage,
            currentPage: page,
          });
        } else {
          const totalStudents = data.students?.length || 0;
          const totalPages = Math.ceil(totalStudents / STUDENTS_PER_PAGE);
          setPagination({
            currentPage: page,
            totalPages,
            totalStudents,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [STUDENTS_PER_PAGE]
  );

  useEffect(() => {
    fetchStudents(1, searchQuery);
  }, [fetchStudents]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchStudents(1, searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchStudents]);

  const calculateProgress = useCallback((student: Student) => {
    const totalFlightTime = student.progress.requirements.find((req) => req.name === 'Total Flight Time');
    if (!totalFlightTime) return 0;
    return Math.min(Math.round((totalFlightTime.completed_hours / totalFlightTime.total_hours) * 100), 100);
  }, []);

  const calculateFlightHours = useCallback((student: Student) => {
    const totalFlightTime = student.progress.requirements.find((req) => req.name === 'Total Flight Time');
    return totalFlightTime?.completed_hours || 0;
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      if (loading) return;
      setCurrentPage(page);
      fetchStudents(page, searchQuery);
    },
    [loading, searchQuery, fetchStudents]
  );

  const handlePrevious = useCallback(() => {
    if (loading || !pagination.hasPrev) return;
    setCurrentPage(prevPage => {
      const newPage = prevPage - 1;
      fetchStudents(newPage, searchQuery);
      return newPage;
    });
  }, [loading, pagination.hasPrev, fetchStudents, searchQuery]);

  const handleNext = useCallback(() => {
    if (loading || !pagination.hasNext) return;
    setCurrentPage(prevPage => {
      const newPage = prevPage + 1;
      fetchStudents(newPage, searchQuery);
      return newPage;
    });
  }, [loading, pagination.hasNext, fetchStudents, searchQuery]);

  const generateSkeletonRows = useMemo(() => {
    return Array.from({ length: STUDENTS_PER_PAGE }, (_, index) => (
      <Table.Tr key={`skeleton-${index}`}>
        <Table.Td style={{ width: '40%' }}>
          <Group gap="xs">
            <Skeleton className="h-[20px] w-[20px] rounded-full" />
            <Skeleton className="h-[16px] w-[120px] rounded-full" />
          </Group>
        </Table.Td>
        <Table.Td style={{ width: '35%', textAlign: 'center' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Skeleton className="h-[8px] w-[70px] rounded-full" />
            <Skeleton className="h-[14px] w-[30px] rounded-full" />
          </Box>
        </Table.Td>
        <Table.Td style={{ width: '120px', maxWidth: '120px' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skeleton className="h-[8px] w-[50px] rounded-full" />
            <Skeleton className="h-[16px] w-[30px] rounded-full" />
          </Box>
        </Table.Td>
        {fullView && (
          <Table.Td style={{ width: '100px', minWidth: '80px', flexShrink: 0 }}>
            <Skeleton className="h-[20px] w-[60px] rounded-full" />
          </Table.Td>
        )}
        {fullView && (
          <Table.Td style={{ width: '150px', minWidth: '100px', flexShrink: 1 }}>
            <Skeleton className="h-[20px] w-[80px] rounded-full" />
          </Table.Td>
        )}
        <Table.Td style={{ width: '25%', textAlign: 'center' }}>
          <Skeleton className="h-[20px] w-[60px] rounded-full" />
        </Table.Td>
        {fullView && (
          <Table.Td style={{ width: '80px', minWidth: '70px', flexShrink: 0 }}>
            <Group gap={0} justify="flex-end">
              <Skeleton className="h-[32px] w-[32px] rounded-full" />
              <Skeleton className="h-[32px] w-[32px] rounded-full ml-1" />
            </Group>
          </Table.Td>
        )}
      </Table.Tr>
    ));
  }, [STUDENTS_PER_PAGE, fullView]);

  const studentRows = useMemo(() => {
    return students.map((student) => (
      <Table.Tr key={student._id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/students/${student._id}`)}>
        <Table.Td style={{ width: '40%' }}>
          <Group gap="xs">
            <Avatar size={20} radius={20} color="blue">
              {student.user_id ? `${student.user_id.first_name?.[0] || ''}${student.user_id.last_name?.[0] || ''}` : student.contact_email?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text fz="xs" fw={500} truncate>
                {student.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}` : student.contact_email}
              </Text>
              <Text c="dimmed" fz="xs" truncate>
                {student.program}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td style={{ width: '35%', textAlign: 'center' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Progress value={calculateProgress(student)} className="w-[70px]" />
            <Text fz="xs" style={{ minWidth: '30px' }}>{calculateProgress(student)}%</Text>
          </Box>
        </Table.Td>
        {fullView && (
          <Table.Td style={{ width: '100px', minWidth: '80px', flexShrink: 0 }}>
            <Text fz="sm">{calculateFlightHours(student)} hrs</Text>
          </Table.Td>
        )}
        {fullView && (
          <Table.Td style={{ width: '150px', minWidth: '100px', flexShrink: 1 }}>
            <Text fz="sm" truncate>{student.nextMilestone}</Text>
          </Table.Td>
        )}
        <Table.Td style={{ width: '25%', textAlign: 'center' }}>
          <Badge
            style={statusBadgeStyles[student.status.toLowerCase()] || statusBadgeStyles['pending']}
            variant="outline"
            size="sm"
          >
            {student.status}
          </Badge>
        </Table.Td>
        {fullView && (
          <Table.Td style={{ width: '80px', minWidth: '70px', flexShrink: 0 }}>
            <Group gap={0} justify="flex-end">
              <ActionIcon variant="subtle" color="gray">
                <Pencil size={16} strokeWidth={1.5} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red">
                <Trash2 size={16} strokeWidth={1.5} />
              </ActionIcon>
            </Group>
          </Table.Td>
        )}
      </Table.Tr>
    ));
  }, [students, fullView, calculateProgress, calculateFlightHours, router]);

  const paginationItems = useMemo(() => {
    const items = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;

    // Always show first page
    if (totalPages > 0) {
      items.push(
        <PaginationItem key={1}>
                      <Button
              variant={currentPage === 1 ? "outline" : "ghost"}
              size="icon"
              onClick={() => {
                if (!loading) handlePageChange(1);
              }}
            >
            1
          </Button>
        </PaginationItem>
      );
    }

    // Show ellipsis if there's a gap
    if (currentPage > 3 && totalPages > 4) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page++) {
      items.push(
        <PaginationItem key={page}>
          <Button
            variant={currentPage === page ? "outline" : "ghost"}
            size="icon"
            onClick={() => {
              if (!loading) handlePageChange(page);
            }}
          >
            {page}
          </Button>
        </PaginationItem>
      );
    }

    // Show ellipsis if there's a gap at the end
    if (currentPage < totalPages - 2 && totalPages > 4) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <Button
            variant={currentPage === totalPages ? "outline" : "ghost"}
            size="icon"
            onClick={() => {
              if (!loading) handlePageChange(totalPages);
            }}
          >
            {totalPages}
          </Button>
        </PaginationItem>
      );
    }

    return items;
  }, [pagination.totalPages, pagination.currentPage, loading, handlePageChange]);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Unable to load student data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20">
              <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load students</h3>
              <p className="text-sm text-muted-foreground max-w-sm">There was an error loading student data. Please try refreshing the page.</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Student Progress</CardTitle>
        <CardDescription>{fullView ? 'Complete student progress tracking' : 'Overview of student training progress'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm" />
          {!fullView && (
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto mt-2 sm:mt-0">
              <Link href="/students">View All Students</Link>
            </Button>
          )}
        </div>

        <Table.ScrollContainer minWidth={400}>
          <Table verticalSpacing="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '40%' }}>Student</Table.Th>
                <Table.Th style={{ width: '35%', textAlign: 'center' }}>Progress</Table.Th>
                {fullView && <Table.Th style={{ width: '100px', textAlign: 'center' }}>Flight Hours</Table.Th>}
                {fullView && <Table.Th style={{ width: '150px', textAlign: 'center' }}>Next Milestone</Table.Th>}
                <Table.Th style={{ width: '25%', textAlign: 'center' }}>Status</Table.Th>
                {fullView && <Table.Th style={{ width: '80px' }} />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                generateSkeletonRows
              ) : students.length > 0 ? (
                <>
                  {students.map((student) => (
                    <Table.Tr key={student._id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/students/${student._id}`)}>
                      <Table.Td style={{ width: '40%' }}>
                        <Group gap="xs">
                          <Avatar size={20} radius={20} color="blue">
                            {student.user_id ? `${student.user_id.first_name?.[0] || ''}${student.user_id.last_name?.[0] || ''}` : student.contact_email?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Text fz="xs" fw={500} truncate>
                              {student.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}` : student.contact_email}
                            </Text>
                            <Text c="dimmed" fz="xs" truncate>
                              {student.program}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ width: '35%', textAlign: 'center' }}>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <Progress value={calculateProgress(student)} className="w-[70px]" />
                          <Text fz="xs" style={{ minWidth: '30px' }}>{calculateProgress(student)}%</Text>
                        </Box>
                      </Table.Td>
                      {fullView && (
                        <Table.Td style={{ width: '100px', minWidth: '80px', flexShrink: 0 }}>
                          <Text fz="sm">{calculateFlightHours(student)} hrs</Text>
                        </Table.Td>
                      )}
                      {fullView && (
                        <Table.Td style={{ width: '150px', minWidth: '100px', flexShrink: 1 }}>
                          <Text fz="sm" truncate>{student.nextMilestone}</Text>
                        </Table.Td>
                      )}
                      <Table.Td style={{ width: '25%', textAlign: 'center' }}>
                        <Badge
                          style={statusBadgeStyles[student.status.toLowerCase()] || statusBadgeStyles['pending']}
                          variant="outline"
                          size="sm"
                        >
                          {student.status}
                        </Badge>
                      </Table.Td>
                      {fullView && (
                        <Table.Td style={{ width: '80px', minWidth: '70px', flexShrink: 0 }}>
                          <Group gap={0} justify="flex-end">
                            <ActionIcon variant="subtle" color="gray">
                              <Pencil size={16} strokeWidth={1.5} />
                            </ActionIcon>
                            <ActionIcon variant="subtle" color="red">
                              <Trash2 size={16} strokeWidth={1.5} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                  {Array.from({ length: STUDENTS_PER_PAGE - students.length }, (_, index) => (
                    <Table.Tr key={`empty-${index}`}>
                      <Table.Td style={{ width: '40%', height: '60px' }}>
                        <Group gap="xs">
                          <Skeleton className="h-[20px] w-[20px] rounded-full" />
                          <div>
                            <Skeleton className="h-[14px] w-[120px] rounded-full mb-1" />
                            <Skeleton className="h-[12px] w-[90px] rounded-full" />
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ width: '35%', textAlign: 'center', height: '60px' }}>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <Skeleton className="h-[8px] w-[70px] rounded-full" />
                          <Skeleton className="h-[14px] w-[30px] rounded-full" />
                        </Box>
                      </Table.Td>
                      {fullView && (
                        <Table.Td style={{ width: '100px', minWidth: '80px', flexShrink: 0, height: '60px' }}>
                          <Skeleton className="h-[16px] w-[60px] rounded-full" />
                        </Table.Td>
                      )}
                      {fullView && (
                        <Table.Td style={{ width: '150px', minWidth: '100px', flexShrink: 1, height: '60px' }}>
                          <Skeleton className="h-[16px] w-[80px] rounded-full" />
                        </Table.Td>
                      )}
                      <Table.Td style={{ width: '25%', textAlign: 'center', height: '60px' }}>
                        <Skeleton className="h-[20px] w-[60px] rounded-full" />
                      </Table.Td>
                      {fullView && (
                        <Table.Td style={{ width: '80px', minWidth: '70px', flexShrink: 0, height: '60px' }}>
                          <Group gap={0} justify="flex-end">
                            <Skeleton className="h-[24px] w-[24px] rounded-full" />
                            <Skeleton className="h-[24px] w-[24px] rounded-full ml-1" />
                          </Group>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                </>
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={fullView ? 7 : 4}>
                    <div className="flex flex-col items-center justify-center gap-4 py-6">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20">
                        <Users className="h-8 w-8 text-green-500 dark:text-green-400" strokeWidth={1.5} />
                      </div>
                      <div className="space-y-2 text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{searchQuery ? 'No students found' : 'No students enrolled'}</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {searchQuery
                            ? `No students match "${searchQuery}". Try adjusting your search terms.`
                            : 'Get started by enrolling your first student in a training program.'}
                        </p>
                      </div>
                    </div>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center relative">
            <div className="flex-[2] flex justify-center min-w-0">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="default"
                      className="gap-1 pl-2.5"
                      onClick={handlePrevious}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                  </PaginationItem>
                  {paginationItems}
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="default"
                      className="gap-1 pr-2.5"
                      onClick={handleNext}
                      disabled={!pagination.hasNext}
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {!loading && pagination.totalStudents > 0 && (
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Showing {students.length} of {pagination.totalStudents} students
          </div>
        )}
      </CardContent>
    </Card>
  );
}

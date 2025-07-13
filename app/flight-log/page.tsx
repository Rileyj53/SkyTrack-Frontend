'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import FlightLogTable from '@/components/flight-log-table';
import { MainNav } from '@/components/main-nav-new';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UserData {
  user: {
    email: string;
    role: string;
    school_id: string;
    school: {
      name: string;
      address: {
        city: string;
        state: string;
      };
    };
  };
}

export default function FlightLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/me`;
        const response = await fetch(apiUrl, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
            'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();

        if (data.success && data.data) {
          if (data.data.user && data.data.user.school_id) {
            localStorage.setItem('schoolId', data.data.user.school_id);
          }
          setUserData(data.data);
        } else {
          console.error('Invalid user data response format:', data);
          throw new Error(data.message || 'Failed to fetch user data');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div style={{ height: '100vh' }}>
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <MainNav />
        </div>
        <div style={{ paddingTop: '5rem', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: '1', overflow: 'hidden' }}>
            <Card className="h-full">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              {/* Search and Filters Skeleton */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <Skeleton className="h-9 w-full sm:w-64" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Filter Bar Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-2 hidden sm:block">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-2 hidden lg:block">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="space-y-2 hidden xl:block">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>

              {/* Table Skeleton - Responsive */}
              <div className="w-full overflow-x-auto">
                <div className="rounded-md border min-w-[800px]">
                  <div className="border-b p-4">
                    <div className="grid grid-cols-10 gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>

                  {/* Table Rows Skeleton */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border-b p-4 last:border-b-0">
                      <div className="grid grid-cols-10 gap-4 items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh' }}>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>
      <div style={{ paddingTop: '5rem', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '1', overflow: 'hidden' }}>
          <FlightLogTable />
        </div>
      </div>
    </div>
  );
}

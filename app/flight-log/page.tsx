'use client';

import { useEffect, useState, Suspense } from 'react';
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

// Loading fallback component
function FlightLogTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-1/3">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
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
          if (data.data.user && data.data.user.organizationId) {
            localStorage.setItem('organizationId', data.data.user.organizationId);
          } else if (data.data.user && data.data.user.school_id) {
            // Fallback for legacy data
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

  return (
    <div style={{ height: '100vh' }}>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>
      <div style={{ paddingTop: '5rem', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '1', overflow: 'hidden' }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Flight Log</h1>
          </div>
          <Suspense fallback={<FlightLogTableSkeleton />}>
            <FlightLogTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('token')?.value

  // Get token from Authorization header (for localStorage)
  const authHeader = request.headers.get('Authorization')
  const authToken = authHeader?.replace('Bearer ', '')

  const path = request.nextUrl.pathname

  // List of protected routes
  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/instructors',
    '/students',
    '/aircraft',
    '/schedule',
    '/flight-tracking'
  ]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  if (isProtectedRoute && !token && !authToken) {
    // Redirect to login if trying to access a protected route without a token
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', path)
    return NextResponse.redirect(loginUrl)
  }

  // If we have a token, add it to the request headers for the API
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  } else if (authToken) {
    requestHeaders.set('Authorization', `Bearer ${authToken}`)
  }

  // Return the response with the modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Configure which routes to run the middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/instructors/:path*',
    '/students/:path*',
    '/aircraft/:path*',
    '/schedule/:path*',
    '/flight-tracking/:path*'
  ]
} 
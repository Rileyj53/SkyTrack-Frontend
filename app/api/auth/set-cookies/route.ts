import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ success: true })
  
  // Set the token cookie with HttpOnly flag
  response.cookies.set({
    name: 'token',
    value: process.env.NEXT_PUBLIC_JWT_TOKEN || '',
    httpOnly: true,
    path: '/',
    expires: new Date('2025-04-24T04:33:25.000Z')
  })

  // Set the csrf-token cookie
  response.cookies.set({
    name: 'csrf-token',
    value: process.env.NEXT_PUBLIC_CSRF_TOKEN || '',
    path: '/',
    secure: true,
    expires: new Date('2025-04-18T01:45:53.000Z')
  })

  return response
} 
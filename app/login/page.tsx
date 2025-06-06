"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mfaToken, setMfaToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresMFA, setRequiresMFA] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Attempting login with:', { email })
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') // Remove trailing slash if present
      console.log('API URL:', apiUrl)
      console.log('Full request URL:', `${apiUrl}/auth/login`)
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'  // Important: include credentials to receive cookies
      })

      const data = await response.json()

      // Check if MFA is required first (even with 401 status)
      if (data.requiresMFA) {
        console.log('MFA verification required')
        setRequiresMFA(true)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        // Handle API error response
        if (data.error && data.error.message) {
          throw new Error(data.error.message)
        }
        throw new Error("Login failed")
      }

      // Handle successful login
      await handleSuccessfulLogin(data)
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during login')
      setIsLoading(false)
    }
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Attempting MFA verification with:', { email, token: mfaToken })
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({ 
          email, 
          password, 
          token: mfaToken 
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle API error response
        if (data.error && data.error.message) {
          throw new Error(data.error.message)
        }
        throw new Error("MFA verification failed")
      }

      // Handle successful login
      await handleSuccessfulLogin(data)
    } catch (err) {
      console.error('MFA verification error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during MFA verification')
      setIsLoading(false)
    }
  }

  const handleSuccessfulLogin = async (data: any) => {
    // Handle successful login
    if (!data.token) {
      throw new Error("Invalid response from server")
    }

    // Store CSRF token in both cookie and localStorage
    if (data.csrfToken) {
      localStorage.setItem("csrfToken", data.csrfToken)
      // Set CSRF token cookie - domain will default to current domain
      const csrfCookieOptions = [
        `csrf-token=${data.csrfToken}`,
        'path=/',
        'max-age=86400',
        'secure',
        'samesite=lax'
      ].join('; ')
      document.cookie = csrfCookieOptions
    }

    // Store token in localStorage as backup
    localStorage.setItem("token", data.token)
    
    // Set auth token cookie - domain will default to current domain
    const cookieOptions = [
      `token=${data.token}`,
      'path=/',
      'max-age=86400',
      'secure',
      'samesite=lax'
    ].join('; ')
    document.cookie = cookieOptions

    // Decode the JWT token to get the payload
    const base64Url = data.token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    const payload = JSON.parse(jsonPayload)
    console.log('Decoded token payload:', { role: payload.role })

    // Store the user role in localStorage
    localStorage.setItem("role", payload.role)
    console.log("Stored user role in localStorage:", payload.role)

    // Redirect based on role
    switch (payload.role) {
      case 'student':
        console.log('Redirecting to student dashboard')
        router.push('/student')
        break
      case 'sys_admin':
        console.log('Redirecting to admin dashboard')
        router.push('/admin')
        break
      case 'school_admin':
      case 'instructor':
        console.log('Redirecting to Dashboard')
        router.push('/dashboard')
        break
      default:
        console.error('Invalid role:', payload.role)
        throw new Error('Invalid role')
    }
  }

  const handleBackToLogin = () => {
    setRequiresMFA(false)
    setMfaToken("")
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md border-none shadow-lg dark:shadow-none dark:border dark:border-border bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {requiresMFA ? "Two-Factor Authentication" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-center">
            {requiresMFA 
              ? "Enter the 6-digit code from your authenticator app" 
              : "Enter your credentials to access your account"
            }
          </CardDescription>
        </CardHeader>
        
        {!requiresMFA ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Logging in...</span>
                  </div>
                ) : "Login"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleMFASubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="mfaToken" className="text-foreground">Authentication Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mfaToken"
                    type="text"
                    placeholder="000000"
                    value={mfaToken}
                    onChange={(e) => {
                      // Only allow numeric input and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setMfaToken(value)
                    }}
                    className="pl-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || mfaToken.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Verifying...</span>
                  </div>
                ) : "Verify Code"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleBackToLogin}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
} 
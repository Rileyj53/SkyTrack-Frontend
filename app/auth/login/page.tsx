"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBackground } from "@/contexts/background-context"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mfaToken, setMfaToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresMFA, setRequiresMFA] = useState(false)
  const { backgroundData, isLoaded: imageLoaded } = useBackground()

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

      const responseData = await response.json()

      // Check if MFA is required first (even with 401 status)
      if (responseData.data?.requiresMFA) {
        console.log('MFA verification required')
        setRequiresMFA(true)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        // Handle API error response
        if (responseData.error && responseData.error.message) {
          throw new Error(responseData.error.message)
        }
        throw new Error("Login failed")
      }

      // Handle successful login
      await handleSuccessfulLogin(responseData)
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

      const responseData = await response.json()

      if (!response.ok) {
        // Handle API error response
        if (responseData.error && responseData.error.message) {
          throw new Error(responseData.error.message)
        }
        throw new Error("MFA verification failed")
      }

      // Handle successful login
      await handleSuccessfulLogin(responseData)
    } catch (err) {
      console.error('MFA verification error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during MFA verification')
      setIsLoading(false)
    }
  }

  const handleSuccessfulLogin = async (responseData: any) => {
    // Extract data from the new response structure
    const data = responseData.data
    
    // Handle successful login
    if (!data?.token) {
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

    // Get user role from the user object in the response
    const userRole = data.user?.role
    if (!userRole) {
      throw new Error("User role not found in response")
    }

    console.log('User role from response:', userRole)

    // Store the user role in localStorage
    localStorage.setItem("role", userRole)
    console.log("Stored user role in localStorage:", userRole)

    // Store additional user info if available
    if (data.user) {
      console.log('🔍 LOGIN DEBUG - Full user object:', data.user);
      console.log('🔍 LOGIN DEBUG - organization_id in user:', data.user.organization_id);
      localStorage.setItem("user", JSON.stringify(data.user))
      
      // Store organization ID for API calls
      if (data.user.organizationId) {
        console.log('🔍 LOGIN DEBUG - Storing organizationId:', data.user.organizationId);
        localStorage.setItem("organizationId", data.user.organizationId)
      } else {
        console.log('🔍 LOGIN DEBUG - No organizationId found in user object');
      }
    } else {
      console.log('🔍 LOGIN DEBUG - No user object in response data');
    }

    // Redirect based on role
    switch (userRole) {
      case 'student':
        console.log('Redirecting to student dashboard')
        router.push('/dashboard')
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
        console.error('Invalid role:', userRole)
        throw new Error('Invalid role')
    }
  }

  const handleBackToLogin = () => {
    setRequiresMFA(false)
    setMfaToken("")
    setError(null)
  }

  // Don't render anything until image is loaded
  if (!imageLoaded) {
    return null
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 relative animate-in fade-in duration-700 bg-background"
      style={{
        backgroundImage: backgroundData ? `url(${backgroundData.image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Albatross Logo and Brand */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="https://d2xuqrfsvdwxue.cloudfront.net/images/Albatross.png"
              alt="Albatross Logo"
              width={80}
              height={80}
              className="brightness-0 dark:brightness-0 dark:invert"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Albatross
          </h1>
        </div>

        <Card className="border-none shadow-lg dark:shadow-none dark:border dark:border-border bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            {requiresMFA ? "Two-Factor Authentication" : "Welcome Back"}
          </CardTitle>
          {requiresMFA && (
            <CardDescription className="text-center">
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          )}
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link 
                    href="/auth/request_reset"
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
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
      
      {/* Attribution */}
      {backgroundData && (
        <div className="absolute bottom-4 right-4 text-xs text-white/80 bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
          <div dangerouslySetInnerHTML={{ __html: backgroundData.attribution }} />
        </div>
      )}
    </div>
  )
} 
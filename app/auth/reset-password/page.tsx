"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBackground } from "@/contexts/background-context"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { backgroundData, isLoaded: imageLoaded } = useBackground()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError("Invalid or missing reset token")
      return
    }
    setToken(tokenParam)
  }, [searchParams])

  const validatePasswords = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError("Invalid reset token")
      return
    }

    if (!validatePasswords()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('Completing password reset with token:', token)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
      console.log('API URL:', apiUrl)
      console.log('Full request URL:', `${apiUrl}/auth/reset-password/complete`)
      
      const response = await fetch(`${apiUrl}/auth/reset-password/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({ 
          token,
          password 
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Handle API error response
        if (responseData.error && responseData.error.message) {
          throw new Error(responseData.error.message)
        }
        throw new Error("Failed to reset password")
      }

      // Handle successful reset
      console.log('Password reset successful:', responseData)
      setSuccess(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while resetting password')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything until image is loaded
  if (!imageLoaded) {
    return null
  }

  // If no token, show error state
  if (!token && !error) {
    return null // Still loading token from URL
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
          {!success ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-3xl font-bold text-center">
                  Set New Password
                </CardTitle>
                <CardDescription className="text-center">
                  Enter your new password below
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Resetting Password...</span>
                      </div>
                    ) : "Reset Password"}
                  </Button>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            </>
          ) : (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Password Reset Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been successfully reset. You can now log in with your new password.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button className="w-full">
                    Continue to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
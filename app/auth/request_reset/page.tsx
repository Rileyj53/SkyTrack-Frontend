"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBackground } from "@/contexts/background-context"

export default function RequestResetPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { backgroundData, isLoaded: imageLoaded } = useBackground()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Requesting password reset for:', { email })
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') // Remove trailing slash if present
      console.log('API URL:', apiUrl)
      console.log('Full request URL:', `${apiUrl}/auth/reset-password/request`)
      
      const response = await fetch(`${apiUrl}/auth/reset-password/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({ email }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Handle API error response
        if (responseData.error && responseData.error.message) {
          throw new Error(responseData.error.message)
        }
        throw new Error("Failed to send reset email")
      }

      // Handle successful request
      setSuccess(true)
    } catch (err) {
      console.error('Password reset request error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while requesting password reset')
    } finally {
      setIsLoading(false)
    }
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
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          
          {!success ? (
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
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Sending...</span>
                    </div>
                  ) : "Send Reset Link"}
                </Button>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => {
                        setSuccess(false)
                        setEmail("")
                        setError(null)
                      }}
                      className="text-primary hover:text-primary/80 underline font-medium"
                    >
                      try again
                    </button>.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
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
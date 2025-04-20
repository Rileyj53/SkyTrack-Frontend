"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserData {
  user: {
    email: string
    role: string
    first_name: string
    last_name: string
    school?: {
      name: string
      address: {
        city: string
        state: string
      }
    }
  }
}

export function UserNav() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.API_KEY || "",
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }

        const data = await response.json()
        setUserData(data)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      const csrfToken = localStorage.getItem("csrfToken")

      // Call the logout endpoint
      const response = await fetch(`${process.env.API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": csrfToken || ""
        },
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      // Clear local storage
      localStorage.removeItem("token")
      localStorage.removeItem("csrfToken")

      // Redirect to login
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      // Still clear local storage and redirect even if the API call fails
      localStorage.removeItem("token")
      localStorage.removeItem("csrfToken")
      router.push("/login")
    }
  }

  if (!userData) return null

  // Get user initials and full name, with fallbacks
  const initials = userData.user.first_name && userData.user.last_name
    ? `${userData.user.first_name[0]}${userData.user.last_name[0]}`
    : userData.user.email[0].toUpperCase()
  
  const fullName = userData.user.first_name && userData.user.last_name
    ? `${userData.user.first_name} ${userData.user.last_name}`
    : userData.user.email

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex flex-col items-end mr-1">
        <p className="text-sm font-medium leading-none">{fullName}</p>
        <p className="text-xs text-muted-foreground">{userData.user.email}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userData.user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

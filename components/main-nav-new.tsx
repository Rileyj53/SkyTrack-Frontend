"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LogOut, Settings, User, LayoutDashboard, BookOpen, Calendar, GraduationCap, Plane, Users, Receipt, UserCog } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/components/theme-provider"

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/flight-log', label: 'Flight Log', icon: BookOpen },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/students', label: 'Students', icon: GraduationCap },
  { href: '/aircraft', label: 'Aircraft', icon: Plane },
  { href: '/instructors', label: 'Instructors', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
]

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

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }

        const responseData = await response.json()
        // Extract user data from the new response structure
        const data = responseData.data
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
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
      localStorage.removeItem("role")
      localStorage.removeItem("user")

      // Redirect to login
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      // Still clear local storage and redirect even if the API call fails
      localStorage.removeItem("token")
      localStorage.removeItem("csrfToken")
      localStorage.removeItem("role")
      localStorage.removeItem("user")
      router.push("/login")
    }
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }



  const getThemeLabel = () => {
    switch(theme) {
      case "light": return "Light"
      case "dark": return "Dark"
      case "system": return "System"
      default: return "Light"
    }
  }

  const isActiveLink = (href: string) => {
    if (href === '/students') {
      return pathname === '/students' || pathname.startsWith('/students/')
    }
    return pathname === href
  }

  const navItems = links.map((link) => (
    <Link
      key={link.label}
      href={link.href}
      className={cn(
        "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "hover:bg-muted hover:text-foreground",
        isActiveLink(link.href)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground"
      )}
      onClick={() => setMobileMenuOpen(false)}
    >
      {link.label}
    </Link>
  ))

  // Get user initials and full name, with fallbacks
  const initials = userData?.user.first_name && userData?.user.last_name
    ? `${userData.user.first_name[0]}${userData.user.last_name[0]}`
    : userData?.user.email[0].toUpperCase() || 'U'
  
  const fullName = userData?.user.first_name && userData?.user.last_name
    ? `${userData.user.first_name} ${userData.user.last_name}`
    : userData?.user.email || 'User'

  // Format role for better display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2 flex-1 justify-start">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image 
              src="/Albatross.png" 
              alt="Albatross Logo" 
              width={50} 
              height={50} 
              className="w-12 h-12"
            />
            <span className="hidden font-bold sm:inline-block">
              Albatross
              <span className="hidden 2xl:inline">
                {userData?.user.school?.name ? ` - ${userData.user.school.name}` : ''}
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <div className="flex items-center justify-center flex-shrink-0">
          <nav className="hidden lgx:flex items-center space-x-1">
            {navItems}
          </nav>
        </div>

        {/* Right: Desktop User Nav & Mobile Menu Button */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Desktop User Navigation */}
          {userData && (
            <div className="hidden md:flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end mr-1">
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
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuItem className="p-4 focus:bg-transparent hover:bg-transparent cursor-default">
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-base">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-none truncate">{fullName}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{userData.user.email}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{formatRole(userData.user.role)}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <UserCog className="mr-3 h-4 w-4" />
                      <span>Account settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lgx:hidden p-2 rounded-md hover:bg-muted"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {mounted && mobileMenuOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[9998] lgx:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-[9999] lgx:hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Image 
                    src="/Albatross.png" 
                    alt="Albatross Logo" 
                    width={20} 
                    height={20} 
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Albatross</span>
                  {userData?.user.school?.name && (
                    <span className="text-xs text-muted-foreground font-medium">{userData.user.school.name}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {links.map((link, index) => {
                  const IconComponent = link.icon
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        "hover:bg-muted/60 hover:text-foreground hover:scale-[1.01] hover:shadow-sm",
                        "active:scale-[0.99]",
                        isActiveLink(link.href)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isActiveLink(link.href)
                          ? "bg-primary-foreground/20"
                          : "bg-muted/40"
                      )}>
                        <IconComponent className="h-3.5 w-3.5 flex-shrink-0" />
                      </div>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Mobile User Section */}
            {userData && (
              <div className="border-t border-border/60 p-4 space-y-3 bg-muted/20">
                {/* User Info */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background/80 border border-border/40">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold leading-none truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{userData.user.email}</p>
                  </div>
                </div>
                
                {/* User Actions */}
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-background/60 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="p-1.5 rounded-md bg-muted/40">
                      <User className="h-3.5 w-3.5 flex-shrink-0" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </Link>
                  
                  {/* Mobile Theme Toggle */}
                  <button
                    onClick={cycleTheme}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-background/60 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] w-full text-left"
                  >
                    <div className="p-1.5 rounded-md bg-muted/40">
                      <Settings className="h-3.5 w-3.5 flex-shrink-0" />
                    </div>
                    <span className="font-medium flex-1">Theme</span>
                    <div className="text-xs bg-muted/60 px-2 py-1 rounded-md">
                      <span>{getThemeLabel()}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] w-full text-left"
                  >
                    <div className="p-1.5 rounded-md bg-muted/40">
                      <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
                    </div>
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </header>
  )
}

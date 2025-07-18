"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#contact', label: 'Contact' },
]

const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  e.preventDefault()
  const targetId = href.replace('#', '')
  const targetElement = document.getElementById(targetId)
  
  if (targetElement) {
    const headerHeight = 80 // Account for navbar height + some padding
    
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    
    // Adjust for fixed header after scroll
    setTimeout(() => {
      window.scrollBy(0, -headerHeight)
    }, 100)
  }
}

export function HomeNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  const navItems = navLinks.map((link) => (
    <a
      key={link.label}
      href={link.href}
      className={cn(
        "block px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
        "hover:bg-gray-800/50 hover:text-white",
        "text-gray-300"
      )}
      onClick={(e) => {
        handleSmoothScroll(e, link.href)
        setMobileMenuOpen(false)
      }}
    >
      {link.label}
    </a>
  ))

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-700/50 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2 flex-1 justify-start">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/Albatross.png" 
              alt="Albatross Logo" 
              width={50} 
              height={50} 
              className="w-12 h-12"
            />
            <span className="font-bold text-white">
              Albatross
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <div className="flex items-center justify-center flex-shrink-0">
          <nav className="hidden md:flex items-center space-x-8">
            {navItems}
          </nav>
        </div>

        {/* Right: Desktop Actions & Mobile Menu Button */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50" asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={(e) => handleSmoothScroll(e as any, '#contact')}
            >
              Learn More
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-800/50 transition-colors text-white"
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
            className="fixed inset-0 bg-black/60 z-[9998] md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="fixed right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-md border-l border-gray-700/50 z-[9999] md:hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ease-out overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/60">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Image 
                    src="/Albatross.png" 
                    alt="Albatross Logo" 
                    width={20} 
                    height={20} 
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">Albatross</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-800/50 transition-colors text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {navLinks.map((link, index) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "block px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      "text-gray-300 hover:text-white hover:bg-gray-800/60 hover:scale-[1.01]",
                      "active:scale-[0.99]"
                    )}
                    onClick={(e) => {
                      handleSmoothScroll(e, link.href)
                      setMobileMenuOpen(false)
                    }}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* Mobile Actions */}
            <div className="border-t border-gray-700/60 p-4 space-y-3">
              <Button 
                variant="ghost" 
                className="w-full text-gray-300 hover:text-white hover:bg-gray-800/50 justify-start"
                onClick={() => setMobileMenuOpen(false)}
                asChild
              >
                <Link href="/auth/login">Log In</Link>
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={(e) => {
                  handleSmoothScroll(e as any, '#contact')
                  setMobileMenuOpen(false)
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  )
} 
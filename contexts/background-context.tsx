"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface BackgroundData {
  image_url: string
  attribution: string
}

interface BackgroundContextType {
  backgroundData: BackgroundData | null
  isLoaded: boolean
  loadRandomBackground: () => void
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined)

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundData, setBackgroundData] = useState<BackgroundData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const loadRandomBackground = async () => {
    try {
      const response = await fetch('/backgrounds.json')
      const data = await response.json()
      
      if (data && data.length > 0) {
        // Pick a random background image
        const randomIndex = Math.floor(Math.random() * data.length)
        const selectedBackground = data[randomIndex]
        
        // Preload the image
        const img = new window.Image()
        img.onload = () => {
          setBackgroundData(selectedBackground)
          setIsLoaded(true)
        }
        img.onerror = () => {
          console.error('Error loading background image:', selectedBackground.image_url)
          setIsLoaded(true) // Continue without background
        }
        img.src = selectedBackground.image_url
      }
    } catch (error) {
      console.error('Error loading background data:', error)
      setIsLoaded(true) // Continue without background
    }
  }

  useEffect(() => {
    if (!backgroundData && !isLoaded) {
      loadRandomBackground()
    }
  }, [backgroundData, isLoaded])

  return (
    <BackgroundContext.Provider value={{ backgroundData, isLoaded, loadRandomBackground }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const context = useContext(BackgroundContext)
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider')
  }
  return context
} 
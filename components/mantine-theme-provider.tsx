"use client"

import { MantineProvider, createTheme } from '@mantine/core'
import { useTheme } from './theme-provider'
import { useEffect, useState } from 'react'

const theme = createTheme({
  // You can customize Mantine's theme here if needed
})

export function MantineThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme } = useTheme()
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    if (currentTheme === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setColorScheme(systemPrefersDark ? 'dark' : 'light')
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setColorScheme(e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setColorScheme(currentTheme as 'light' | 'dark')
    }
  }, [currentTheme])

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      {children}
    </MantineProvider>
  )
} 
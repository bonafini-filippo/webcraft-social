'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../providers/ThemeProvider'
import { Button } from './Button'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor size={16} />
    }
    return resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />
  }

  const getTitle = () => {
    if (theme === 'system') {
      return 'System theme'
    }
    return resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'
  }

  // Don't render anything on the server, only after mount
  if (!mounted) {
    return (
      <div className="w-9 h-9 p-0 inline-flex items-center justify-center">
        {/* Empty placeholder to maintain layout */}
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={getTitle()}
      className="w-9 h-9 p-0"
    >
      {getIcon()}
    </Button>
  )
} 